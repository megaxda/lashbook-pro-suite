-- Add birthday to clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS birthday date;

-- Add consent_signed_at to fichas
ALTER TABLE public.fichas ADD COLUMN IF NOT EXISTS consent_signed_at timestamptz;

-- Add unique constraint on slug (only for non-null values)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_slug_unique UNIQUE (slug);

-- Create trigger function to prevent role changes by non-service-role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF current_setting('role') != 'service_role' THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- Add UPDATE policy on fichas-fotos storage bucket
CREATE POLICY "Users can update own fichas-fotos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'fichas-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Reconnect handle_new_user trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
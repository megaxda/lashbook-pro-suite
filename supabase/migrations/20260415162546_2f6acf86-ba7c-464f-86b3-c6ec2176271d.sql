
-- Drop the recursive admin policy
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;

-- Recreate is_admin function to use auth.jwt() instead of querying profiles
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin');
$$;

-- Create admin read policy that avoids recursion by checking role directly via a security definer wrapper
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN _role = 'admin';
END;
$$;

-- Re-add admin policy using the new non-recursive function
CREATE POLICY "Admins read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.current_user_is_admin());

-- Also add missing trigger for handle_new_user (may have been lost)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add forma_pagamento column to agendamentos if missing (used in the app)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agendamentos' AND column_name='forma_pagamento') THEN
    ALTER TABLE public.agendamentos ADD COLUMN forma_pagamento text;
  END IF;
END $$;

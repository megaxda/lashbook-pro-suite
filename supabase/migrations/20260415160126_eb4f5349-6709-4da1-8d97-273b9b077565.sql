
-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Fix public bucket listing - restrict to user's own folder or direct file access
DROP POLICY "Public avatar read" ON storage.objects;
CREATE POLICY "Public avatar read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'anon'));

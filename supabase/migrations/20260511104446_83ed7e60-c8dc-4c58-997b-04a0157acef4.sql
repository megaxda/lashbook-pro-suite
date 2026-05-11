
-- Enable extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Replace comprovantes policies so the professional (owner of the slug folder) can read/delete
DROP POLICY IF EXISTS "User read comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "User delete comprovantes" ON storage.objects;

CREATE POLICY "Owner reads comprovantes by slug"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprovantes'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.slug = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Owner deletes comprovantes by slug"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comprovantes'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.slug = (storage.foldername(name))[1]
  )
);

-- Service role full access (for cleanup edge function)
CREATE POLICY "Service role manages comprovantes"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'comprovantes')
WITH CHECK (bucket_id = 'comprovantes');

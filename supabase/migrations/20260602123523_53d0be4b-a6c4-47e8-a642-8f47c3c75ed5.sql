-- Tighten comprovantes storage policies
DROP POLICY IF EXISTS "Public can read own uploaded comprovante" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload comprovantes" ON storage.objects;

-- Allow anonymous/public uploads only into a folder that matches an existing profile slug
CREATE POLICY "Public can upload comprovantes to valid slug folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'comprovantes'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.slug = (storage.foldername(name))[1]
  )
);
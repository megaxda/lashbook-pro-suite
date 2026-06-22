DROP POLICY IF EXISTS "Public read profissionais by owner" ON public.profissionais;
REVOKE SELECT ON public.profissionais FROM anon;
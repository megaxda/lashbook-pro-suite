-- Promover nathancarvalhon@gmail.com a admin assim que ele se cadastrar (e agora caso já exista)
-- 1) Atualizar agora se já existir
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE lower(email) = 'nathancarvalhon@gmail.com');

-- 2) Trigger no signup para promover automaticamente caso ele se cadastre depois
CREATE OR REPLACE FUNCTION public.auto_promote_known_admins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) IN ('nathancarvalhon@gmail.com') THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_promote_known_admins ON public.profiles;
CREATE TRIGGER trg_auto_promote_known_admins
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_promote_known_admins();
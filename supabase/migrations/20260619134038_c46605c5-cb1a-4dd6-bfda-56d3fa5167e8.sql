
-- 1) Remove hardcoded admin auto-promotion
DROP TRIGGER IF EXISTS trg_auto_promote_known_admins ON public.profiles;
DROP FUNCTION IF EXISTS public.auto_promote_known_admins() CASCADE;

-- 2) Server-side account-active helper
CREATE OR REPLACE FUNCTION public.account_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin'
         OR access_expires_at IS NULL
         OR access_expires_at > now()
       FROM public.profiles
       WHERE id = auth.uid()),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.account_is_active() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.account_is_active() TO authenticated;

-- 3) Tighten RLS: require auth.uid() = user_id AND account_is_active()
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clientes','financeiro','fichas','agendamentos',
    'follow_ups','bloqueios_agenda','servicos','estoque'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Own data" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Own data active" ON public.%I
         FOR ALL TO authenticated
         USING (auth.uid() = user_id AND public.account_is_active())
         WITH CHECK (auth.uid() = user_id AND public.account_is_active())',
      t
    );
  END LOOP;
END$$;

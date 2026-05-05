-- Relaxar a checagem para permitir migrations (postgres/supabase_admin) além de service_role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Agora criar a conta
DO $$
DECLARE
  _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'nathancarvalhon@gmail.com';

  IF _uid IS NULL THEN
    _uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      _uid,
      'authenticated',
      'authenticated',
      'nathancarvalhon@gmail.com',
      crypt('63524163', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Nathan Carvalho"}'::jsonb,
      '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      _uid,
      jsonb_build_object('sub', _uid::text, 'email', 'nathancarvalhon@gmail.com', 'email_verified', true),
      'email',
      _uid::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (_uid, COALESCE((SELECT nome FROM public.profiles WHERE id = _uid), 'Nathan Carvalho'), 'nathancarvalhon@gmail.com', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
END $$;
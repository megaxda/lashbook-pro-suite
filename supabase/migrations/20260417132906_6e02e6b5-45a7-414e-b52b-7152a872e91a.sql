-- Public function: get profile by slug (only safe fields)
CREATE OR REPLACE FUNCTION public.get_public_profile_by_slug(_slug text)
RETURNS TABLE (
  id uuid,
  nome text,
  studio_name text,
  bio text,
  foto_url text,
  instagram text,
  whatsapp text,
  site text,
  outros_links jsonb,
  studio_hours jsonb,
  cobrar_sinal boolean,
  valor_sinal numeric,
  pix_key text,
  pix_key_type text,
  slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, studio_name, bio, foto_url, instagram, whatsapp, site,
         outros_links, studio_hours, cobrar_sinal, valor_sinal, pix_key, pix_key_type, slug
  FROM public.profiles
  WHERE slug = _slug
  LIMIT 1;
$$;

-- Public function: get active services for a profile by slug
CREATE OR REPLACE FUNCTION public.get_public_services_by_slug(_slug text)
RETURNS TABLE (
  id uuid,
  nome text,
  descricao text,
  duracao integer,
  preco numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.nome, s.descricao, s.duracao, s.preco
  FROM public.servicos s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE p.slug = _slug AND s.ativo = true
  ORDER BY s.nome;
$$;

-- Public function: create a booking from the public Link Bio (origem = 'link_bio')
CREATE OR REPLACE FUNCTION public.create_public_booking(
  _slug text,
  _servico_id uuid,
  _data date,
  _horario time,
  _nome text,
  _telefone text,
  _email text,
  _notas text,
  _comprovante_url text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _cliente_id uuid;
  _agendamento_id uuid;
BEGIN
  SELECT id INTO _user_id FROM public.profiles WHERE slug = _slug LIMIT 1;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  -- Try to find existing client by phone for same professional
  SELECT id INTO _cliente_id FROM public.clientes
   WHERE user_id = _user_id AND (telefone = _telefone OR (email = _email AND _email IS NOT NULL AND _email <> ''))
   LIMIT 1;

  IF _cliente_id IS NULL THEN
    INSERT INTO public.clientes (user_id, nome, telefone, email, status)
    VALUES (_user_id, _nome, _telefone, NULLIF(_email, ''), 'ativa')
    RETURNING id INTO _cliente_id;
  END IF;

  INSERT INTO public.agendamentos (user_id, cliente_id, servico_id, data, horario, status, origem, notas, comprovante_url, sinal_pago)
  VALUES (_user_id, _cliente_id, _servico_id, _data, _horario, 'pendente', 'link_bio', _notas, _comprovante_url, _comprovante_url IS NOT NULL)
  RETURNING id INTO _agendamento_id;

  RETURN _agendamento_id;
END;
$$;

-- Allow anon and authenticated to call the public RPCs
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_services_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_booking(text, uuid, date, time, text, text, text, text, text) TO anon, authenticated;

-- Storage policy: allow public uploads to "comprovantes" bucket (for PIX receipts)
CREATE POLICY "Public can upload comprovantes"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'comprovantes');

CREATE POLICY "Public can read own uploaded comprovante"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'comprovantes');
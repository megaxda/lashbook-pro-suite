
-- Tighten EXECUTE on SECURITY DEFINER helper that should be auth-only
REVOKE EXECUTE ON FUNCTION public.check_slug_available(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO authenticated;

-- Public booking helpers: explicit grant to anon + authenticated, remove broad PUBLIC
REVOKE EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_services_by_slug(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_blocked_slots_by_slug(text, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_public_booking(text, uuid, date, time, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_services_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_blocked_slots_by_slug(text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_booking(text, uuid, date, time, text, text, text, text, text) TO anon, authenticated;

-- Server-side input length validation on public booking
CREATE OR REPLACE FUNCTION public.create_public_booking(_slug text, _servico_id uuid, _data date, _horario time without time zone, _nome text, _telefone text, _email text, _notas text, _comprovante_url text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _cliente_id uuid;
  _agendamento_id uuid;
  _blocked boolean;
BEGIN
  -- Server-side input validation (defense in depth)
  IF _nome IS NULL OR length(btrim(_nome)) < 2 OR length(_nome) > 100 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;
  IF _telefone IS NULL OR length(_telefone) < 8 OR length(_telefone) > 30 THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;
  IF _email IS NOT NULL AND length(_email) > 255 THEN
    RAISE EXCEPTION 'Email muito longo';
  END IF;
  IF _notas IS NOT NULL AND length(_notas) > 500 THEN
    RAISE EXCEPTION 'Observações muito longas (máx 500)';
  END IF;
  IF _comprovante_url IS NOT NULL AND length(_comprovante_url) > 500 THEN
    RAISE EXCEPTION 'URL do comprovante inválida';
  END IF;
  IF _data < CURRENT_DATE THEN
    RAISE EXCEPTION 'Data inválida';
  END IF;

  SELECT id INTO _user_id FROM public.profiles WHERE slug = _slug LIMIT 1;
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Profissional não encontrado'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.bloqueios_agenda b
    WHERE b.user_id = _user_id AND b.data = _data
      AND (
        b.dia_todo = true
        OR (b.hora_inicio IS NOT NULL AND b.hora_fim IS NOT NULL
            AND _horario >= b.hora_inicio AND _horario < b.hora_fim)
      )
  ) INTO _blocked;
  IF _blocked THEN RAISE EXCEPTION 'Horário indisponível'; END IF;

  SELECT id INTO _cliente_id FROM public.clientes
   WHERE user_id = _user_id AND (telefone = _telefone OR (email = _email AND _email IS NOT NULL AND _email <> ''))
   LIMIT 1;

  IF _cliente_id IS NULL THEN
    INSERT INTO public.clientes (user_id, nome, telefone, email, status)
    VALUES (_user_id, btrim(_nome), btrim(_telefone), NULLIF(btrim(_email), ''), 'ativa')
    RETURNING id INTO _cliente_id;
  END IF;

  INSERT INTO public.agendamentos (user_id, cliente_id, servico_id, data, horario, status, origem, notas, comprovante_url, sinal_pago)
  VALUES (_user_id, _cliente_id, _servico_id, _data, _horario, 'pendente', 'linkbio', _notas, _comprovante_url, _comprovante_url IS NOT NULL)
  RETURNING id INTO _agendamento_id;

  RETURN _agendamento_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_public_booking(text, uuid, date, time, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_booking(text, uuid, date, time, text, text, text, text, text) TO anon, authenticated;

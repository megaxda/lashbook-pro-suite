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
BEGIN
  SELECT id INTO _user_id FROM public.profiles WHERE slug = _slug LIMIT 1;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  SELECT id INTO _cliente_id FROM public.clientes
   WHERE user_id = _user_id AND (telefone = _telefone OR (email = _email AND _email IS NOT NULL AND _email <> ''))
   LIMIT 1;

  IF _cliente_id IS NULL THEN
    INSERT INTO public.clientes (user_id, nome, telefone, email, status)
    VALUES (_user_id, _nome, _telefone, NULLIF(_email, ''), 'ativa')
    RETURNING id INTO _cliente_id;
  END IF;

  INSERT INTO public.agendamentos (user_id, cliente_id, servico_id, data, horario, status, origem, notas, comprovante_url, sinal_pago)
  VALUES (_user_id, _cliente_id, _servico_id, _data, _horario, 'pendente', 'linkbio', _notas, _comprovante_url, _comprovante_url IS NOT NULL)
  RETURNING id INTO _agendamento_id;

  RETURN _agendamento_id;
END;
$function$;
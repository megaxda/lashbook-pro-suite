
-- 1) Bloqueios de agenda
CREATE TABLE IF NOT EXISTS public.bloqueios_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data date NOT NULL,
  dia_todo boolean NOT NULL DEFAULT false,
  hora_inicio time,
  hora_fim time,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own data" ON public.bloqueios_agenda
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bloqueios_user_data ON public.bloqueios_agenda(user_id, data);

-- 2) Atendimento gratuito (retrabalho) + pagamentos fracionados
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS gratuito boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pagamentos_detalhe jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Update auto-receita to skip gratuito and use pagamentos_detalhe sum if available
CREATE OR REPLACE FUNCTION public.auto_create_receita_on_concluido()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _preco numeric;
  _servico_nome text;
  _cliente_nome text;
  _exists boolean;
  _pag_total numeric;
BEGIN
  IF NEW.status IS DISTINCT FROM 'concluido' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'concluido' THEN RETURN NEW; END IF;
  IF COALESCE(NEW.gratuito, false) THEN RETURN NEW; END IF;

  SELECT EXISTS (SELECT 1 FROM public.financeiro WHERE agendamento_id = NEW.id AND tipo = 'receita') INTO _exists;
  IF _exists THEN RETURN NEW; END IF;

  SELECT preco, nome INTO _preco, _servico_nome FROM public.servicos WHERE id = NEW.servico_id;
  SELECT nome INTO _cliente_nome FROM public.clientes WHERE id = NEW.cliente_id;

  -- prefer sum of pagamentos_detalhe if present
  SELECT COALESCE(SUM((p->>'valor')::numeric), 0)
    INTO _pag_total
    FROM jsonb_array_elements(COALESCE(NEW.pagamentos_detalhe, '[]'::jsonb)) p;

  IF _pag_total > 0 THEN _preco := _pag_total; END IF;
  IF _preco IS NULL OR _preco = 0 THEN RETURN NEW; END IF;

  INSERT INTO public.financeiro (user_id, tipo, descricao, valor, data, categoria, agendamento_id)
  VALUES (NEW.user_id, 'receita',
          COALESCE(_servico_nome, 'Atendimento') || COALESCE(' — ' || _cliente_nome, ''),
          _preco, NEW.data, 'Serviços', NEW.id);
  RETURN NEW;
END;
$function$;

-- 3) RPC: bloqueios para o link bio
CREATE OR REPLACE FUNCTION public.get_blocked_slots_by_slug(_slug text, _data date)
RETURNS TABLE(dia_todo boolean, hora_inicio time, hora_fim time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.dia_todo, b.hora_inicio, b.hora_fim
  FROM public.bloqueios_agenda b
  JOIN public.profiles p ON p.id = b.user_id
  WHERE p.slug = _slug AND b.data = _data;
$$;

-- 4) Atualiza create_public_booking para validar bloqueios
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
    VALUES (_user_id, _nome, _telefone, NULLIF(_email, ''), 'ativa')
    RETURNING id INTO _cliente_id;
  END IF;

  INSERT INTO public.agendamentos (user_id, cliente_id, servico_id, data, horario, status, origem, notas, comprovante_url, sinal_pago)
  VALUES (_user_id, _cliente_id, _servico_id, _data, _horario, 'pendente', 'linkbio', _notas, _comprovante_url, _comprovante_url IS NOT NULL)
  RETURNING id INTO _agendamento_id;

  RETURN _agendamento_id;
END;
$function$;

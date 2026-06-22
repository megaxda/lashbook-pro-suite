
-- 1) Profissionais
CREATE TABLE IF NOT EXISTS public.profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cor text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissionais TO authenticated;
GRANT ALL ON public.profissionais TO service_role;
GRANT SELECT ON public.profissionais TO anon;

ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages profissionais"
  ON public.profissionais FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read profissionais by owner"
  ON public.profissionais FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_profissionais_user ON public.profissionais(user_id);

CREATE TRIGGER trg_profissionais_updated
  BEFORE UPDATE ON public.profissionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2) Agendamentos: novos campos
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS profissional_id uuid REFERENCES public.profissionais(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorrencia_intervalo_dias integer,
  ADD COLUMN IF NOT EXISTS recorrencia_fim date;

CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional ON public.agendamentos(profissional_id);

-- 3) Financeiro: profissional
ALTER TABLE public.financeiro
  ADD COLUMN IF NOT EXISTS profissional_id uuid REFERENCES public.profissionais(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financeiro_profissional ON public.financeiro(profissional_id);

-- 4) Atualizar trigger de receita automática para propagar profissional_id
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

  SELECT COALESCE(SUM((p->>'valor')::numeric), 0)
    INTO _pag_total
    FROM jsonb_array_elements(COALESCE(NEW.pagamentos_detalhe, '[]'::jsonb)) p;

  IF _pag_total > 0 THEN _preco := _pag_total; END IF;
  IF _preco IS NULL OR _preco = 0 THEN RETURN NEW; END IF;

  INSERT INTO public.financeiro (user_id, tipo, descricao, valor, data, categoria, agendamento_id, profissional_id)
  VALUES (NEW.user_id, 'receita',
          COALESCE(_servico_nome, 'Atendimento') || COALESCE(' — ' || _cliente_nome, ''),
          _preco, NEW.data, 'Serviços', NEW.id, NEW.profissional_id);
  RETURN NEW;
END;
$function$;

-- 5) Atualizar create_public_booking para aceitar profissional_id
CREATE OR REPLACE FUNCTION public.create_public_booking(
  _slug text, _servico_id uuid, _data date, _horario time without time zone,
  _nome text, _telefone text, _email text, _notas text, _comprovante_url text,
  _profissional_id uuid DEFAULT NULL
)
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
  _prof_ok boolean;
BEGIN
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

  IF _profissional_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.profissionais WHERE id = _profissional_id AND user_id = _user_id AND ativo = true) INTO _prof_ok;
    IF NOT _prof_ok THEN _profissional_id := NULL; END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.bloqueios_agenda b
    WHERE b.user_id = _user_id AND b.data = _data
      AND (b.dia_todo = true
        OR (b.hora_inicio IS NOT NULL AND b.hora_fim IS NOT NULL
            AND _horario >= b.hora_inicio AND _horario < b.hora_fim))
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

  INSERT INTO public.agendamentos (user_id, cliente_id, servico_id, data, horario, status, origem, notas, comprovante_url, sinal_pago, profissional_id)
  VALUES (_user_id, _cliente_id, _servico_id, _data, _horario, 'pendente', 'linkbio', _notas, _comprovante_url, _comprovante_url IS NOT NULL, _profissional_id)
  RETURNING id INTO _agendamento_id;

  RETURN _agendamento_id;
END;
$function$;

-- 6) Função pública para listar profissionais ativos pelo slug (link da bio)
CREATE OR REPLACE FUNCTION public.get_public_profissionais_by_slug(_slug text)
 RETURNS TABLE(id uuid, nome text, cor text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.nome, p.cor
  FROM public.profissionais p
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE pr.slug = _slug AND p.ativo = true
  ORDER BY p.nome;
$function$;

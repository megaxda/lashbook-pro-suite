-- Trigger function: when an appointment becomes "concluido", create a matching revenue row (idempotent)
CREATE OR REPLACE FUNCTION public.auto_create_receita_on_concluido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _preco numeric;
  _servico_nome text;
  _cliente_nome text;
  _exists boolean;
BEGIN
  -- Only act when status transitions TO 'concluido'
  IF NEW.status IS DISTINCT FROM 'concluido' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'concluido' THEN
    -- already was concluido, nothing to do
    RETURN NEW;
  END IF;

  -- Idempotency: skip if a receita already exists for this appointment
  SELECT EXISTS (
    SELECT 1 FROM public.financeiro
    WHERE agendamento_id = NEW.id AND tipo = 'receita'
  ) INTO _exists;

  IF _exists THEN
    RETURN NEW;
  END IF;

  -- Pull service price + name + client name
  SELECT preco, nome INTO _preco, _servico_nome
  FROM public.servicos WHERE id = NEW.servico_id;

  SELECT nome INTO _cliente_nome
  FROM public.clientes WHERE id = NEW.cliente_id;

  IF _preco IS NULL OR _preco = 0 THEN
    -- nothing to record
    RETURN NEW;
  END IF;

  INSERT INTO public.financeiro (user_id, tipo, descricao, valor, data, categoria, agendamento_id)
  VALUES (
    NEW.user_id,
    'receita',
    COALESCE(_servico_nome, 'Atendimento') || COALESCE(' — ' || _cliente_nome, ''),
    _preco,
    NEW.data,
    'Serviços',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agendamento_concluido_to_receita ON public.agendamentos;

CREATE TRIGGER trg_agendamento_concluido_to_receita
AFTER INSERT OR UPDATE OF status ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_receita_on_concluido();
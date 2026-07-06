
CREATE TABLE public.financeiro_pessoal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('receita','despesa')),
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  data date NOT NULL,
  categoria text,
  forma_pagamento text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financeiro_pessoal TO authenticated;
GRANT ALL ON public.financeiro_pessoal TO service_role;

ALTER TABLE public.financeiro_pessoal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia seus lançamentos pessoais"
  ON public.financeiro_pessoal
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX financeiro_pessoal_user_data_idx ON public.financeiro_pessoal (user_id, data DESC);

CREATE TRIGGER trg_financeiro_pessoal_updated_at
  BEFORE UPDATE ON public.financeiro_pessoal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

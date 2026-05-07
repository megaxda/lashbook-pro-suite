ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plano text DEFAULT 'basico',
  ADD COLUMN IF NOT EXISTS status_conta text DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS last_login timestamptz;
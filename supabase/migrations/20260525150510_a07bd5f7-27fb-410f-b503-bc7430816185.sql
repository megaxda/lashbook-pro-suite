ALTER TABLE public.bloqueios_agenda ADD COLUMN IF NOT EXISTS recorrencia_id uuid;
CREATE INDEX IF NOT EXISTS idx_bloqueios_agenda_recorrencia ON public.bloqueios_agenda(recorrencia_id);

ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS recorrencia_id uuid;
CREATE INDEX IF NOT EXISTS idx_agendamentos_recorrencia ON public.agendamentos(recorrencia_id);
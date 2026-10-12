-- Schema versioned for Meta 1 and Painel da Vida. It contains no client records or secrets.
-- One row per event/card, not per equipment.
CREATE TABLE IF NOT EXISTS public.cmc_agenda_reservas (
  trello_card_id text PRIMARY KEY,
  data_evento date NOT NULL,
  titulo text NOT NULL DEFAULT '',
  localidade text,
  trello_url text,
  servico text,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'suspensa')),
  origem text NOT NULL DEFAULT 'contrato_crm_cmc',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cmc_reserva_trello_id_valido CHECK (trello_card_id ~ '^[0-9a-f]{24}$')
);
CREATE INDEX IF NOT EXISTS cmc_agenda_data_status_idx ON public.cmc_agenda_reservas (data_evento, status);
ALTER TABLE public.cmc_agenda_reservas ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.cmc_agenda_reservas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.cmc_agenda_reservas TO service_role;

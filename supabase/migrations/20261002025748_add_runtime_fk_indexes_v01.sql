-- Migration applied to Supabase project "Chatbot Clique Mais"
-- Version: 20261002025748
-- Name: add_runtime_fk_indexes_v01

create index state_transitions_trigger_event_idx
  on core.state_transitions (trigger_event_id)
  where trigger_event_id is not null;

create index workflow_runs_input_event_idx
  on audit.workflow_runs (input_event_id)
  where input_event_id is not null;

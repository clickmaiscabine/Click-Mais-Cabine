# Supabase migrations

Este diretório espelha as migrations canônicas aplicadas ao projeto Supabase **Chatbot Clique Mais**.

Toda mudança estrutural no banco deve ser versionada aqui e refletida no `MANIFEST.json`.

## Camadas

### Runtime mínimo

- `20261002025715_bootstrap_event_state_runtime_v01.sql`
- `20261002025748_add_runtime_fk_indexes_v01.sql`
- `20261002030338_add_atomic_event_state_helpers_v01.sql`

Cria `core` + `audit`, idempotência e controle de concorrência da sessão.

### Click Mais OS / negócio

- `20261003050907_expand_click_mais_os_business_state_v1.sql`
- `20261003051005_add_business_stage_history_and_backend_grants_v1.sql`
- `20261003051043_fix_business_stage_transition_ambiguity_v1.sql`

Cria `business` + `integrations`, liga sessão a contato/evento e adiciona os módulos persistentes de CRM/operação.

## Regra

O schema do banco vivo e as migrations versionadas devem convergir.

Segredo, dump com PII ou dado operacional real nunca entra nesta pasta.

# Intake WhatsApp

Status: review

`intake.mjs` é o kernel puro. Não chama APIs nem calcula preço. O contrato e o mapeamento de facts/metadata estão em `docs/04_workflows/WHATSAPP_INTAKE_AUDIT_2026-10-14.md`.

`src/adapters/intake/persistence.mjs` usa SQL parametrizado e RPCs backend. `supabase/functions/quote_intake.sql` foi instalado somente em PostgreSQL isolado; não é migration de produção.

Reprodução: `npm ci --ignore-scripts`, `npm run test:intake`, `npm run build:intake`. O SDK gerado usa as mesmas funções versionadas dos testes. Fixtures adicionais: `node scripts/generate_intake_fixtures.mjs` (IDs e timestamps sintéticos novos a cada geração).

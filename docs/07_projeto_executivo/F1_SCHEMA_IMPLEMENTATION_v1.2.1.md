# F1 — Schema/Migrations DEV — implementação v1.2.1

- Status: review
- Fase: 1 — Implementação do Núcleo
- Especificação governante: Click Mais OS Fase 0 v1.2.1
- Ambiente alterado: Supabase `Chatbot Clique Mais` (DEV atual)
- Envio ao cliente: desabilitado / inexistente neste incremento
- Trello Comercial: não alterado
- Trello `3.1 - LOGISTICA`: não alterado
- WhatsApp/Meta: não alterado
- n8n produção: não alterado

## Escopo executado

F1 conforme ordem técnica da Fase 0:

1. schema `catalog`;
2. modelo de aquisição;
3. projeções Trello como projeção humana;
4. auditoria/observabilidade extra;
5. campos e estados canônicos de `business.customer_events`;
6. migration de compatibilidade com o runtime v1.1;
7. carga versionada da base oficial de localidades/preços;
8. helper append-only de EventFact;
9. índices de FKs recomendados pelo advisor.

## Migrations DEV

- `20261006002526_f1_catalog_schema_v121.sql`
- `20261006002712_f1_business_compatibility_v121.sql`
- `20261006002755_f1_projection_audit_v121.sql`
- `20261006002944_f1_seed_canonical_catalog_v121.sql`
- `20261006003031_f1_fact_history_helper_v121.sql`
- `20261006003237_f1_fk_index_hardening_v121.sql`

## Dados determinísticos carregados

Fonte: base oficial homologada da Fase 0 v1.2.1.

- 8 pricing tiers;
- 234 localidades, incluindo `raposo tavares` como `human_required` sem preço automático;
- aliases autorizados normalizados;
- 8 serviços do catálogo operacional;
- regras comerciais versionadas para cartão, combo, promoção de curto prazo, follow-up, Álbum de Assinaturas e pagamento Pix.

Tier codes permanecem internos e sem privilégio SELECT para `anon`/`authenticated`.

## Compatibilidade v1.1 → v1.2.1

- `lifecycle_stage` foi preservado como campo LEGACY para não quebrar consumidores anteriores.
- `commercial_stage` e `operational_stage` são os estados canônicos novos.
- `relationship_type` e `chatwoot_contact_id` foram preservados como LEGACY; Chatwoot foi corrigido no registry para `out_of_scope_v1`, `runtime_enabled=false`, `canonical=false`.
- não foi criada entidade `lead`; a unidade comercial permanece `business.customer_events`.

## Testes

Arquivo versionado:
`supabase/tests/f1_schema_v121_acceptance.sql`

Cobertura estrutural:
- AT-017;
- AT-021;
- AT-023;
- AT-025;
- AT-038;
- AT-039;
- AT-040 (unicidade estrutural de reservation/projection);
- ausência de entidade `lead`;
- catálogo Mogi/T1190;
- Raposo Tavares → human_required;
- tier interno sem SELECT de cliente;
- EventFact append-only + valid_to.

A suíte é transacional e finaliza com `ROLLBACK`; fixtures não persistem.

## Divergências registradas

### DIV-F1-001 — repositório main ainda anuncia baseline v1.1

A Fase 0 v1.2.1 foi declarada pelo responsável como especificação executável vigente, mas o `main` ainda contém documentos de governança que anunciam v1.1. A implementação foi isolada nesta branch e não altera silenciosamente a arquitetura. A atualização integral do pacote canônico no `main` deve ocorrer no processo de homologação/merge.

### DIV-F1-002 — RLS legado em core/audit — verificado, sem correção automática

RLS permanece desabilitado em:
- `core.sessions`;
- `core.events`;
- `core.state_transitions`;
- `audit.agent_runs`;
- `audit.workflow_runs`.

Verificação direta após F1:
- `anon`: sem USAGE nos schemas `core`/`audit` e sem SELECT nas cinco tabelas;
- `authenticated`: sem USAGE e sem SELECT;
- `service_role`: SELECT permitido.

Isso coincide com ADR-0002, que define esses schemas como não expostos à Data API por padrão. Não foi aplicada correção automática de RLS: habilitá-lo sem política explícita poderia bloquear o runtime e não existe incompatibilidade objetiva de acesso cliente no estado verificado.

Os novos objetos F1 usam RLS habilitado, sem policies de cliente, com acesso backend via `service_role`. O advisor registra `rls_enabled_no_policy` como INFO nesses objetos; neste desenho backend-only isso é esperado.

## Rastreamento

| Requisito | Especificação | Implementação | Teste | Homologação |
|---|---|---|---|---|
| Supabase canônico | F0 v1.2.1 / Arquitetura + Schema | 6 migrations F1 | F1_SCHEMA_V121 | review |
| customer_event sem lead concorrente | Modelo de Domínio | business.customer_events + contact_identities | ausência de lead + AT-017 | review |
| histórico de fatos | Event State Engine | record_event_fact v1.2.1 | append-only/current/valid_to | review |
| optimistic lock | Event State Engine | transition_customer_event | AT-038 | review |
| idempotência | Contratos/Eventos | core.record_event preservado | AT-021 | review |
| handoff não perde ingestão | Matriz Segurança | human_handoffs + core.events | AT-023 | review |
| quote retry | Idempotência | unique(event,fingerprint) | AT-039 | review |
| logística sem duplicação | Trello Logística | unique projection + reservation | AT-040 estrutural | review |
| preço/localidade determinísticos | Base oficial + Regras | catalog.* | asserts Mogi/Raposo/tiers | review |

## Gate

F1 permanece em **review**, não `homologated`, até:
1. revisão humana desta implementação;
2. confirmação na homologação de que o modelo backend-only de `core/audit` permanece vigente;
3. merge controlado da branch após revisão.

F2 não deve iniciar antes desse gate.

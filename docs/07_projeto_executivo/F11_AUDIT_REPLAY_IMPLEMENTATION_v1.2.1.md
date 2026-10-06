# F11 — Audit Watchdog & Replay/Shadow Evaluator — v1.2.1

- Status: review
- Workflows canônicos: CM-WF-900 / CM-WF-910
- Base: feat/f10-campaign-remarketing-v1.2.1
- Ambiente: n8n LAB / pasta `Click Mais OS - LAB`
- Supabase write: não ligado
- Side effects externos: nenhum
- SEND_ENABLED: false
- TRELLO_WRITE_ENABLED: false
- CONTRACT_WRITE_ENABLED: false
- CAMPAIGN_SEND_ENABLED: false

## Papel no cutover

A Fase 0 exige Watchdog/Replay homologados antes de cutover.

F11 não corrige silenciosamente o domínio.
Ela:
- detecta inconsistências;
- gera trabalho humano;
- executa/evalua fixtures em shadow;
- registra verdict/metrics compatíveis com audit.shadow_evaluations.

## CM-WF-900 — Audit Watchdog

LAB ID:
`t75Whbitv18ToyFj`

Entrada normalizada:
- overdue_followups;
- impossible_states;
- signed_payment_inconsistencies;
- invalid_wins;
- upcoming_logistics_blocked;
- delayed_deliveries;
- projection_drifts;
- open_dead_letters;
- duplicate_campaign_members;
- recurring_state_version_conflicts.

O adapter Supabase que produz essas queries ainda não está ligado ao n8n LAB.

### Regras

Cada finding gera:
- kind;
- priority;
- reason_code;
- event/source ref;
- context;
- dedupe_key;
- auto_correction_allowed=false.

Prioridades:
- impossible state: critical;
- GANHO sem critérios: critical;
- signed/payment incoerente: critical;
- logistics blocked em <=2 dias: critical;
- demais logistics blocked próximos: high;
- followup overdue: high;
- delivery overdue: high;
- dead letter: high;
- campaign member duplicate: high;
- recurring version conflict: high;
- projection drift error: high;
- projection drift normal: normal.

Saída operacional:
- somente CREATE_HUMAN_TASK;
- auto_corrections=[];
- nenhuma transição de estado;
- nenhuma verificação financeira;
- nenhum write Trello;
- nenhum envio.

### Testes LAB

Execution 153:
- snapshot limpo;
- status=clean;
- zero tasks.

Execution 154:
- 12 findings;
- 4 critical;
- 7 high;
- 1 normal;
- 12 human tasks;
- zero autocorreção.

## CM-WF-910 — Replay & Shadow Evaluator

LAB ID:
`p8KBlobl5UVJe4CC`

Entrada:
- replay_run_id;
- cases[].

Cada caso recebe:
- fixture/input refs;
- expected_ref;
- context_snapshot;
- candidate action/state/guard/response;
- candidate side_effects.

### Comparações

Suporta:
- action exact match;
- expected state como subset;
- expected guard como subset;
- response_required;
- must_include;
- must_not_include;
- max_chars;
- exact_response;
- forbid_internal_tier;
- zero side effects obrigatório.

Verdicts compatíveis com schema:
- pass;
- fail;
- review;
- not_evaluated.

### Zero side effects

Qualquer item em candidate.side_effects:
- faz o check zero_side_effects falhar;
- produz verdict=fail.

O próprio evaluator:
- side_effects_executed=false;
- não chama outros workflows produtivos;
- não envia;
- não move Trello;
- não grava contrato/pagamento.

### Persistência planejada

Cada avaliação produz:
`RECORD_SHADOW_EVALUATION`

Campos mapeados diretamente para audit.shadow_evaluations:
- input_event_id;
- customer_event_id;
- correlation_id;
- candidate_action;
- candidate_response;
- expected_ref;
- verdict;
- metrics;
- context_snapshot.

### Métricas por caso

- checks_total;
- checks_passed;
- checks_failed;
- side_effect_count;
- pass_rate.

### Teste LAB

Execution 155, corpus misto:
- 1 pass;
- 1 fail;
- 1 review;
- 1 not_evaluated;
- total 4.

Caso pass:
- action/state/guard/answer constraints válidos.

Caso fail:
- side effect whatsapp_send;
- ação divergente;
- estado divergente;
- tier T1190 exposto.

## Testes versionados

- `tests/f11/audit-replay.test.mjs`
- `.github/workflows/f11-audit-replay.yml`

Cobertura:
- watchdog clean;
- finding priorities;
- no auto-correction;
- deterministic dedupe keys;
- replay pass/fail/review/not_evaluated;
- state/guard subset;
- answer constraints;
- tier leak;
- side-effect hard failure;
- mapping para audit.shadow_evaluations.

## Dependências para homologação completa

1. adapter Supabase read/write no n8n;
2. corpus histórico sanitizado;
3. fixtures de aceitação completas da Fase 0;
4. replay end-to-end dos flows F3–F10;
5. thresholds/SLA operacionais carregados da configuração canônica;
6. persistência real em audit.shadow_evaluations e human_tasks;
7. execução prolongada em shadow antes do cutover.

## Gate

F11 = **review / watchdog e replay kernels funcionais / zero autocorrection / zero side effects**.

Não publicar.

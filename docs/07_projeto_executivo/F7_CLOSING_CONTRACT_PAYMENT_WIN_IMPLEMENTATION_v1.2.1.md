# F7 — Closing, Contract, Payment & Win Handoff — v1.2.1

- Status: review
- Base: feat/f6-trello-followup-v1.2.1
- Ambiente: n8n LAB / pasta `Click Mais OS - LAB`
- Supabase write: não ligado
- Autentique call: não ligado
- Payment provider call: não ligado
- Trello Logística: nenhuma mutação estrutural
- Meta send: inexistente
- SEND_ENABLED: false por arquitetura atual

## Escopo

Implementa:
- CM-WF-090 — Closing Intake
- CM-WF-100 — Contract Lifecycle
- CM-WF-110 — Payment Intake & Verification
- CM-WF-120 — Win & Operations Handoff

A implementação utiliza os objetos já existentes:
- business.contracts
- business.payments
- business.reservations
- business.logistics
- business.module_states
- business.human_tasks
- integrations.trello_projections

## CM-WF-090 — Closing Intake

LAB ID:
`YnjJOBF1OkGvasWW`

Responsabilidade:
- aceitar intenção de fechamento ou callback normalizado do microsite;
- validar transição canônica para FECHAMENTO via F2 State Guard;
- registrar dados finais do formulário como facts com origem `closing_form`;
- iniciar módulo de contrato;
- apresentar formulário quando ainda não preenchido.

Regras:
- não cria GANHO;
- não confirma disponibilidade;
- `reservation_guaranteed=false`;
- disponibilidade permanece `preliminary`;
- human_lock bloqueia automação;
- PRE_QUOTE não pode pular para FECHAMENTO.

Execuções:
- 63: ORCAMENTO -> FECHAMENTO + closing form;
- 64: form callback -> facts + closing_form_received;
- 65: human_lock -> human_required;
- 66: PRE_QUOTE -> FECHAMENTO negado.

## CM-WF-100 — Contract Lifecycle

LAB ID:
`lAvm7OngNOegGy0i`

Responsabilidade:
- versionar contrato;
- preparar request para Autentique;
- consumir webhook Autentique já normalizado;
- evitar duplicate/regression;
- produzir eventos contract_sent/contract_signed;
- escalar alteração não padrão.

Sem adapter Autentique no LAB:
- closing_ready -> `adapter_required`;
- cria plano CREATE_CONTRACT_RECORD + REQUEST_AUTENTIQUE_CREATE;
- nenhuma chamada HTTP externa é feita.

Idempotência:
- contract:<customer_event_id>:v<version>;
- provider_event_id duplicado => no-op.

Monotonicidade:
- contrato signed não regride para sent;
- cancelamento após signed => human_lock + human task;
- provider status desconhecido => human task.

Execuções:
- 67: contract v1 request;
- 68: contrato ativo existente => no_action;
- 69: webhook duplicado => duplicate_noop;
- 70: sent -> signed;
- 71: cancelled pós-signed => human_required;
- 72: sent pós-signed => stale_noop;
- 73: status externo desconhecido => human_required.

## CM-WF-110 — Payment Intake & Verification

LAB ID:
`s8hNLWxabnCd5ayX`

Adapter:
`n8n/generated/f2-payment-verification-guard.generated.js`

Fonte:
`src/functions/f2/state-guard.mjs#guardPaymentVerification`

Responsabilidade:
- receber prova/extraction candidate;
- comparar valor esperado x extraído;
- registrar extraction_status;
- criar human task;
- permitir `verified/rejected` apenas por humano.

Regras:
- agente/LLM/JEV nunca define payment_verified;
- valor igual => `apparent_ok`, human_status continua pending;
- valor divergente => `divergent` + PAYMENT_DIVERGENCE + human_lock;
- ilegível => `unreadable`, human task;
- human verification exige payment_id concreto;
- verification_version é carregado como expected version;
- verified gera payment_verified;
- rejected gera payment_rejected.

Execuções:
- 74: apparent_ok ainda pending humano;
- 75: divergência + lock;
- 76: unreadable + human task;
- 77: humano verified;
- 78: LLM verification negada;
- 79: payment_id ausente bloqueado;
- 80: humano rejected.

## CM-WF-120 — Win & Operations Handoff

LAB ID:
`H9XABktvCvmTw89q`

Adapter:
`n8n/generated/f2-commercial-transition-guard.generated.js`

Fonte:
`src/functions/f2/state-guard.mjs#guardCommercialTransition`

Critério de GANHO:
- commercial_stage = FECHAMENTO;
- contract.status = signed;
- payment.human_status = verified;
- payment_kind = signal ou full;
- human_lock = false.

Quando permitido, planeja:
1. TRANSITION_CUSTOMER_EVENT FECHAMENTO -> GANHO;
2. UPSERT_RESERVATION confirmed;
3. UPSERT_LOGISTICS_RECORD pending;
4. UPSERT_LOGISTICS_PROJECTION em `CONTRATOS EM ANDAMENTO`;
5. TRANSITION_OPERATIONAL_STAGE NOT_STARTED -> PRE_EVENT;
6. event_won.

Proteção do board Logística:
- `preserve_existing_structure=true`;
- `move_other_lists=false`;
- não renomeia, apaga ou reorganiza listas/cards;
- nenhuma mutação live executada nesta fase.

Idempotência:
- reservation:<event_id>
- logistics-record:<event_id>
- trello:logistics:<event_id>
- event-won:<event_id>

Se reservation/projection já existem, não cria novos plans desses objetos.

Execuções:
- 81: signed + signal verified => win plan completo;
- 82: signed + full verified + reservation/projection existentes => sem duplicar;
- 83: payment pending => GANHO negado;
- 84: contract sent => GANHO negado;
- 85: human_lock => human_required;
- 86: retry já em GANHO => nenhuma operação duplicada.

## Adapters F2

- `n8n/generated/f2-commercial-transition-guard.generated.js`
- `n8n/generated/f2-payment-verification-guard.generated.js`

São usados diretamente nos snapshots n8n e verificados por testes.

## Testes

- `tests/f7/closing-contract-payment-win.test.mjs`
- `.github/workflows/f7-closing-win.yml`

Cobertura principal:
- AT-011: wants close -> FECHAMENTO, não GANHO;
- AT-012: signed sem payment verified -> permanece sem GANHO;
- AT-013: signed + signal verified -> GANHO/reservation/logistics plan;
- AT-023: human_lock;
- AT-040: retry de win sem duplicação;
- duplicate contract webhook;
- payment verification human-only;
- contract status monotonic.

## Bloqueios operacionais para homologação completa

1. adapter/credencial Autentique no n8n;
2. adapter de persistência Supabase no n8n;
3. canal/identidade humana financeira autorizada;
4. persistência real de reservation/logistics projection;
5. replay integrado com F3/F4/F5/F6;
6. audit assertions em banco após side effects reais.

## Gate

F7 = **review / kernels funcionais / integrações externas desligadas / GANHO objetivo preservado**.

Não publicar.

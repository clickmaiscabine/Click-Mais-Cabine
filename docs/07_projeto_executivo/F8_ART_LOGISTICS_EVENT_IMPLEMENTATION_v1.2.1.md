# F8 — Art, Logistics & Event Execution — v1.2.1

- Status: review
- Base: feat/f7-closing-contract-payment-win-v1.2.1
- Ambiente: n8n LAB / pasta `Click Mais OS - LAB`
- Supabase write: não ligado
- Trello Logística: estrutura preservada; nenhuma mutação live
- Art production adapter: não conectado
- JEV: não conectado
- Meta send: inexistente

## Escopo

Implementa:
- CM-WF-130 — Art Lifecycle
- CM-WF-140 — Logistics & Pre-event
- CM-WF-150 — Event Execution Closure

## CM-WF-130 — Art Lifecycle

LAB ID:
`DMW67sv5KY69F0Zp`

Regras:
- event_won + art_required => cria art job awaiting_briefing;
- art not required => módulo not_applicable;
- briefing ausente => bloqueia;
- briefing válido => production adapter required;
- draft_ready => awaiting_customer + art_draft_ready;
- JEV somente entre:
  - approved
  - change_requested
  - question
  - undefined
- choice ausente => model_required;
- choice fora do vocabulário => human_required.

### Aprovação

A aprovação do cliente NÃO torna a arte final.

`approved`:
- art status -> pre_approved;
- cria tarefa de revisão final humana.

Somente `human_finalize`:
- exige actor_type=human;
- exige final_ref;
- art status -> final;
- módulo art -> completed/ready;
- emite art_final.

Alteração:
- change_requested -> human_revision + tarefa humana.

## CM-WF-140 — Logistics & Pre-event

LAB ID:
`c7zBazrXqitL2n71`

Adapters:
- `n8n/generated/f2-logistics-readiness.generated.js`
- `n8n/generated/f2-event-date-change-guard.generated.js`

Responsabilidade:
- verificar checklist crítico;
- incorporar blockers externos;
- atualizar logistics/module state;
- emitir logistics_ready somente sem blockers;
- atualizar apenas conteúdo projetado no Trello Logística.

Proteção vinculante do board `3.1 - LOGISTICA`:
- `preserve_existing_structure=true`;
- `move_list=false`;
- `trello_move_allowed=false`;
- nenhuma lista/card foi movido, renomeado, arquivado ou reorganizado.

Checklist crítico:
- item critical com status diferente de done/verified/ready => blocker.

Mudança de data pós-GANHO:
- sem autorização humana => human_required + human_lock + human task + fact review;
- com autorização humana => marca logistics changed e reconstrói checklist;
- em ambos os casos não move lista automaticamente.

## CM-WF-150 — Event Execution Closure

LAB ID:
`9U1T8EaKiRgErt5N`

Adapter:
`n8n/generated/f2-operational-transition-guard.generated.js`

Transições permitidas:
- PRE_EVENT -> EVENT_READY
- EVENT_READY -> EVENT_DAY
- EVENT_DAY -> POST_EVENT
- POST_EVENT -> COMPLETED
- PRE_EVENT -> SUSPENDED
- PRE_EVENT -> CANCELLED, com humano se contratado.

Ações:
- mark_ready -> EVENT_READY / event_ready
- start_event -> EVENT_DAY / event_started
- finish_event -> POST_EVENT / event_completed
- complete_cycle -> COMPLETED / operational_completed
- suspend -> SUSPENDED / event_suspended
- cancel -> CANCELLED / event_cancelled

`finish_event` não pula para COMPLETED. A conclusão operacional definitiva é etapa posterior.

Cancelamento de evento contratado:
- requer ator humano autorizado;
- agente não pode cancelar.

## Testes LAB

CM-WF-130:
- executions 87–100.

CM-WF-140:
- executions 101–105.

CM-WF-150:
- executions 106–113.

Cenários cobertos:
- art required/not applicable;
- briefing ausente/adapter pending;
- draft ready;
- approved/change/question/undefined;
- JEV ausente e choice inválida;
- final human-only;
- logistics ready/incomplete/external blocker;
- post-win date change human review;
- sequência operacional normal;
- suspensão;
- cancelamento humano;
- cancelamento por agent negado;
- stage skip negado.

## Testes versionados

- `tests/f8/art-logistics-event.test.mjs`
- `.github/workflows/f8-art-logistics-event.yml`

Cobertura:
- AT-016 mudança de data pós-GANHO;
- AT-035 art approval;
- state guard operacional;
- logística sem side effect estrutural no Trello.

## Bloqueios para homologação completa

1. persistência Supabase via n8n;
2. adapter real de produção/design de arte;
3. integração JEV para decisões de arte;
4. dados operacionais reais de equipe/capacidade;
5. replay end-to-end;
6. audit assertions após writes reais.

## Gate

F8 = **review / kernels funcionais / board Logística preservado / integrações externas desligadas**.

Não publicar.

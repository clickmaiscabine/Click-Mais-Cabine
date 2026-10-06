# F10 — Campaign & Remarketing — v1.2.1

- Status: review
- Workflow canônico: CM-WF-180
- Base: feat/f9-delivery-postsale-v1.2.1
- Ambiente: n8n LAB / pasta `Click Mais OS - LAB`
- Supabase write: não ligado
- Meta dispatcher: inexistente
- SEND_ENABLED: hard false
- CAMPAIGN_SEND_ENABLED: hard false

## Escopo canônico preservado

CM-WF-180:
- Segmento: query Supabase.
- Snapshot: business.campaign_members.
- Aprovação: humana.
- Oferta: snapshot da campanha; não altera catálogo/tabela global.
- Janela Meta: livre dentro da janela, template aprovado quando necessário fora dela.
- suppression/human_lock/opt-out revalidados no momento do candidato.

## CM-WF-180 — Campaign & Remarketing

LAB ID:
`6yOwIFE1dfpePZlj`

### 1. Snapshot

Entrada:
- campaign draft;
- resultado normalizado da query de segmentação Supabase;
- current policy por customer_event.

O workflow não reimplementa SQL de segmentação arbitrária.
Ele recebe os candidatos retornados pela query e:
- revalida opt-out;
- revalida suppression;
- revalida human_lock;
- revalida contactable;
- exige segment_match=true.

Para cada evento gera UPSERT_CAMPAIGN_MEMBER com:
- UNIQUE lógico campaign+event;
- eligibility_status;
- eligibility_reason;
- segment_snapshot;
- offer_snapshot.

O offer_snapshot é cópia da oferta da campanha e não gera qualquer UPDATE em catalog/pricing.

Snapshot hash:
- inclui campaign id/name;
- segment_rules;
- offer_rules;
- starts_at;
- ends_at.

### 2. Aprovação humana

human_approve exige:
- actor_type=human;
- actor_ref identificado;
- campaign.status=draft;
- eligible_member_count > 0;
- review_snapshot_hash exatamente igual ao hash atual.

Aprovação gera:
- campaign approved;
- approved_by;
- metadata.approval_snapshot_hash;
- membros eligible -> approved;
- campaign_approved.

Se oferta, segmento ou janela mudarem:
- hash muda;
- CAMPAIGN_SNAPSHOT_CHANGED_REAPPROVAL_REQUIRED.

Agente/LLM não aprova campanha.

### 3. Guard de candidato

Adapter:
`n8n/generated/f2-campaign-dispatch-guard.generated.js`

Base:
`src/functions/f2/response-guard.mjs`

Antes de qualquer candidato:
- campaign deve estar approved/running;
- approved_by obrigatório;
- approval_snapshot_hash deve casar com snapshot atual;
- member deve estar approved;
- opt_out=false;
- suppressed=false;
- human_lock=false;
- contactable != false;
- campanha dentro de starts_at/ends_at.

Meta:
- whatsapp_window_open=true -> delivery_mode=freeform;
- janela fechada -> exige template_approved + approved_template_name;
- sem template fora da janela -> deny.

Response Guard preservado:
- tier interno;
- price mismatch;
- links;
- PII/secrets;
- disponibilidade;
- fatos repetidos.

### 4. Shadow obrigatório

Mesmo com payload:
`send_enabled=true`
ou
`campaign_send_enabled=true`

o adapter força:
- dispatchAllowed=false;
- campaignDispatchAllowed=false;
- SEND_DISABLED;
- CAMPAIGN_SEND_DISABLED.

Resultado válido:
- RECORD_CAMPAIGN_SHADOW_CANDIDATE;
- campaign_shadow_candidate;
- nenhum SEND/DISPATCH real.

### 5. Lifecycle pós-disparo

Suporta eventos normalizados futuros:

dispatch_success:
- exige external_message_id;
- exige member approved;
- exige approval hash atual;
- approved -> sent;
- duplicate sent/responded/converted => no-op.

customer_response:
- sent -> responded;
- retry responded/converted => no-op.

converted:
- sent/responded -> converted;
- approved -> converted é bloqueado.

## Testes LAB

Executions:
- 131 snapshot;
- 132–135 approval gates;
- 136–144 dispatch/window/suppression/hash/guard;
- 145 price mismatch;
- 146–152 sent/response/conversion/idempotency.

Resultados principais:
- snapshot: 1 eligible / 3 excluded no fixture;
- opt-out excluded;
- human_lock excluded;
- non-match excluded;
- human approve válido;
- agent approval denied;
- changed offer => reapproval;
- freeform window => shadow;
- closed window no template => deny;
- approved template => shadow;
- opt-out at dispatch => deny;
- human_lock at dispatch => human;
- tier T1190 leak => deny;
- price mismatch => deny;
- campaign ended => deny;
- no real dispatch.

## Testes versionados

- `tests/f10/campaign-remarketing.test.mjs`
- `.github/workflows/f10-campaign.yml`

Cobertura:
- snapshot immutable;
- human approval;
- snapshot hash;
- suppression/opt-out/human_lock;
- Meta window/template;
- F2 Response Guard safety;
- hard shadow flags;
- dispatch lifecycle idempotency;
- response/conversion lifecycle.

## Bloqueios para homologação completa

1. adapter de query/persistência Supabase no n8n;
2. política/registro canônico de opt-out conectado à fonte real;
3. registry real de templates Meta aprovados;
4. Meta dispatcher;
5. audit/replay end-to-end;
6. manter SEND_ENABLED=false e CAMPAIGN_SEND_ENABLED=false até cutover explícito.

## Gate

F10 = **review / campaign kernel funcional / approval bound to snapshot / dispatch hard-shadow**.

Não publicar.

# F9 — Delivery & Post-sale — v1.2.1

- Status: review
- Base: feat/f8-art-logistics-event-v1.2.1
- Ambiente: n8n LAB / pasta `Click Mais OS - LAB`
- OneDrive adapter: não conectado
- Meta send: inexistente
- Publication adapter: não conectado
- Supabase write: não ligado

## Decisão canônica preservada

Conforme ADR-0004:
- OneDrive é a entrega canônica de mídia pós-evento;
- Google Drive não substitui OneDrive nesta função;
- publicação social é fluxo separado;
- ausência de consentimento social não bloqueia entrega;
- link social nunca substitui link da pasta OneDrive.

## CM-WF-160 — Delivery

LAB ID:
`zVdEzmxOuy80pEuz`

Estados preservados:
1. event_completed;
2. delivery pending;
3. delivery ready quando folder_ref + share_url reais são encontrados pelo adapter OneDrive;
4. delivery sent somente após dispatch_success do MESMO share_url;
5. delivery confirmed somente após confirmação do cliente.

### Sem OneDrive

`event_completed` sem link:
- UPSERT delivery pending;
- module delivery in_progress;
- REQUEST_ONEDRIVE_LOOKUP;
- blocker ONEDRIVE_ADAPTER_NOT_CONNECTED.

Lookup sem link:
- permanece pending;
- cria human task;
- nunca inventa share_url.

### Link encontrado

Lookup found + provider=onedrive + folder_ref + share_url:
- delivery ready;
- delivery_ready;
- REQUEST_RESPONSE_COMPOSITION;
- blocker SEND_DISABLED.

Não marca sent.

### Dispatch

`dispatch_success`:
- exige delivery ready;
- exige URL despachada igual à URL canônica;
- mismatch => DELIVERY_LINK_MISMATCH;
- match => delivery sent + delivery_link_sent.

### Confirmação

customer_confirmation:
- antes de sent => bloqueada;
- sent => confirmed;
- retry confirmed => no-op.

## CM-WF-170 — Post-sale

LAB ID:
`OePuPMx1fh6vuXC4`

delivery_link_sent:
- inicia post_sale;
- agenda confirmação;
- shadow/SEND_DISABLED.

delivery_confirmed:
- pode preparar pedido de avaliação;
- usa URL homologada de avaliações;
- ainda shadow/SEND_DISABLED.

### Consentimento de publicação

publication_consent_received:
- exige boolean consent;
- exige channel;
- source_type limitado a customer/human/contract/integration;
- registra `business.publication_consents`.

Consent=false:
- SUPPRESS_PUBLICATION;
- delivery_affected=false.

Consent=true:
- apenas registra consentimento;
- não publica automaticamente.

publication_request:
- sem consent=true => deny / PUBLICATION_CONSENT_REQUIRED;
- com consent=true => REQUEST_AUTHORIZED_PUBLICATION_ADAPTER;
- adapter não conectado no LAB;
- nenhuma publicação externa é feita.

### Fechamento de pós-venda

post_sale_complete:
- usa readiness F2;
- somente actions_completed_or_skipped=true permite completed;
- emite post_sale_completed.

## Testes LAB

CM-WF-160:
- executions 114–121.

CM-WF-170:
- executions 122–130.

## Testes versionados

- `tests/f9/delivery-postsale.test.mjs`
- `.github/workflows/f9-delivery-postsale.yml`

Cobertura:
- AT-036 event complete sem OneDrive;
- AT-037 publicação sem consentimento;
- delivery link mismatch;
- delivery confirmation;
- idempotent retry;
- consent negative sem impacto na entrega;
- publication adapter separado;
- post-sale readiness.

## Adapters F2

- `n8n/generated/f2-delivery-readiness.generated.js`
- `n8n/generated/f2-post-sale-readiness.generated.js`

## Bloqueios para homologação completa

1. adapter/credencial OneDrive;
2. persistência Supabase n8n;
3. Response Guard/dispatcher real ainda SEND_ENABLED=false;
4. publication adapter autorizado;
5. replay end-to-end;
6. audit assertions após writes reais.

## Gate

F9 = **review / delivery e post-sale funcionais em shadow / OneDrive e publicação externalizados**.

Não publicar.

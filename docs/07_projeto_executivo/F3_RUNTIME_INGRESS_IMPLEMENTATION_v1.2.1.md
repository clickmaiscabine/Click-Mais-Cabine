# F3 — Runtime ingress — implementação LAB v1.2.1

- Status: review
- Fase: 1 — Implementação do Núcleo
- Escopo: CM-WF-000 / 010 / 015 / 020
- Ambiente: n8n LAB, pasta `Click Mais OS - LAB`
- Publicação: não
- Credenciais: nenhuma disponível no LAB
- SEND_ENABLED: false por construção; nenhum fluxo possui dispatch
- Supabase write: não ligado neste incremento
- Trello: não tocado
- Board 3.1 - LOGISTICA: não tocado
- Meta/WhatsApp: não conectado

## Dependência e isolamento

F3 usa contratos e schemas v1.2.1 como fronteira. Os quatro flows foram criados como drafts independentes e podem ser testados/corrigidos separadamente.

A independência é operacional:
- cada workflow tem responsabilidade própria;
- nenhum deles redefine estados, domínio ou regras;
- todos produzem contratos/ações estruturadas para persistência posterior;
- a persistência canônica continua sendo Supabase.

## Workflows LAB

| Canonical ID | n8n LAB ID | Função | Estado |
|---|---|---|---|
| CM-WF-000 | 62B4rRjMHhuPqSOe | normalizar ingress Meta-like e envelope message_received | draft/inactive |
| CM-WF-010 | 69bf4FQq6Fnrh5fQ | resolver contato/evento/human_lock a partir de snapshot canônico | draft/inactive |
| CM-WF-015 | NAX3mBHwvTYistfz | normalizar attribution de landing/campaign/UTM | draft/inactive |
| CM-WF-020 | lAwhUKEz9IJdQ8Pl | validar fact candidates e planejar commit/conflito | draft/inactive |

Snapshots versionados:
- `n8n/workflows/f3/CM-WF-000.lab.json`
- `n8n/workflows/f3/CM-WF-010.lab.json`
- `n8n/workflows/f3/CM-WF-015.lab.json`
- `n8n/workflows/f3/CM-WF-020.lab.json`

## Comportamentos testados

### CM-WF-000
- caminho válido produz MessageContext + canonical event + `RECORD_EVENT`;
- assinatura não verificada => rejeita e não propõe persistência;
- duplicata => no-op, sem novo evento.

### CM-WF-010
- sem contato/evento => solicita CREATE_CONTACT + CREATE_CUSTOMER_EVENT;
- contato pessoal => fluxo não comercial, sem evento comercial;
- dois eventos ativos => human_required + CREATE_HUMAN_TASK.

### CM-WF-015
- landing + serviço homologados => forte sinal comercial + RECORD_ACQUISITION_TOUCHPOINT;
- valores desconhecidos => source unknown, sem atribuição inventada e sem ação.

### CM-WF-020
- fato novo válido => RECORD_EVENT_FACT;
- fato crítico conflitante derivado de agente => não sobrescreve; ENABLE_HUMAN_LOCK + CREATE_HUMAN_TASK.

## Execuções LAB

- execution 1: CM-WF-010 criação de contexto — success
- execution 2: CM-WF-000 happy — success
- execution 3: CM-WF-000 assinatura inválida — success / bloqueada semanticamente
- execution 4: CM-WF-000 duplicata — success / no-op
- execution 5: CM-WF-010 pessoal — success / noncommercial
- execution 6: CM-WF-010 eventos ambíguos — success / human_required
- execution 7: CM-WF-015 strong attribution — success
- execution 8: CM-WF-015 unknown attribution — success / sem ação
- execution 9: CM-WF-020 commit plan — success
- execution 10: CM-WF-020 critical conflict — success / human_lock

## Bloqueio objetivo para fechar F3

O conector do n8n LAB atualmente retorna **zero credenciais disponíveis**.

Consequência:
- não foi criado Postgres/Supabase node com credencial fictícia;
- não foi conectado webhook Meta;
- não existe persistência real do `RECORD_EVENT`, `CREATE_CONTACT`, `CREATE_CUSTOMER_EVENT`, `RECORD_ACQUISITION_TOUCHPOINT` ou `RECORD_EVENT_FACT`;
- os workflows produzem planos de ação testáveis, mas F3 não pode ser marcado `homologated` até o adapter canônico de persistência ser ligado e testado.

Isso é uma dependência operacional, não uma razão para redesenhar o domínio.

## Divergência corrigida antes de F3

Foram sincronizados em F1:
- `schemas/session.schema.json`;
- `schemas/event.schema.json`;
- `schemas/customer-event.schema.json`;
- `schemas/event-fact.schema.json`;
- `n8n/WORKFLOW-MANIFEST.json`.

Os arquivos anteriores ainda refletiam partes do runtime v1.1. A correção apenas alinha interfaces versionadas ao modelo v1.2.1 já aplicado no banco.

## Gate

F3 = **review / kernel funcional / persistência bloqueada por credencial**.

Não publicar os workflows e não ativar Meta enquanto:
1. credencial canônica Supabase/Postgres não estiver disponível ao n8n LAB;
2. ações planejadas não forem ligadas aos helpers/tabelas canônicos;
3. testes de idempotência e persistência não passarem;
4. F3 não for homologado.

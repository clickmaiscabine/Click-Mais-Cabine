# F6 — Trello Commercial Projection, Human Actions & Follow-up — v1.2.1

- Status: review
- Base: feat/f5-decision-guard-shadow-v1.2.1
- Ambiente: n8n LAB / pasta `Click Mais OS - LAB`
- Trello Comercial real: leitura apenas nesta etapa
- Trello Logística: não tocado
- Supabase write: não ligado
- Meta send: inexistente
- SEND_ENABLED: false por ausência de dispatcher e por integração posterior ao Response Guard

## Escopo canônico

Este incremento implementa:
- CM-WF-070 — Trello Commercial Projection
- CM-WF-071 — Trello Human Actions
- CM-WF-080 — Follow-up Controller

A implementação preserva:
- Supabase como fonte canônica;
- Trello como projeção/cockpit humano;
- card comercial somente após quote_sent;
- movimentos manuais Trello como comandos a validar, nunca fatos;
- follow-up automático único de 23h, sem desconto;
- cancelamento de follow-up por resposta, human_lock, ganho/perda ou mudança de quote.

## Inventário read-only do board Comercial

Board:
`CONTROLE DE ORÇAMENTOS`

URL:
`https://trello.com/b/18fnAEhK/controle-de-or%C3%A7amentos`

Leitura em 2026-10-05:
- aproximadamente 2.907 cards abertos observados;
- 13 listas abertas legadas;
- nenhuma mutação realizada.

Listas observadas:
1. RESPOSTA
2. CONTATO
3. ORÇ / REMARK 1 - Conteúdo
4. ORÇAMENTO / PROX. 30 DIAS
5. DUVIDAS/OBJEÇÕES
6. CHECK DÚVIDAS
7. NEGO-ABORDAGEM / REVISÃO
8. NEGOCIAÇÃO FINAL
9. FECHAMENTO/DADOS
10. FECHAMENTO / CONTRATO
11. FECHAMENTO / GANHO
12. PERDIDO
13. PLATAFORMA360

Target canônico:
- ORÇAMENTO
- RESPOSTA
- FAC / DÚVIDAS
- NEGOCIAÇÃO — BOT / HUMANO
- FECHAMENTO
- GANHO
- PERDIDO

Como `ORÇAMENTO` canônico não existe hoje, o CM-WF-070 retorna `migration_required` quando executado com o inventário real. Ele não tenta mapear silenciosamente uma lista legada.

Fixture versionada:
`tests/f6/fixtures/trello-commercial-inventory-2026-10-05.json`

## CM-WF-070 — Trello Commercial Projection

LAB ID:
`qr2WiKWr00oZMKbh`

Responsabilidade:
- receber estado/quote/projection vindos da fonte canônica;
- calcular lista canônica;
- construir título e bloco gerenciado do card;
- gerar projection_version + projection_hash;
- planejar CREATE_CARD, MOVE_CARD ou UPDATE_CARD;
- registrar projection somente depois de sucesso Trello;
- gerar no-op quando já sincronizado.

Regras comprovadas:
- PRE_QUOTE não é projetável;
- ORCAMENTO sem evento quote_sent não cria card;
- card novo exige:
  - source_event_type = quote_sent
  - quote.status = presented
  - qualified_at não nulo
- descrição contém EVENT_ID, projection version e quote version;
- descrição não contém internal tier;
- lista ausente => migration_required;
- Supabase vence drift;
- projeção idêntica => zero operações.

Execuções LAB:
- 42: criação planejada após quote_sent;
- 43: PRE_QUOTE sem card;
- 44: board legado real => migration_required;
- 45: state change => MOVE + UPDATE + projection record;
- 56: projeção idêntica => in_sync / zero ops;
- 57: ORCAMENTO sem quote_sent => no_projection.

## CM-WF-071 — Trello Human Actions

LAB ID:
`GKmiaRZAIf9O1Lni`

Adapter:
`n8n/generated/f2-trello-commercial-guard.generated.js`

Fonte:
`src/functions/f2/state-guard.mjs`

O Trello webhook normalizado deve fornecer:
- ator autorizado;
- card mapping;
- EVENT_ID;
- target list;
- projection stage version;
- canonical stage version;
- estado atual;
- gates de contrato/pagamento quando necessários.

Resultado:
- movimento válido => TRANSITION_CUSTOMER_EVENT request;
- target list não canônica => deny + reprojection;
- mapping inválido => deny + reprojection;
- ator não autorizado => deny + reprojection;
- version conflict => reload_reevaluate + reprojection;
- movimento impossível => deny;
- GANHO => somente signed + signal/full payment verified.

Execuções LAB:
- 46: ORCAMENTO -> RESPOSTA válido;
- 47: lista legada não canônica negada;
- 48: version conflict negado;
- 49: FECHAMENTO -> GANHO válido com signed + signal verified;
- 50: GANHO negado sem payment verified;
- 58: ator não autorizado;
- 59: card mapping inválido.

Nenhuma execução altera Supabase ou Trello.

## CM-WF-080 — Follow-up Controller

LAB ID:
`PWvkwqnVvEoUBynf`

Adapter:
`n8n/generated/f2-followup-policy.generated.js`

Fonte:
`src/functions/f2/date-promotion.mjs#evaluateFollowupPolicy`

Regras:
- máximo 1 follow-up automático;
- +23h após quote_sent;
- template lógico: FOLLOWUP_23H_NO_DISCOUNT;
- discount_allowed=false;
- não depende de coluna Trello;
- next_action_at pode ser projetado no card;
- estado do follow-up permanece canônico fora do Trello.

Cancelamentos:
- customer responded;
- human_lock;
- GANHO/PERDIDO;
- quote changed.

Quando due:
- gera REQUEST_RESPONSE_COMPOSITION;
- gera followup_due;
- nunca chama dispatcher;
- blockers inclui SEND_DISABLED.

Execuções LAB:
- 51: schedule +23h;
- 52: customer response => cancel;
- 53: human_lock => cancel;
- 54: due => due_shadow;
- 55: automatic_sent_count=1 => no action;
- 60: quote changed => cancel;
- 61: terminal stage => cancel;
- 62: pending mas ainda não due => no op.

## Testes versionados

- `tests/f6/trello-followup-kernels.test.mjs`
- `tests/f6/fixtures/trello-commercial-inventory-2026-10-05.json`
- `.github/workflows/f6-trello-followup.yml`

Cobertura:
- AT-028 Trello move inválido;
- AT-029 Trello move válido;
- AT-032 Follow-up;
- AT-038 optimistic version conflict;
- gates de GANHO;
- card creation após quote_sent;
- projection drift/no-op;
- tier internal não exposto.

## Gate de migração do board Comercial

A Fase 0 autoriza sanitização integral do board existente e determina que a operação seja auditada.

Nesta etapa a migração real não foi executada porque:
1. o board contém volume legado alto;
2. as listas target ainda não estão materializadas;
3. o projection planner ainda está em review;
4. nenhum adapter n8n/Trello credenciado está disponível no LAB;
5. executar migração antes do gate impediria rollback simples e revisão dos planos por card.

Próximo passo para migração:
1. homologar CM-WF-070/071;
2. gerar snapshot/export final;
3. gerar plano de migração por lista/card;
4. revisar contagens;
5. executar sanitização auditada;
6. ligar projection mapping;
7. replay e reconciliação;
8. somente então permitir writes automáticos.

## Gate

F6 = **review / kernels funcionais / Trello real read-only / follow-up shadow**.

Não publicar.

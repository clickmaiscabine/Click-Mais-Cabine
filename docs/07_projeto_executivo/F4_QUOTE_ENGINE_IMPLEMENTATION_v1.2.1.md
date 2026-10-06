# F4 — Quote Engine & Presentation — implementação LAB v1.2.1

- Status: review
- Fase: 1 — Implementação do Núcleo
- Escopo: CM-WF-030 / CM-WF-031
- Base: feat/f2-deterministic-library-v1.2.1
- Ambiente: n8n LAB, pasta `Click Mais OS - LAB`
- Publicação: não
- Credenciais: nenhuma
- Supabase write: não ligado
- Meta/WhatsApp send: não ligado
- Trello: não tocado
- Board 3.1 - LOGISTICA: não tocado

## Objetivo

F4 transforma o contexto de orçamento em duas etapas independentes:

1. `CM-WF-030` calcula e devolve `QuoteResult` determinístico.
2. `CM-WF-031` prepara a apresentação customer-facing e solicita composição/guard, sem recalcular valores.

## Regra de fonte única

O n8n não importa diretamente os módulos ESM do repositório em Code Node.

Para evitar uma segunda regra comercial independente foi criado:

`n8n/generated/f2-quote-kernel.generated.js`

O artefato é derivado da biblioteca F2 e referencia o commit de fonte:

`4d4673c94ef9d382f7a01cdc87f36266d572cd29`

Qualquer divergência entre F2 e o adapter reprova o CI por teste de paridade:

`tests/f4/f2-n8n-adapter-parity.test.mjs`

A matriz cobre T1190–T1890 em:
- normal;
- combo;
- promoção;
- combo + promoção.

Também cobre:
- São Paulo genérico;
- Raposo Tavares;
- adicional sem preço automático.

Workflow CI:
`.github/workflows/f4-quote-adapter.yml`

## CM-WF-030 — Quote Engine

n8n LAB ID: `3LlqxQwA5JZBoaZd`

Responsabilidade:
- consumir facts;
- normalizar localidade pelo F2;
- avaliar readiness;
- aplicar política de data/promoção;
- resolver pricing tier recebido do catálogo canônico;
- executar Pricing Engine F2;
- devolver `quote_result`;
- propor `RECORD_QUOTE` e `quote_generated` quando ready.

Não:
- escreve banco;
- compõe linguagem;
- envia mensagem;
- muda estágio comercial;
- consulta Google Maps;
- inventa tier.

Testes LAB:
- execution 11: T1190 normal — success — PIX 1190 / cartão 1410;
- execution 12: combo promocional T1190 — success — PIX 1500 / cartão 1770;
- execution 13: São Paulo genérico — success técnico / blocked semanticamente com LOCALITY_NEEDS_REGION;
- execution 14: Raposo Tavares — success técnico / human_required.

## CM-WF-031 — Quote Presentation

n8n LAB ID: `q1ac0eQAPGcyAimY`

Responsabilidade:
- consumir `QuoteResult`;
- expor somente preços customer-facing;
- marcar disponibilidade como preliminar;
- incluir política de reserva;
- indicar combo/promo/brinde quando autorizados;
- produzir `COMPOSE_QUOTE_PRESENTATION`;
- propor transição `PRE_QUOTE -> ORCAMENTO` somente em `dispatch_success`;
- definir `quote_sent` como evento de sucesso.

Não:
- recalcula preço;
- expõe pricing tier;
- envia mensagem;
- grava estado diretamente.

Testes LAB:
- execution 15: quote ready — success;
- execution 16: human_lock — success técnico / human_required;
- execution 17: quote blocked — success técnico / blocked.

Teste versionado adicional:
`tests/f4/quote-presentation-contract.test.mjs`

Ele garante:
- valores customer-facing preservados;
- nenhum tier interno no payload;
- nenhuma apresentação com human_lock;
- nenhum composer com quote não-ready;
- ORCAMENTO somente após dispatch_success.

## Snapshots

- `n8n/workflows/f4/CM-WF-030.lab.json`
- `n8n/workflows/f4/CM-WF-031.lab.json`

## Dependências ainda abertas

F4 kernel funciona com fixtures/catálogos de entrada, mas ainda não recebe dados diretamente do Supabase porque o n8n LAB não expõe credenciais.

Para homologação completa faltam:
1. adapter canônico de leitura de facts/localities/pricing tiers/rule set;
2. persistência de quote gerado;
3. integração com Guard/Response Composer/Dispatcher;
4. replay com corpus histórico;
5. manter SEND_ENABLED=false durante shadow.

## Gate

F4 = **review / kernels funcionais / parity gate ativo**.

Não publicar e não permitir dispatch a cliente nesta fase.

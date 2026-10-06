# F2 — Biblioteca Determinística v1.2.1

Status: **review**

Implementação do componente F2 da ordem técnica da Fase 0.

## Princípios

- funções puras, sem I/O;
- nenhuma chamada Meta, Trello, n8n, Supabase ou LLM;
- regras recebidas/versionadas quando são dados de negócio;
- nenhuma decisão semântica livre;
- falha segura: regra/localidade/preço não definido => bloqueio ou humano;
- saída estruturada para consumo posterior pelos workflows.

## Módulos

- `locality.mjs`: normalização e resolução canônica/alias;
- `pricing.mjs`: preço, combo, cartão e promoção;
- `date-promotion.mjs`: janela de promoção, brinde e follow-up;
- `readiness.mjs`: completude de quote e módulos;
- `state-guard.mjs`: transições e human-lock primitives;
- `idempotency.mjs`: chaves/fingerprints determinísticos;
- `response-guard.mjs`: pré-condições de dispatch e shadow;
- `index.mjs`: exports públicos.

## Regra de integração

Os workflows devem receber dados do Supabase/catalog e chamar estas funções como biblioteca lógica. O workflow continua responsável por orquestração e side effects.

F2 **não envia mensagens**, **não move Trello**, **não grava banco** e **não executa contrato**.

## Testes

```bash
node --test tests/f2/*.test.mjs
```

Os testes cobrem preços oficiais T1190–T1890, localidade, promoção, combo, brinde, readiness, state guard, idempotência, follow-up e response guard.

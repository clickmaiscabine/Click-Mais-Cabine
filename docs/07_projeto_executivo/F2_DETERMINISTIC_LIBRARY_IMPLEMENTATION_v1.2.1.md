# F2 — Biblioteca Determinística — implementação v1.2.1

- Status: review
- Fase: 1 — Implementação do Núcleo
- Especificação governante: Click Mais OS Fase 0 v1.2.1
- Branch base: feat/f1-schema-v1.2.1
- Side effects externos: nenhum
- SEND_ENABLED: não utilizado; biblioteca não possui dispatch

## Escopo executado

Conforme Ordem Técnica F2:
1. locality normalizer;
2. pricing engine;
3. date/promotion;
4. readiness;
5. state guard;
6. idempotency helpers;
7. response guard primitives.

## Implementação

Código puro ESM em `src/functions/f2/`.

A biblioteca:
- não acessa Supabase diretamente;
- não chama n8n;
- não envia WhatsApp;
- não escreve Trello;
- não chama LLM/JEV;
- recebe dados/regras versionados e devolve resultado estruturado;
- falha fechado para regra/localidade/preço não definido.

## Evidência de regras

### Pricing
Validado contra a matriz oficial T1190–T1890:
- normal;
- combo;
- promoção <=30 dias;
- combo + promoção;
- cartão +18% com round-up à próxima dezena.

### Localidade
- normalização de acentos/case;
- aliases;
- São Paulo genérico => pedir região, sem lock inicial;
- Raposo Tavares => humano;
- desconhecida/ambígua => humano, sem preço inventado.

### Promoções
- <=30 dias: -R$190 por serviço principal antes de combo/cartão;
- 31–60 dias: preço normal;
- brinde: somente Álbum de Assinaturas, tipos autorizados e >4 meses;
- follow-up automático: 1, 23h, sem desconto.

### State Guard
- transições comerciais conforme pipeline;
- GANHO somente FECHAMENTO + contrato signed + sinal/full verified;
- PERDIDO não nasce de silêncio;
- Trello não muda estado sem comando humano validado;
- payment_verified nunca por LLM/JEV;
- mudança de data pós-GANHO exige humano.

### Response Guard
Primitivas verificam:
- human_lock;
- action authorization;
- preço x QuoteResult;
- vazamento de tier interno;
- disponibilidade definitiva;
- pergunta repetida;
- PII/segredo;
- allowlist de links;
- janela WhatsApp;
- campanha aprovada;
- SEND_ENABLED.

Com SEND_ENABLED=false e sem outro bloqueio, decisão = shadow e dispatch = false.

## Testes

Arquivo:
`tests/f2/deterministic-library.test.mjs`

CI:
`.github/workflows/f2-deterministic.yml`

Resultado do run #1:
- workflow: Test deterministic library
- conclusion: success
- execução: GitHub Actions
- zero integração externa.

Cobertura inclui AT-003, AT-004, AT-005, AT-006, AT-007, AT-008, AT-009, AT-010, AT-011/012, AT-013, AT-016, AT-021, AT-023, AT-030, AT-031, AT-032, AT-033, AT-034, AT-038 e AT-039 no nível determinístico aplicável.

## Decisão de implementação não arquitetural

A biblioteca foi implementada em JavaScript ESM sem dependências externas porque:
- n8n executa sobre runtime Node;
- as funções permanecem pequenas/puras;
- o repositório já prevê `src/functions` para auxiliares determinísticos;
- não altera domínio, contratos, workflows ou responsabilidades.

## Gate

F2 está em **review**. Pode ser revisado/corrigido independentemente de F1 porque está em branch empilhada e não possui side effects.

F3 pode ser construído em paralelo conforme a própria Ordem Técnica, pois depende de contracts + core schema, já existentes.

# Trello Comercial — Migration Readiness v1.2.1

## Decisão vigente

O board existente `CONTROLE DE ORÇAMENTOS` será o Trello Comercial V1.
Não será criado board Comercial paralelo.

A sanitização integral do legado está autorizada pela especificação canônica, mas é uma operação de migração única e auditada.

## Estado observado em leitura

Data da leitura: 2026-10-05.

- Board encontrado e acessível.
- Aproximadamente 2.907 cards abertos observados.
- 13 listas abertas legadas.
- Nenhuma lista/card/label foi alterada nesta inspeção.

O inventário mínimo sem PII está versionado em:
`tests/f6/fixtures/trello-commercial-inventory-2026-10-05.json`.

## Gap estrutural

Target canônico:
`ORÇAMENTO | RESPOSTA | FAC / DÚVIDAS | NEGOCIAÇÃO — BOT / HUMANO | FECHAMENTO | GANHO | PERDIDO`

Runtime legado observado:
`RESPOSTA | CONTATO | ORÇ / REMARK 1 - Conteúdo | ORÇAMENTO / PROX. 30 DIAS | DUVIDAS/OBJEÇÕES | CHECK DÚVIDAS | NEGO-ABORDAGEM / REVISÃO | NEGOCIAÇÃO FINAL | FECHAMENTO/DADOS | FECHAMENTO / CONTRATO | FECHAMENTO / GANHO | PERDIDO | PLATAFORMA360`

Não há equivalência 1:1 segura para todas as listas.

Exemplo objetivo:
- `ORÇAMENTO` canônico não existe;
- há duas estruturas de fechamento;
- há duas estruturas de negociação;
- há listas de contato, conteúdo, check e serviço que não são stages canônicos.

Por isso nenhum mapeamento automático legado→canônico foi inferido.

## Política de migração

- Supabase vence qualquer conflito.
- Não inferir stage apenas pela lista legada.
- Cards sem EVENT_ID canônico precisam de reconciliação/migração de identidade.
- Nenhum preço de card histórico altera catálogo.
- Labels de preço/mês/pagamento não serão convertidas em estado canônico.
- Histórico necessário deve ser preservado fora da projeção ativa quando a migração for executada.
- Sanitização deve registrar contagens antes/depois e resultado por lote.

## Readiness atual

- Projection planner: implementado em CM-WF-070, review.
- Human move guard: implementado em CM-WF-071, review.
- Runtime Trello write no n8n: não credenciado.
- Migração live: NÃO INICIADA.
- Board Logística: fora deste escopo e protegido.

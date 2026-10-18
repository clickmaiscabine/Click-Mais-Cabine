# Regras de negócio

Uma regra deve indicar objetivo, condição, resultado, exceções, fonte/decisão humana e componentes afetados. Não esconder regra de negócio apenas dentro de prompt ou workflow.

## Regras atuais

- `BR-001_handoff-seguranca-excecoes.md` — handoff humano, segurança, exceções, proteção contra aprendizado incorreto e contrato mínimo de contexto entre bot/n8n/atendente.

- `BR-002_precificacao-corporativa-canonica.md` — regra corporativa homologada de dias × períodos de 4h, descontos e sinal; código em `src/functions/corporate-pricing.cjs`; integração de execução ainda não homologada.

## Estado e autoridade

Arquivos em `review` podem ser usados para análise e implementação experimental, mas não devem ser tratados como regra final de produção até homologação humana explícita.

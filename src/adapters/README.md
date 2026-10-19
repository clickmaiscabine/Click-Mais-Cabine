# Adapters
Adaptadores para APIs e serviços externos. Isolar particularidades de fornecedores da lógica de negócio.

## Quote Engine LAB — Turno 2

`quote-engine.mjs` seleciona BR-002 para `facts.event_type=empresarial` ou
`event_group=GRUPO_CORPORATIVO`. Conflitos de seleção bloqueiam o orçamento.
`quote-social.mjs` preserva o adapter social do kernel anterior, sem alterar sua saída.
Os módulos F2 foram recuperados sem alteração de 9c17bcb; a matemática corporativa
continua exclusivamente em `src/functions/corporate-pricing.cjs`.

Entradas corporativas: `facts.service_interest` (um serviço principal), `locality`,
`dias_evento` inteiro positivo, `periodos_por_dia` 1–3, `data_inicio`/`data_fim` ou
`event_dates` com datas exatas e únicas; `reference_date`; arrays `localities`,
`locality_aliases`, `pricing_tiers`, `services`; `pricing_source.file_id/revision_id`.
`services` usa `code`, `category`, `quoteableAutomatically`, `quantity` e `active`.
O código legado `fotografo` precisa ser mapeado para o serviço cadastrado antes da entrada.

O motor compara a localidade/faixa/preço recebidos do catálogo com o snapshot da revisão
oficial. Nunca usa um valor proposto pela LLM. Combos, addons e múltiplos equipamentos
corporativos ficam em human_required até política específica. Datas/dias inconsistentes
ficam bloqueados para esclarecimento, sem preço.

Saída corporativa mantém `quote_result.customerVisible.pix/card` e acrescenta `corporate`
(dias, períodos, horas, valores, sinal, saldo, schedule), `pricing_source` e
`availability.claim_authorized=false`. `ready` significa cálculo pronto; não autoriza
envio, disponibilidade ou reserva. `presentation_requires=corporate_presentation_v1`
marca a necessidade da apresentação do Turno 5. `requested_actions` são intenções,
sem execução de banco/WhatsApp.

Gerar: `node scripts/build-quote-engine.mjs`. Conferir: adicionar `--check`.
O script incorpora fontes, nunca fórmulas reescritas, no Code node e no export LAB.
O workflow existente CM-WF-030 permanece não publicado, sem novos nós ou credenciais.

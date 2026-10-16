# Flow 1 — Resultado da implementação e aferição em laboratório

- **Data:** 2026-10-15
- **Status:** development — funcional no laboratório; **não homologado nem pronto para produção**
- **Workflow de laboratório no n8n:** `HZWHbpjXYfW6t9Io` — `[LAB] Flow 1 — recepção Click sem envio`
- **Gatilho:** exclusivamente manual, desativado para entradas de produção.
- **Fonte versionada:** `src/functions/flow1-intake.n8n.js` e `n8n/flow1-lab.workflow-sdk.js`.
- **Fixture principal:** `docs/06_testes/TEST_CORPUS.md` (164 IDs — 154 mensagens individuais, 10 roteiros progressivos).
- **Relacionamento canônico:** manifesto CM-WF-000/010/020/040, schemas `customer-event` e `event-fact`, e decisões do PR #19 (referência, não mesclado).

## O que foi implementado e validado

1. Recepção de texto simulado direto ou formato Meta WhatsApp, normalização de acentos, termos e capitalização.
2. Reconhecimento determinístico de Cabine, Totem, Plataforma 360, Set Fotográfico e Fotógrafo, com termos coloquiais e negações explícitas.
3. Extração de finalidade/tipo do evento, data completa, parte de data sem ano, cidade de amostra, região de São Paulo, nome opcional, relação com evento e origem declarada/CTA verificado.
4. Atualização de um **snapshot recebido** da ficha, coleta cumulativa dos fatos, chave de mensagem já processada e controle de conflitos conservado no snapshot.
5. Encaminhamento a `FLOW_1_SERVICE`, `FLOW_2_PURPOSE`, `FLOW_3_DATE`, `FLOW_4_LOCALITY`, `FLOW_5_READY` ou exceções, conforme o primeiro requisito ainda ausente. Pergunta sugerida, nunca enviada.
6. Não tratar dúvidas entre equipamentos como combo confirmado; não assumir que “fotos na hora” indica necessariamente cabine.
7. Bloqueio de respostas em duplicidade, human lock (quando presente no estado recebido), operação já em andamento ou consulta fora de serviços de eventos.
8. Preservação de conflitos até confirmação de uma das datas e composição segura de `23/08` + “o ano é 2027”, sem inventar o ano.

## Evidências — execuções n8n de teste

| Execução | Escopo | Resultado observado |
|---|---|---|
| `191` | Primeira rodada das 154 mensagens individuais | Execução técnica bem-sucedida; encontrados dois erros de categoria de foto para documentos |
| `192` | Regressão após correção (154 mensagens) | Execução bem-sucedida; 19/20 mensagens F completas liberaram a checagem; F06 sem dia permaneceu bloqueado; regressões R02/G11/R03/R04 conforme rota esperada |
| `193` | Primeira mensagem de T01–T10 | 10/10 rotas esperadas em aferição manual |
| `194` | Continuação T01/T07/T05/T09, duplicidade e conflito | Transição para o próximo campo, `DUPLICATE_NOOP` e `CLARIFY_CONFLICT` observados |
| `195` | Continuação de T01/T07/T05/T09 | T07/T05 chegaram ao gate; T01 pediu local; T09 expôs a necessidade de combinar o ano |
| `196` | Retestes focalizados | Ano combinado com data parcial; conflito confirmado, conflito mantido sem confirmação; nome da cliente capturado |
| `197` | Bateria individual final (154) + caso adicional “aquele que gira” | 155 itens processados; execução técnica bem-sucedida; 19 casos F prontos, F06 aguardou data; R02/G11 excluídos; R03/R04 operacionais; “fotos na hora” pediu identificação do serviço |

**Interpretação:** execução sem erro técnico não significa que todos os julgamentos semânticos da bateria estejam homologados. Asserções automatizadas de expectativa detalhada para todos os 164 IDs ainda devem ser produzidas, inclusive com prova de persistência real e identificação de eventos.

## Estado da integração com o banco

**Ainda não há persistência Supabase ativa nesta versão.** O nó recebe `state` como snapshot nos testes e devolve `context` atualizado. Não consulta nem grava `core.sessions`, `core.events`, `business.contacts`, `business.customer_events`, `business.event_services` ou `business.event_facts`.

O Supabase já possui tabelas compatíveis e `core.events.idempotency_key` único. Uma integração posterior deve carregar contato/sessão/evento, obter o último estado, aplicar atualizações de modo transacional por mensagem, criar histórico de fatos e garantir que duplicações/execuções concorrentes não sobrescrevam valores. `contact_id` **não** é sinônimo de `customer_event_id`; não criar múltiplos eventos automaticamente sem regra de correlação.

## Gate para ativação de Flow 1

1. Reconciliar com o workflow Meta de laboratório existente (`iIAtpaRgvtssABsB`) e passar contrato normalizado, sem acionar envio.
2. Integrar carregamento/salvamento **atômico** ao Supabase e demonstrar idempotência com corrida concorrente e mensagens fora de ordem.
3. Integrar JEV como fallback de semântica apenas para serviços realmente não reconhecidos; preservar regras e verificações determinísticas. A implementação atual é principalmente determinística e **não executa chamada JEV**.
4. Atribuir origem de CTA somente com sinal verificável (landing pages configuradas); consultar lista homologada completa de localidades antes do cálculo. O conjunto de cidades do laboratório é apenas um subconjunto para reconhecer a linguagem das fixtures.
5. Implementar a ligação efetiva com os próximos flows; `next_flow` hoje indica rota, mas não executa outro workflow.
6. Submeter o corpus completo à aferição automatizada de expected vs actual, mais testes de persistência, human lock e entrega fora de ordem.
7. **Somente após homologação explícita:** habilitar integração com canais e eventual envio. Até lá manter sem disparar WhatsApp, sem preço e sem alteração de produção.

## Segurança

- A versão corrente **não envia mensagens** ao WhatsApp.
- **Não consulta nem grava Supabase** em runtime de laboratório.
- Não altera Meta, workflow original, banco, preços ou produção.
- O output `FLOW_5_READY` representa **apenas elegibilidade preliminar para iniciar verificações**, nunca disponibilidade confirmada, orçamento calculado ou mensagem enviada.

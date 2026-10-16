# Relatório — taxonomia determinística das finalidades

**Data:** 2026-10-16  
**Versão:** `1.0.2`  
**Branch isolada:** `codex/event-purpose-taxonomy-v1-20261016`  
**Base para comparação:** `codex/quote-flow1-test-corpus-20261015` (PR #21)  
**Status:** construída, simulações executadas, **não homologada nem implantada**.

## Auditoria

- PR #21 está aberto em draft: Flow 1, JEV e RPCs em laboratório, além de código de extração e 164 casos anteriores.
- Workflow n8n `3RAuwFaHIaZvOMjU`: versão publicada no laboratório, sem envio de WhatsApp. **Não alterado aqui.**
- Receptor Meta `iIAtpaRgvtssABsB`: fluxo ativo existente, que deve continuar único. **Não alterado aqui.**
- Supabase existente `Chatbot Clique Mais`: `core.sessions.context`, `core.events`, `business.customer_events.event_type`, `business.event_facts`; funções `cm_quote_flow1_snapshot_v1` e `cm_quote_flow1_apply_v1`.
- DEC-017 só consta na branch do PR #19; não foi silenciosamente incorporada à `main`. Ela exige ficha cumulativa e ordem serviço→finalidade→data→localidade.
- Limite encontrado: o `purpose` V1 tinha reconhecimento textual simples, produzindo falsos positivos como aniversário de casamento/empresa e festa surpresa. A RPC possui whitelist restrita; não admite grupos e objetos como fatos arbitrários.

## Arquivos

| Arquivo | Propósito |
|---|---|
| `src/taxonomy/event-purpose-v1.json` | 36 regras/subtipos, precedências, menus e características |
| `src/functions/classify-event-purpose-v1.js` | Motor puro e reutilizável; código + grupo + evidências |
| `src/functions/flow1-intake.n8n.js` | Classificador do Flow 1 existente compilado com a taxonomia |
| `src/functions/flow1-jev-guard.n8n.js` | Procedência estruturada quando há decisão JEV |
| `n8n/quote-flow1-orchestrator.workflow-sdk.js` | Fonte SDK da candidata atualizada na branch |
| `n8n/quote-flow1-taxonomy-v1.draft.n8n.json` | JSON de laboratório importável sem webhook próprio ou envio |
| `scripts/sync-event-purpose-taxonomy.mjs` | Compilação para nós n8n sem espalhar dicionário |
| `tests/event-purpose-v1.cases.json` | 108 entradas com resultado esperado |
| `tests/event-purpose-v1.test.cjs` | Regressão unitária automática |
| `tests/flow1-purpose-bridge.test.cjs` | Regressão do classificador no nó Code do Flow 1 |
| `.github/workflows/event-purpose-taxonomy.yml` | CI isolado, somente teste Node |

## Resultados de simulação

- Foram validadas **108/108 classificações puras** após o ajuste de erros comuns, sem chamadas ao JEV.
- Foram validados **103/103 casos no código de extração do Flow 1** antes da expansão de cinco erros comuns de grafia; a nova expansão foi validada no classificador puro.
- A análise estática do JSON do laboratório confirmou **14 nós**, nenhum nó novo de envio de WhatsApp e nenhum gatilho webhook concorrente.
- As regressões abrangem grupos pessoais, matrimoniais, empresariais, religiosos/culturais, formatura, números com e sem contexto, conflitos, formatos transversais, datas e localidades.
- O runner Node e o workflow de CI foram escritos, mas a execução autônoma no GitHub Actions ainda precisa ser confirmada.

**Importante:** os testes ocorreram em JavaScript simulado/isolado. Não foram executados envios à Meta, chamadas JEV pagas, gravações de dados reais ou atualizações de workflows n8n. Isso não é homologação ponta a ponta.

## Portões pendentes (não afirmar concluído)

1. Executar CI Node a partir do commit final da branch e confirmar execução real.
2. Importar exclusivamente a candidata inativa no projeto/laboratório n8n apropriado, sem publicar webhook.
3. Validar RPC real em transação controlada com fixture fictícia e rollback, nunca sobre fichas reais.
4. Validar persistência de procedência no `core.events` e `business.event_facts` com confirmação no snapshot após leitura.
5. Reexecutar regressão do Flow 1 anterior, incluindo JEV real dentro de orçamento limitado e limite 0,80.
6. Aferir classificações culturais sem código operacional e regras futuras de benefícios com revisão comercial.
7. Solicitar autorização explícita para a implantação. **Nenhuma implantação, alteração comercial ou merge está autorizada por este relatório.**

## Evolução

Acrescentar novos sinônimos no JSON e fixtures sem reescrever workflows. Se novos grupos comerciais exigirem código operacional exclusivo, versionar contrato de dados e migrar aditivamente, com revisão dos consumidores que hoje só aceitam cinco códigos. A camada de brindes deve consumir regras comerciais separadas e nunca inferir concessões pelo simples grupo/subtipo.

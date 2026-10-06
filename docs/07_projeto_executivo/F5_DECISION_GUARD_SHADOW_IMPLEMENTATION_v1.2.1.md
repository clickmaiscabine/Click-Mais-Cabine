# F5 — Decision, Handoff, Composer & Response Guard Shadow — v1.2.1

- Status: review
- Base: feat/f4-quote-engine-v1.2.1
- Ambiente: n8n LAB / pasta `Click Mais OS - LAB`
- Publicação: não
- Credenciais JEV/LLM: não disponíveis
- SEND_ENABLED: hard false no adapter do Response Guard
- Supabase write: não ligado
- Meta send: inexistente
- Trello: não tocado
- Board 3.1 - LOGISTICA: não tocado

## Princípio

F5 separa decisão semântica, handoff, composição e validação final.

Nenhum modelo pode:
- criar nova classe fora do vocabulário;
- mudar preço;
- confirmar pagamento;
- alterar estado diretamente;
- contornar human_lock;
- enviar mensagem.

## CM-WF-040 — Commercial Decision Router

LAB ID: `W3zYsDTomYrvHKXF`

Vocabulário canônico aceito:
- QUER_FECHAR
- QUER_PENSAR
- PEDIU_DESCONTO
- TEM_DUVIDA
- DESISTIU
- HUMANO
- INDEFINIDO

Aliases documentados normalizados:
- ACEITOU -> QUER_FECHAR
- QUER_CONTRATAR -> QUER_FECHAR
- PRECISA_HUMANO -> HUMANO

O workflow não chama modelo porque nenhuma credencial está disponível.

Sem `jev_choice`:
- status = `model_required`;
- gera `CALL_JEV` com lista fechada;
- não escolhe por adivinhação.

Choice fora do vocabulário:
- fail closed;
- `human_required`;
- HANDOFF_HUMANO.

Rotas:
- QUER_FECHAR -> REQUEST_CLOSING
- QUER_PENSAR -> RESPONDER_AGUARDAR_DECISAO
- PEDIU_DESCONTO -> HANDOFF_HUMANO/BARGAIN/force_lock
- TEM_DUVIDA -> RESPONDER_DUVIDA
- DESISTIU -> PROPOSE_LOSS com evidência explicit
- HUMANO -> HANDOFF_HUMANO/force_lock
- INDEFINIDO -> ASK_ONE_CLARIFYING_QUESTION

Nenhuma rota muda estado diretamente.

## CM-WF-050 — Human Handoff

LAB ID: `9xycWVMjVQuEMlhn`

Transforma solicitação de humano em operações estruturadas.

Para motivos canônicos de lock ou `force_lock=true`:
1. ENABLE_HUMAN_LOCK;
2. CREATE_HUMAN_TASK;
3. CANCEL_AUTOMATIC_FOLLOWUPS.

Para revisão humana sem motivo de lock:
- cria tarefa;
- não bloqueia automaticamente toda a conversa.

BARGAIN foi testado como lock obrigatório.

## CM-WF-060 — Response Composer

LAB ID: `DBdzsxMlMqsB86YD`

Compositor limitado.

Templates determinísticos implementados:
- RESPONDER_AGUARDAR_DECISAO;
- COMPOSE_HANDOFF_ACK;
- REQUEST_CLOSING;
- COMPOSE_QUOTE_PRESENTATION;
- ASK_ONE_CLARIFYING_QUESTION para facts mínimos conhecidos.

Para resposta sem template fixo, por exemplo `RESPONDER_DUVIDA`:
- status = `model_required`;
- candidate_text = null;
- devolve ACTION + FACTS + constraints;
- blocker = `LLM_CREDENTIAL_NOT_CONNECTED`.

Uma ação não autorizada jamais produz texto.

### Defeito encontrado e corrigido

A primeira versão do Code Node possuía strings multiline incompatíveis com JavaScript single-quoted no runtime do n8n.

Execuções 26–31 falharam com `Invalid or unexpected token`.

A correção substituiu literais multiline por composição explícita de newline.

Depois da correção:
- executions 36–41 = success.

O erro foi corrigido apenas no CM-WF-060, sem alterar os demais flows.

## CM-WF-061 — Response Guard & Shadow

LAB ID: `D2AmPjDxoKUQ8yYt`

Adapter:
`n8n/generated/f2-response-guard.generated.js`

Fonte canônica:
`src/functions/f2/response-guard.mjs`

O adapter força:
`sendEnabled: false`

Mesmo se o payload recebido tentar habilitar envio.

O workflow não possui node dispatcher.

Valida:
- human_lock;
- action authorization;
- preço contra QuoteResult;
- tier interno;
- disponibilidade definitiva;
- pergunta repetida;
- PII/secret flags;
- allowlist de links;
- janela WhatsApp;
- campanha aprovada.

Resultados observados:
- resposta válida -> shadow / dispatchAllowed=false / SEND_DISABLED;
- preço divergente -> deny;
- T1190 no texto -> deny / INTERNAL_TIER_EXPOSED;
- human_lock -> human;
- dispatch sempre false.

## Testes LAB

Execuções:
- 18–22: CM-WF-040
- 23–25: CM-WF-050
- 26–31: CM-WF-060 primeira versão, falha de sintaxe detectada
- 32–35: CM-WF-061
- 36–41: CM-WF-060 corrigido, success

## Testes versionados

- `tests/f5/response-guard-parity.test.mjs`
- `tests/f5/workflow-kernels.test.mjs`
- `.github/workflows/f5-decision-guard.yml`

Os testes também verificam que o snapshot do CM-WF-061 contém exatamente o adapter versionado.

## Snapshots

- `n8n/workflows/f5/CM-WF-040.lab.json`
- `n8n/workflows/f5/CM-WF-050.lab.json`
- `n8n/workflows/f5/CM-WF-060.lab.json`
- `n8n/workflows/f5/CM-WF-061.lab.json`

## Bloqueios para homologação completa

1. conectar credencial/serviço JEV para produzir choice;
2. conectar credencial LLM para ações sem template determinístico;
3. persistir human_lock/tasks/actions no Supabase por adapter canônico;
4. integrar Response Composer -> Response Guard;
5. integrar dispatcher Meta apenas após shadow/replay/homologação;
6. manter SEND_ENABLED=false até gate explícito.

## Gate

F5 = **review / contratos funcionais / models externalizados / shadow hard-disabled**.

Não publicar.

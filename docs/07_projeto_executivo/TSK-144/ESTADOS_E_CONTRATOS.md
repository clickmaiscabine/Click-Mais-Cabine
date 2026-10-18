# Estados e contratos

## Estados de atendimento

| Estado | Entrada | Saída permitida |
|---|---|---|
| `NOVO` | mensagem normalizada | `COLETANDO` |
| `COLETANDO` | fato extraído | `AGUARDANDO_DADO`, `PRONTO_PARA_COTAR`, `HUMAN_LOCK` |
| `PRONTO_PARA_COTAR` | dados mínimos completos | `ORCAMENTO_PREPARADO`, `HUMAN_LOCK` |
| `ORCAMENTO_PREPARADO` | proposta versionada | `SEQUENCIA_ENFILEIRADA` |
| `SEQUENCIA_ENFILEIRADA` | itens persistidos | `ORCAMENTO_ENVIADO`, `HUMAN_LOCK`, `FALHA_RECUPERAVEL` |
| `ORCAMENTO_ENVIADO` | última confirmação Meta | `AGUARDANDO_RESPOSTA`, `FOLLOW_UP_AGENDADO`, `HUMAN_LOCK` |
| `HUMAN_LOCK` | tomada humana ou exceção | somente retomada manual |

## Contratos mínimos

| Workflow | Entrada | Saída |
|---|---|---|
| Ingress/F1 | `message_id`, telefone, texto, horário, perfil | `event_id`, fatos, dados pendentes, rota |
| Quote Engine | `event_id`, serviços, localidade, data, modalidade, tabela_versao | proposta ou bloqueio |
| Presentation | proposta, disponibilidade | itens ordenados de comunicação |
| Worker de fila | `queue_item_id`, `idempotency_key` | confirmação Meta, erro ou cancelamento |
| Follow-up | evento, última mensagem recebida, janela, human_lock | agendamento, template ou handoff |

Cada escrita deve carregar `event_id`, `message_id` quando existir, `idempotency_key`, origem e horário.

# Plano de testes e riscos

## Casos ponta a ponta

| Caso | Resultado esperado |
|---|---|
| um serviço | proposta homologada, um par imagem/catálogo e sequência ordenada |
| dois serviços | combo homologado e dois pares na ordem correta |
| três serviços | `HUMAN_LOCK`, sem cálculo automático |
| data livre / lotada / inconclusiva | preliminar / fluxo informativo sem desconto / orçamento sem citar agenda |
| múltiplas festas | oportunidades separadas no mesmo telefone |
| mensagem durante sequência | preservada e tratada após fim ou cancelamento |
| erro Meta | retry com chave idempotente e sem duplicar envio |
| janela 24h | texto livre dentro; template autorizado fora |
| follow-up 23h | só sem resposta e sem atendimento humano |
| Trello duplicado | um cartão por oportunidade após conclusão |

## Riscos e controles

| Risco | Controle |
|---|---|
| preço divergente | planilha homologada versionada; sem LLM no cálculo |
| envio duplicado | `idempotency_key` e confirmação Meta persistida |
| atendimento humano interrompido | `human_lock` cancela fila imediatamente |
| agenda desatualizada | não afirmar disponibilidade; revalidar antes do contrato |
| mídia errada | catálogo oficial por serviço e validação antes de enfileirar |

## Comparação de arquitetura

| Tema | Planejado pela OS | Existente observado | Graphify |
|---|---|---|---|
| entrada e ficha | persistência cumulativa | ingress e F1 ativos, sem resposta | não fornecido |
| preço e apresentação | homologados e sequenciados | módulos LAB inativos | não fornecido |
| envio e fila | persistente, auditável | ausente | não fornecido |
| Trello/follow-up/handoff | idempotente e cancelável | planejadores LAB inativos | não fornecido |

## Critério para homologação

Renderizar os seis `.mmd`; revisar os contratos com a planilha e baseline; validar os dez casos; obter aprovação humana antes de implementar qualquer envio real.

# Fila e temporização

## Modelo persistente

`outbound_queue` precisa conter: identificador do item, `event_id`, ordem, tipo de mensagem, conteúdo ou referência aprovada, horário de envio, estado, tentativas, `idempotency_key`, `meta_message_id`, motivo de cancelamento e timestamps.

O worker seleciona um único item elegível por vez para cada oportunidade. Mensagens novas recebidas ficam registradas e só são tratadas depois da sequência ou de um `human_lock`.

## Programação provisória

| Marco | Atraso relativo | Condição |
|---|---:|---|
| imagem e catálogo de cada serviço | conforme ordem confirmada | confirmação técnica anterior |
| orçamento e benefícios | aproximadamente 2 min entre mensagens programadas | sem `human_lock` |
| prova social → despedida | 5 s | confirmação anterior |
| pergunta de reserva | 5 min após despedida | não lotada |
| follow-up | 23 h após orçamento concluído | sem resposta; dentro da janela ou template aprovado |

A posição exata do atraso de cinco minutos permanece pendente de confirmação humana antes de qualquer envio real.

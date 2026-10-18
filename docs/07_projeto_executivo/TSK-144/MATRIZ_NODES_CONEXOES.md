# Matriz de nós e conexões n8n

| Domínio | Evidência atual | Situação para Fase 1 | Integrações |
|---|---|---|---|
| Agenda | Cron → Trello → Supabase → criar/atualizar reserva | existente; requer critério de frescor | Trello, Supabase |
| Ingress | Trigger WhatsApp teste → normalização → JEV opcional → Flow1 | existente; limitado ao número teste | Meta, JEV, n8n |
| Ficha | normalização → recuperação RPC → extração → JEV opcional → RPC atômica | existente; adaptar para oportunidade/festa | Supabase, JEV |
| Preço | Quote Engine com adaptador F2 | existente, inativo; adaptar para planilha homologada e versionamento | regras aprovadas |
| Apresentação | Quote Presentation | existente, inativo; ampliar para sequência ordenada | Supabase |
| Resposta | Composer e Guard em shadow | existentes, inativos; exigir fila e envio técnico | Meta |
| Trello | projeção sem mutação | existente, inativo; criar cartão só ao fim e idempotente | Trello |
| Follow-up | política de 23h em shadow | existente, inativo; persistir agendamento | Meta, Supabase |
| Handoff | planejador de bloqueio/tarefa | existente, inativo; acoplar cancelamento da fila | Supabase, Trello |

## Conexões novas propostas

`Quote Presentation → outbound_queue → worker → Response Guard → Meta API → delivery log → Trello/Follow-up`.

Essa cadeia não existe nos workflows observados. Ela deve permanecer em shadow até aprovação humana.

# Matriz finita de aceite
Status: review
Versão: 1.0.0

Preencher somente estes caminhos reais. Acrescentar teste apenas por regra aprovada ou falha concreta nova. Não usar contagens históricas como prova do cron novo.

| Automação | Resultado obrigatório e regra | Fonte concreta | Identidade e período | Esperado | Observado | Evidência | Versão | Decisão |
|---|---|---|---|---|---|---|---|---|
| Executor | Credenciais disponíveis no processo agendado | integração Hermes/Codex instalada | perfil, conta e contexto de execução | leitura real no contexto do cron | não executado localmente | preencher recibo local | 1.0.0 | pendente local |
| Ads | métricas, unidade, status e destino por campanha | conta Ads autorizada | customer_id e datas explícitas | relatório reproduzível | consulta cloud disponível; contexto local por validar | relatório privado, sem valores no Git | 1.0.0 | parcial |
| Wix | tráfego e contato no site correto | Analytics Data API | site_id, período e fuso | sessões, visitantes, cliques e formulários | consulta cloud disponível; contexto local por validar | relatório privado | 1.0.0 | parcial |
| Avisos | alerta com vigência e ação, sem falso atual | mensagens Ads/Wix + fontes oficiais | mailbox, message_id e data | aviso classificado e deduplicado | avisos Ads localizados; cobertura Wix a confirmar | referência privada | 1.0.0 | parcial |
| Entrega | produced → received/accepted por ack | destino privado real do gerente | request_id | gerente acusa e registra próximo passo | não executado | ack_ref obrigatório | 1.0.0 | pendente local |
| Conteúdo | uma peça adaptada às três redes | fila editorial e mídia autorizada | content_id, canal e data | rascunhos úteis com CTA | pacote editorial neste diretório | CAMPANHA-40-DIAS.md | 1.0.0 | rascunhos disponíveis |
| Publicação | post no canal certo sem duplicação | API/painel oficial do canal conectado | content_id, canal, post_id | URL e recibo verificados | não publicada | preencher recibo ou bloqueio específico | 1.0.0 | expansão por canal |

O núcleo diário pode operar com cobertura parcial explícita. Sua homologação local exige a primeira cadeia completa request → consulta → relatório → ack e um único agendamento ativo. Publicação é homologada por canal e não bloqueia consultas ou rascunhos. Não criar nova homologação do aplicativo Cabine IA.

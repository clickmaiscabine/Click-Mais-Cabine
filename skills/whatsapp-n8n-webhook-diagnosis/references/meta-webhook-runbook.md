# Meta WhatsApp Webhook e n8n — referência operacional

Use esta referência depois de carregar whatsapp-n8n-webhook-diagnosis. Ela descreve relações entre configurações; não contém valores de conta.

## Fluxo de recebimento

1. Uma mensagem chega à Meta Cloud API para um número associado a uma WABA.
2. A Meta encaminha o evento ao callback configurado no app.
3. O gatilho do n8n recebe o evento, usando a credencial de OAuth exigida pela integração.
4. O workflow processa o payload recebido.

Uma confirmação de verificação do callback prova que a Meta conseguiu validar o endpoint naquele momento. Não prova, por si só, que a WABA está inscrita no app certo, que mensagens reais estão assinadas ou que o normalizador aceita o payload.

## Credenciais

- Credencial OAuth da Meta: usada pelo gatilho para configurar/verificar recebimento de eventos conforme o nó e a versão do n8n.
- Credencial WhatsApp API: usada para chamadas de envio. Pode incluir access token e Phone Number ID.
- A credencial e seus valores nunca devem ser copiados para a skill, log, commit, prompt, captura de tela pública ou mensagem.
- Verifique nomes e associação da credencial na interface; não revele seu conteúdo.

## URL de teste e URL de produção

- O n8n mostra endpoints distintos para teste e produção.
- O endpoint de teste depende da ação de escutar/aguardar evento e pode expirar quando a escuta termina.
- O endpoint de produção depende do workflow estar publicado/ativo.
- Compare a URL cadastrada na Meta com o valor exibido no n8n para o mesmo ambiente. Não “corrija” o caminho manualmente por suposição.
- Ao alternar o callback cadastrado, registre o ambiente anterior e verifique qual ambiente precisa receber eventos naquele momento.

## WABA inscrita no app

O Graph API oferece a operação subscribed_apps para consultar os apps vinculados a uma WABA. O diagnóstico inicial é somente leitura:

~~~http
GET /{WABA_ID}/subscribed_apps
~~~

Use o App ID e o WABA ID da configuração que está sendo investigada. A conta/token usado para a consulta precisa ter permissões adequadas. Compare o resultado com o app esperado.

Uma inscrição ausente pode ser uma causa; não presuma que seja a única. A operação de escrita que inscreve o app modifica a configuração da conta. Só a execute quando houver autorização para essa alteração e registre o resultado; depois, repita o GET e faça novas verificações de evento.

## Testes: não confundir evidências

| Verificação | O que comprova | O que não comprova |
|---|---|---|
| Meta valida o callback | Callback alcançável e verificação concluída | Mensagem real encaminhada e processada |
| Evento interno de teste | Evento de teste recebido no ambiente selecionado | Mensagem real de cliente funcionando |
| Mensagem real gera execução | Evento real chegou ao n8n | Classificação e tratamento downstream corretos |
| Normalizador aceita payload | Parser reconheceu o formato do evento examinado | Resposta de saída ou orçamento funcionando |

Faça cada prova separadamente e anote ambiente, horário e execução. Para um teste real, a pessoa responsável inicia a mensagem ao número de teste. Esta skill não envia respostas automáticas.

## Restrições de envio

Um erro de envio da API pode decorrer de país, destinatário, janela de atendimento, template, permissão ou configuração da conta. Verifique a mensagem completa na execução e a documentação oficial atual. Um erro de envio não prova falha de webhook de entrada.

## Referências oficiais

- n8n — WhatsApp Trigger: https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.whatsapptrigger/
- n8n — credenciais de WhatsApp Business Cloud: https://docs.n8n.io/integrations/builtin/credentials/whatsapp/
- Meta — WhatsApp Business Accounts e Subscribed Apps API: https://developers.facebook.com/documentation/business-messaging/whatsapp/whatsapp-business-accounts/
- Meta — Webhooks para WhatsApp Business Platform: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/
- Hermes — formato e criação de skills: https://github.com/NousResearch/hermes-agent/blob/main/website/docs/developer-guide/creating-skills.md

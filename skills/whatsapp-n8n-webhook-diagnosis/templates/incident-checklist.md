# Checklist de incidente: Meta WhatsApp → n8n

Não registre App Secret, access token, verify token, conteúdo de mensagens pessoais, telefone completo ou dados identificáveis de clientes.

## Identificação

- Data/hora e fuso:
- Ambiente: teste / produção
- Instância n8n (nome, sem credencial):
- Workflow:
- App (alias interno):
- WABA (alias interno):

## Verificações

- [ ] Workflow/escuta no estado esperado para o ambiente
- [ ] Callback Meta corresponde ao endpoint exibido no n8n
- [ ] Evento messages inscrito
- [ ] Gatilho usa credencial OAuth apropriada
- [ ] Credencial de envio não foi confundida com credencial de recebimento
- [ ] GET subscribed_apps consultado, quando necessário
- [ ] Evento interno da Meta testado separadamente
- [ ] Mensagem real iniciada pela pessoa responsável e resultado conferido
- [ ] Payload real aceito pelo normalizador

## Evidências sem dados pessoais

- Evento interno da Meta:
- Execução n8n correspondente:
- Mensagem real: recebida / não recebida
- Última etapa confirmada:
- Causa comprovada:
- Alteração autorizada e realizada:
- Próximo passo:

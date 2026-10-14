---
name: whatsapp-n8n-webhook-diagnosis
description: Diagnostica falhas no webhook Meta–n8n do WhatsApp.
version: 0.2.0
author: Regis Oliveira (clickmaiscabine), Hermes Agent
license: Proprietary
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [whatsapp, n8n, meta-webhook, troubleshooting]
    related_skills: []
---

# WhatsApp n8n Webhook Diagnosis Skill

Diagnostica falhas no recebimento de mensagens do WhatsApp pela Meta Cloud API e pelo n8n. Prioriza inspeções sem alteração, separa problemas de webhook de problemas de envio e só modifica produção dentro da autorização recebida.

## When to Use

- Uma mensagem recebida no WhatsApp não aparece como execução no n8n.
- O evento de teste da Meta funciona, mas uma mensagem real não chega.
- A Meta confirma a assinatura do webhook, mas o gatilho não recebe mensagens.
- É necessário diferenciar URL de teste e URL de produção ou conferir a inscrição do app na WABA.
- **Não use quando:** o webhook está recebendo mensagens corretamente e a tarefa é classificar a intenção, preencher a ficha de orçamento ou responder ao cliente.

## Prerequisites

- Acesso à instância n8n e ao app/portfólio Meta correspondente.
- Permissão de leitura para conferir a configuração do webhook e, se necessário, o vínculo do app à WABA.
- Credenciais mantidas no cofre do n8n ou no cofre de segredos aprovado. Nunca solicite nem imprima App Secret, access token, verify token ou conteúdo integral de credenciais.
- No projeto Click Mais, leia AGENTS.md e os documentos canônicos da pasta afetada antes de propor alterações.

## How to Run

Carregue esta skill quando houver falha de recebimento. Use browser_navigate para inspecionar n8n e Meta e read_file para consultar os documentos do projeto. Use terminal somente para consultas explicitamente autorizadas; não copie segredos para comandos, logs ou arquivos.

## Quick Reference

| Item | Regra |
|---|---|
| Credencial de recebimento | OAuth da Meta com App ID e App Secret guardados no n8n; vinculada ao gatilho de recebimento |
| Credencial de envio | WhatsApp API com access token e Phone Number ID; não substitui a credencial OAuth do gatilho |
| Callback de teste | A URL de teste só recebe eventos enquanto o n8n está ouvindo |
| Callback de produção | A URL de produção só recebe eventos quando o workflow está ativo/publicado |
| Campo de webhook | Confira se o evento de mensagens está inscrito; não confunda mensagens com status de entrega |
| Associação WABA–app | GET /{WABA_ID}/subscribed_apps mostra quais apps estão inscritos |
| Prova de conectividade | Evento de teste da Meta e mensagem real recebida são verificações distintas |

## Procedure

1. **Delimite o ambiente** — Leia AGENTS.md e a documentação da integração se estiver trabalhando no repositório Click Mais. Registre se o alvo é teste ou produção e o nome do workflow. Não altere configurações nesta etapa. Pronto quando: instância, workflow e ambiente estão identificados.

2. **Inspecione o gatilho no n8n** — Confirme se o workflow está ativo para produção, qual credencial de recebimento está selecionada, qual URL é exibida e quais eventos são subscritos. Não desative outros workflows em lote. Pronto quando: há evidência da configuração atual, sem expor credenciais.

3. **Compare o callback na Meta** — Compare a URL cadastrada na Meta com a URL correspondente exibida pelo gatilho. Não remova ou acrescente manualmente partes como -test: a Meta e o n8n precisam usar o mesmo callback de teste ou de produção. Pronto quando: a URL e o estado ativo/ouvindo são compatíveis.

4. **Separe recebimento de envio** — Verifique se o gatilho usa a credencial OAuth de recebimento e se ela está associada ao app correto. Trate o token da credencial WhatsApp API como credencial de envio. Não peça que a pessoa cole segredos no chat. Pronto quando: cada credencial está no papel correto ou a divergência está registrada.

5. **Execute verificações independentes** — Se autorizado, envie o evento de teste da Meta e confira a execução correspondente no n8n. Para validar entrada real, peça à pessoa responsável que envie uma nova mensagem após a escuta estar pronta; não envie mensagens de saída a clientes. Pronto quando: resultado de evento de teste e de mensagem real estão registrados separadamente.

6. **Verifique a inscrição da WABA** — Se o teste interno chega, mas a mensagem real não, faça primeiro uma leitura GET em /{WABA_ID}/subscribed_apps usando o app e as permissões adequados. Compare o App ID esperado ao resultado. Não conclua que um app está vinculado só porque o webhook mostra confirmação verde. Pronto quando: a leitura mostra se o app esperado está ou não inscrito.

7. **Corrija somente a causa comprovada** — Alterar callback, subscrever o app à WABA, ativar workflow ou mudar credencial altera produção. Faça essas mudanças apenas quando a autorização da pessoa abranger claramente a ação e o alvo; em caso de dúvida, apresente a diferença observada e peça autorização específica. Depois de uma alteração de inscrição, releia subscribed_apps. Pronto quando: a mudança foi confirmada pela leitura posterior.

8. **Confira o payload recebido** — Se o n8n registrar execução mas o fluxo rejeitar a mensagem, compare a estrutura real do evento com o normalizador. Reproduza o payload em teste e valide o resultado antes de preparar publicação. Não publique uma mudança de código em produção sem homologação prevista no protocolo do projeto. Pronto quando: o formato real é reconhecido e a evidência do teste está registrada.

9. **Feche com evidências** — Informe causa confirmada ou ainda não confirmada, leituras realizadas, alterações feitas, resultados de teste e próximo passo. Diferencie “Meta enviou o evento”, “n8n criou execução” e “o workflow processou a mensagem”. Pronto quando: outra pessoa consegue reproduzir a conclusão sem acesso a segredos.

## Pitfalls

| Sintoma | Causa possível | Correção |
|---|---|---|
| Evento de teste funciona, mensagem real não chega | A inscrição da WABA, o app selecionado, o destinatário ou o callback de produção pode divergir | Compare app, WABA, inscrição, destinatário e callback; confirme cada hipótese com evidência |
| URL de teste validada, mas não há execução depois | A janela de escuta pode ter terminado ou o workflow pode não estar ativo em produção | Use a URL e o estado correspondentes ao ambiente que está sendo validado |
| Evento aparece, mas o normalizador rejeita a mensagem | O payload real pode ter estrutura diferente da fixture ou do evento simulado | Examine a execução e teste o normalizador com uma cópia sanitizada do payload |
| Erro de envio como 130497 | Restrição de envio, país, destinatário, template ou configuração da conta | Consulte a documentação atual da Meta; não trate erro de envio como prova de falha no webhook de entrada |
| Aviso sobre mais de um gatilho do WhatsApp | Limitação de configuração relacionada ao app ou ao callback | Inspecione os workflows e a configuração Meta; não desative workflows sem identificar o impacto |
| GET mostra o app correto | A associação está presente, mas isso não prova que callback, gatilho, credencial e parser estão corretos | Continue a validação por etapas; não repita POST sem motivo |

## Verification

Considere o recebimento validado somente quando uma mensagem real enviada pela pessoa responsável, após a escuta ou ativação apropriada, criar uma execução identificável no n8n e o workflow reconhecer o evento. Registre separadamente o resultado do teste interno da Meta. Se qualquer etapa falhar, reporte o último ponto confirmado e não declare sucesso integral.

## Files

- Para a sequência de diagnóstico, distinções entre credenciais e referências oficiais, leia references/meta-webhook-runbook.md.
- Para registrar uma investigação, copie templates/incident-checklist.md e preencha sem incluir segredos ou dados pessoais desnecessários.

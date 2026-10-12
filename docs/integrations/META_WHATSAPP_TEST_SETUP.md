# Meta / WhatsApp — ambiente de teste liberado para n8n

Status: homologated  
Escopo da homologação: **configuração do ambiente Meta TEST, por decisão expressa do responsável em 11/10/2026; dispatch de orçamento e produção não homologados**  
Registro: 2026-10-10 (America/Sao_Paulo)  
Marco documentado na fonte: 2026-10-09, 21:56 BRT  
Fonte: [documento visual recebido, com telefones pessoais mascarados](sources/2026-10-09_doc-final-click-mais.sanitized.html).

## Estado atual

Regis informou que concluiu a configuração Meta e liberou o número de teste para uso pelos fluxos n8n. O documento registra o recebimento do Hello World, erro 130497 superado em tentativa posterior, usuário de sistema criado e token sob guarda do Hermes. Em 11/10/2026, o responsável enviou captura do WhatsApp mostrando a mensagem Hello World recebida às 21:56 e confirmou os IDs do app/Business na URL da Meta. Informou atualização de token em 10/10/2026, sem divulgar seu valor.

Este registro substitui a pendência genérica de obter app, número de teste e token. Não homologa os workflows comerciais nem habilita atendimento em produção. Nesta atualização houve revisão documental; não houve consulta autenticada à Meta, leitura do cofre, envio de mensagem ou execução de workflow.

## Inventário não secreto

| Ativo | Identificação | Proveniência / observação |
|---|---|---|
| Portfólio | studio_danTons | Nome informado na fonte |
| Business Portfolio ID | `249018410217197` | Confirmado pelo responsável na URL de configuração da Meta enviada em 11/10/2026; documento anterior trazia `2490184102171978` (dígito final divergente, mantido apenas no histórico) |
| Empresa | Click Mais Cabine | Cadastro descrito na fonte; verificação empresarial não comprovada |
| App | Chatbot Click Mais | Consta no documento final |
| App ID | `1114371521124730` | Confirmado pelo responsável pela URL de API Testing do app em 11/10/2026 |
| WABA | Test WhatsApp Business Account | Acesso total descrito |
| WABA ID | `4568886160009455` | Documento final |
| Número da Meta para testes | +1 (555) 653-0357 | Remetente de teste; não é o número comercial |
| Test Phone Number ID | `1350381714825884` | Documento final |
| Usuário de sistema | N8N - Click Mais | Acesso de administrador e dois ativos descritos |
| System User ID | `61595281320448` | Documento final |
| Token | Guarda: cofre do Hermes | Valor omitido; não acessado nesta atualização |
| Expiração do token | Opção “Nunca”, segundo a fonte | Não equivale a garantia de validade eterna; confirmar validade e acesso no uso |
| Permissões do token | `whatsapp_business_messaging`, `whatsapp_business_management`, `business_management` | Descritas na fonte; não consultadas novamente |
| Destinatários de teste | Três números descritos; finais 0053, 0586 e 8982 | Números completos preservados somente no documento original entregue pelo usuário |

O telefone comercial usado como destinatário de teste não se torna, por isso, um remetente conectado à Cloud API. Não há autorização nesta atualização para migrar ou cadastrar número real.

## Evidências registradas e alcance

| Item | Resultado documentado | Limite da evidência disponível |
|---|---|---|
| Envio Hello World | **Comprovado por captura de tela**: mensagem de entrada `Hello World` no WhatsApp do destinatário, associada ao remetente de teste `+1 (555) 653-0357`, às 21:56 (09/10/2026, sexta-feira) | Evidência visual entregue em 11/10/2026; sem resposta HTTP bruta/message ID nem evidência de quote dispatch |
| Leitura | 21:56:12, duplo check azul; fonte menciona delivered/read | Relato no HTML; não reexecutado nesta atualização |
| Erro 130497 | **Histórico de uma tentativa anterior malsucedida**; envio posterior Hello World observado no WhatsApp | Resolução operacional evidenciada no teste mostrado; causa específica não documentada e não presumida |
| Webhook | Fonte informa “200 OK”, “N8N recebeu” e `messages[0].type = text` | Callback URL, workflow ID e execution ID ausentes |
| Ida e volta | Usuário declara procedimento concluído; HTML descreve entrada, webhook e resposta | Não há cadeia de IDs que relacione mensagem recebida, execução n8n e resposta; capturar na próxima validação dos fluxos |

Envio, recebimento de mensagem e notificações de status são verificações diferentes. Um status delivered/read ou resposta HTTP 200 não identifica, sozinho, uma mensagem de entrada processada pelo workflow.

## Uso nos próximos testes

1. Ler este registro e identificar o workflow de laboratório existente; reaproveitar o que já foi criado.
2. Usar os IDs confirmados pelo responsável e pela URL de configuração Meta em 11/10/2026; registrar eventual divergência futura apenas mediante nova evidência.
3. Selecionar o destinatário autorizado e confirmar que continua cadastrado.
4. Associar o token à credencial segura do n8n conforme o [handoff de credencial](../05_seguranca/META_TOKEN_HANDOFF.md); não obter seu valor pelo chat.
5. Usar o Test Phone Number ID `1350381714825884` e a WABA `4568886160009455`. Não substituir pelo número comercial.
6. Identificar o Callback URL real, a assinatura do campo `messages` e o workflow responsável, sem inventar endpoint ou sobrescrever webhook existente.
7. Validar uma mensagem de entrada real do destinatário, correlacionar a execução do workflow e a resposta entregue. Registrar horários, IDs e resultado, com telefones e conteúdo pessoal reduzidos.
8. Tratar as notificações de status separadamente para evitar resposta a status ou ciclos de automação.

O documento explica que a mensagem enviada pelo usuário ao número de teste abre/renova a janela de atendimento de 24 horas. O envio de Hello World pela empresa não abre essa janela por si só. Antes de implementar regras de envio, conferir a política oficial vigente e a janela da conversa; não tratar exemplos do mapa como logs de execução.

## Pendências de documentação, sem reabrir a configuração concluída

- Business Portfolio ID `249018410217197` confirmado por URL de configuração fornecida pelo responsável em 11/10/2026. O registro antigo `2490184102171978` é histórico e não deve ser usado para configurar.
- Registrar vínculo atual do app/WABA/usuário de sistema e App ID observado.
- Registrar workflow ID, Callback URL e execution ID de validação, sem Verify Token ou outros segredos.
- Documentar assinatura do campo `messages`, validação do webhook e controles de autenticidade adotados.
- Registrar a causa e a ação que resolveram 130497, se recuperáveis.
- Confirmar armazenamento efetivo da credencial no n8n; posse pelo Hermes não prova instalação no runtime.
- A fonte diz “3 números + 3 vagas” e também “limite 5”: contagem incompatível. Não publicar seis vagas como capacidade confirmada.
- A fonte menciona 250 mensagens/dia e “teste para sempre”: manter como afirmações históricas, não garantias operacionais.
- A futura troca de número não está autorizada. Reuso do token/WABA, aprovação de nome e disponibilidade de templates devem ser avaliados na etapa de produção; não presumir que basta trocar o Phone Number ID.

## Caminhos de referência

- [Meus apps](https://developers.facebook.com/apps) → Chatbot Click Mais → WhatsApp → Configuração da API.
- [Configurações empresariais](https://business.facebook.com/latest/settings) → selecionar portfólio observado → Usuários → Usuários do sistema → N8N - Click Mais.
- [WhatsApp Manager](https://business.facebook.com/wa/manager).

Os rótulos podem variar na interface. Para as próximas configurações, usar o Business Portfolio ID `249018410217197` informado pelo responsável; não usar o dígito final espúrio do HTML histórico.

## Histórico e tratamento da fonte

O HTML recebido foi preservado como referência visual histórica em versão sanitizada: números pessoais foram mascarados, o título foi ajustado e foi acrescentada indicação de leitura deste registro. IDs dos ativos e número de teste permanecem disponíveis. O original recebido não foi editado.

As afirmações de “100% OK”, validade infinita, vagas e migração presentes na fonte não substituem as ressalvas e o alcance das evidências descritos aqui.


## Evidência posterior de entrega e identificação da Meta — 11/10/2026

- **Origem:** captura WhatsApp fornecida pelo responsável na conversa, mostrando `Hello World` recebido do número de teste `+1 (555) 653-0357` às **21:56 de sexta-feira (09/10/2026)**, após mensagens de entrada enviadas pelo próprio destinatário. A captura confirma recebimento da mensagem de amostra e mostra o aviso de canal gerido pela Meta.
- **App ID:** `1114371521124730`. **Business Portfolio ID validado na URL de API Testing:** `249018410217197`. O ID anterior `2490184102171978` era divergente no registro histórico e não será utilizado.
- **Phone Number ID:** `1350381714825884`. **WABA ID:** `4568886160009455`. **Webhook field:** `messages`; responsável relata recebimento de eventos.
- **Token:** responsável informa atualização em **10/10/2026**, sem fornecer segredo; validade, permissão e associação à credencial efetiva do n8n serão comprovadas tecnicamente quando executar testes. Não inserir token em documentos/commits.
- **Status:** entrega do Hello World **comprovada visualmente**, não apenas relatada. O erro `130497` era histórico de tentativa anterior; não implica falha persistente do teste atual.
- **Limites técnicos não superados por essa imagem:** não há `wamid`, execução n8n, retorno HTTP da API, prova de payload de webhook nem disparo de orçamento comercial. Prosseguir com T005/T024 em ambiente TEST. Número comercial e produção continuam fora do escopo da homologação.

**URL fornecida pelo responsável (somente IDs públicos de configuração, não token):**
[Meta Developers — API Testing do Chatbot Click Mais](https://developers.facebook.com/apps/1114371521124730/use_cases/customize/api-testing-v2/?product_route=whatsapp-business&business_id=249018410217197&use_case_enum=WHATSAPP_BUSINESS_MESSAGING&selected_tab=api-testing-v2).

## Homologação da configuração por decisão do responsável — 11/10/2026

O responsável confirma expressamente que a Meta WhatsApp está configurada para desenvolvimento das automações, com **número de teste disponível**. Este marco de **provisionamento/configuração TEST está HOMOLOGADO**, conforme DEC-018 e [registro no Notion](https://app.notion.com/p/3eb9fb22b1fa81bcbbbeff9a92ad140d).

Não significa que o novo workflow de orçamento foi implementado ou testado, nem que o token já está comprovadamente instalado no n8n, nem que a API do número comercial pode ser ativada. Permanecem necessários: confirmar credencial de runtime sem expor token; identificar webhook/execução/ID de mensagem; validar janela/template, destinatário e Guard; e comprovar E2E de orçamento em TEST antes de qualquer alteração de produção.

# Status das integrações — Click Mais OS

Atualizado: 2026-10-03  
Este arquivo não contém segredos, usuários pessoais, senhas nem tokens.

| Integração | Papel | Estado | Runtime |
|---|---|---|---|
| Meta WhatsApp Business Platform | transporte oficial e número de teste/produção | **credenciais pendentes** | standby |
| Chatwoot Cloud | inbox, CRM visual e handoff | **credenciais pendentes** | standby |
| Supabase | Event State Engine + auditoria | ativo | habilitado |
| n8n self-hosted | orquestração | ativo | habilitado |
| Hostinger VPS | hospedagem do n8n | ativo | habilitado |
| GitHub | fonte canônica | ativo | habilitado |
| OpenAI Platform | modelos/agentes autorizados | ativo | habilitado |
| Google Drive | artefatos operacionais | ativo | habilitado |
| Google Calendar | agenda/disponibilidade | ativo | habilitado |
| Trello | projeção de trabalho humano | ativo | habilitado |
| Autentique | assinatura de contratos | ativo | habilitado |
| OneDrive | entrega canônica de mídia pós-evento | ativo | habilitado |
| Publicação Facebook | publicação opcional pós-evento | standby | depende de consentimento |

## Meta

A identidade/estrutura antiga não será reutilizada nesta fase. A operação aguardará uma estrutura limpa de negócio/desenvolvedor.

Primeiro objetivo quando as credenciais chegarem:

1. Meta App com WhatsApp;
2. número de teste;
3. webhook de teste;
4. n8n recebe/envia em ambiente de teste;
5. somente depois avaliar Coexistence e número oficial.

O repositório e o Supabase já podem conter adapters, contratos e flags para Meta com `runtime_enabled=false`.

## Chatwoot

Onboarding aguarda e-mail institucional. Até lá:

- modelar os campos/atributos que serão espelhados;
- preparar adapter/webhook em standby;
- não bloquear Event State Engine nem workflows internos;
- ativar somente depois de receber credencial pelo cofre.

## Hermes

Pacote documental das plataformas e skills do projeto foram concluídos fora deste repositório antes desta consolidação. Esta arquitetura não recria essas skills; apenas define os contratos que elas devem respeitar.

## Segredos

Credenciais ficam no cofre/secret store. `integrations.registry` registra apenas estado de disponibilidade e referências não secretas.

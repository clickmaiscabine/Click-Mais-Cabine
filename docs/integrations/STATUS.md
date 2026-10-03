# Status das integrações — Click Mais OS

Atualizado: 2026-10-03  
Este arquivo não contém segredos, usuários pessoais, senhas nem tokens.

| Integração | Papel | Estado | Runtime |
|---|---|---|---|
| Meta WhatsApp Business Platform | transporte oficial e número de teste/produção | credenciais pendentes | standby |
| **Trello** | **cockpit humano e CRM visual da V1** | **ativo** | **habilitado/projeção** |
| Chatwoot | opcional/futuro; inbox compartilhado se necessário | optional_future | desabilitado |
| Supabase | Event State Engine + auditoria | ativo | habilitado |
| n8n self-hosted | orquestração | ativo | habilitado |
| Hostinger VPS | hospedagem do n8n | ativo | habilitado |
| GitHub | fonte canônica | ativo | habilitado |
| OpenAI Platform | modelos/agentes autorizados | ativo | habilitado |
| Google Drive | artefatos operacionais | ativo | habilitado |
| Google Calendar | agenda/disponibilidade | ativo | habilitado |
| Autentique | assinatura de contratos | ativo | habilitado |
| OneDrive | entrega canônica de mídia pós-evento | ativo | habilitado |
| Publicação Facebook | publicação opcional pós-evento | standby | depende de consentimento |

## Meta

Primeiro objetivo quando as credenciais chegarem:

1. Meta App com WhatsApp;
2. número de teste;
3. webhook de teste;
4. n8n recebe/envia em teste;
5. somente depois avaliar número oficial/Coexistence.

## Trello

Decisão V1: Trello substitui o papel visual/humano que havia sido previsto para Chatwoot.

O quadro histórico **Controle de Orçamentos** será estudado antes de qualquer alteração.

Princípio:

```text
Supabase = verdade
Trello = projeção humana
n8n = sincronização
```

Mudanças humanas no Trello devem gerar webhook/comando para n8n; o n8n valida e persiste no Supabase.

## Chatwoot

Não é dependência obrigatória da V1. Mantém-se apenas como alternativa futura.

Não contratar plano nem infraestrutura adicional apenas para satisfazer esta arquitetura.

## Hermes

Pacote documental das plataformas e skills do projeto foi concluído. As skills devem respeitar ADR-0005 ao trabalhar com CRM/handoff.

## Segredos

Credenciais ficam no cofre/secret store.

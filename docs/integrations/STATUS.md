# Status das integrações — Click Mais OS

Atualizado: 2026-10-05  
Este arquivo não contém segredos, usuários pessoais, senhas nem tokens.

| Integração | Papel | Estado | Runtime |
|---|---|---|---|
| Meta WhatsApp Business Platform | transporte oficial e número de teste/produção | credenciais pendentes | standby |
| **Trello** | **cockpit humano e CRM visual da V1** | **ativo** | **habilitado/projeção** |
| Chatwoot | fora do projeto V1 | out_of_scope_v1 | desabilitado |
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

```text
Supabase = verdade
Trello = projeção humana
n8n = sincronização
```

Trello Comercial:
- card nasce após orçamento enviado;
- pipeline homologado: ORÇAMENTO → RESPOSTA → FAC/DÚVIDAS → NEGOCIAÇÃO BOT/HUMANO → FECHAMENTO → GANHO/PERDIDO.

Trello Logística:
- separado do Comercial;
- acompanha operação após transição comercial definida.

Mudanças humanas no Trello geram webhook/comando para n8n; o n8n valida e persiste no Supabase.

## Chatwoot

Fora do projeto V1 por decisão homologada em 2026-10-05.

Não contratar plano nem infraestrutura para Chatwoot na V1.

Qualquer reentrada exige nova decisão explícita.

## Segredos

Credenciais ficam no cofre/secret store.

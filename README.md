# Click Mais Cabine — Base Canônica do Click Mais OS

> **Status:** arquitetura-base v0.3  
> Este repositório é a fonte canônica de software, documentação, workflows, pesquisas, contratos de dados e instruções para agentes do projeto Click Mais Cabine.

## 1. Regra principal

O projeto não pertence a uma IA, a uma conversa ou ao n8n.

- **GitHub** = memória canônica do projeto.
- **Supabase** = estado operacional, Event State Engine e CRM canônico.
- **n8n** = orquestração e execução.
- **JEV** = decisão semântica dentro de classes autorizadas.
- **código determinístico** = regras inequívocas.
- **LLM** = linguagem e transformação, sem autoridade comercial própria.
- **Trello** = cockpit humano e CRM visual da V1.
- **Meta Cloud API** = transporte oficial do WhatsApp.
- **OneDrive** = entrega canônica de mídia pós-evento.
- **Chatwoot** = opcional/futuro; não bloqueia a V1.
- **Agentes** = trabalhadores especializados que leem e alteram artefatos versionados.

```text
GitHub
  ↓
DEV / testes / homologação
  ↓
n8n self-hosted
  ↓
Supabase ↔ Trello
  ↓
Meta/WhatsApp + serviços externos
```

## 2. Leitura obrigatória

1. `README.md`
2. `AGENTS.md`
3. `PROJECT.md`
4. `ARCHITECTURE.md`
5. `MANIFEST.json`
6. README da pasta afetada
7. schemas, testes e ADRs relacionados

Ordem de autoridade:

```text
decisão humana registrada
→ ADR aprovada
→ schemas/contratos
→ ARCHITECTURE.md
→ MANIFEST.json
→ implementação
```

## 3. Arquitetura adotada

> **Oficial no transporte, determinístico no negócio, JEV nas decisões, LLM na linguagem, Supabase na memória, n8n na execução e Trello na operação humana visual.**

Documentos:
- `docs/architecture/CLICK-MAIS-OS-v1.md`
- `docs/architecture/TRELLO-CRM-V1.md`
- `docs/architecture/MODULE-ALLOCATION.md`
- `docs/decisions/ADR-0005_trello-cockpit-crm-v1.md`

Fluxo resumido:

```text
Cliente
  ↕
WhatsApp / Meta Cloud
  ↕
n8n
  ↕
Supabase / Event State Engine
  ↕
Trello / cockpit humano
```

## 4. Trello CRM V1

Regra:

```text
Supabase = verdade
Trello = projeção humana
n8n = sincronização
```

Uma ação no Trello não escreve diretamente no estado canônico. Ela passa por n8n + Guard + Supabase + Audit.

Unidade recomendada:

```text
1 cartão Trello = 1 business.customer_event
```

O quadro legado **Controle de Orçamentos** deve ser estudado antes de qualquer alteração. A lógica histórica de colunas, labels, filtros de data e remarketing deve ser preservada quando útil.

## 5. Workflows n8n

Os JSONs homologados vivem no GitHub.

`n8n/WORKFLOW-MANIFEST.json` descreve o mapa funcional; não afirma que os JSONs executáveis já existem.

## 6. Supabase

Projeto operacional: **Chatbot Clique Mais**.

### Runtime
- `core.sessions`
- `core.events`
- `core.state_transitions`
- `audit.agent_runs`
- `audit.workflow_runs`

### Negócio
- `business.contacts`
- `business.customer_events`
- `business.event_services`
- `business.event_facts`
- `business.event_stage_transitions`
- `business.module_states`
- `business.quotes`
- `business.contracts`
- `business.payments`
- `business.art_jobs`
- `business.logistics`
- `business.deliveries`
- `business.publication_consents`
- `business.campaigns`
- `business.followups`
- `business.human_handoffs`

## 7. Integrações

- Meta/WhatsApp: standby até credenciais/número de teste.
- Trello: ativo e adotado como cockpit humano da V1.
- Chatwoot: opcional/futuro.
- OneDrive: entrega canônica.
- Google Drive, Calendar, Trello, Autentique e demais integrações não substituem o estado canônico do Supabase.

## 8. Segurança

Nunca commitar senhas, tokens, chaves API, `service_role`, credenciais Meta/WhatsApp, credenciais n8n, dumps ou dados reais de clientes.

## 9. Estado atual

A arquitetura-base **v0.3** inclui:
- governança multiagente;
- Event State Engine;
- CRM operacional no Supabase;
- OneDrive canônico;
- Trello definido como cockpit humano/CRM visual da V1;
- Chatwoot removido do caminho crítico;
- manifesto funcional dos workflows;
- validação automática do repositório.

Ainda não significa:
- workflows n8n executáveis concluídos;
- pricing engine final;
- Meta ativa;
- sincronização Trello V1 pronta;
- JEV runtime;
- compositor/Guards em produção.

## 10. Próxima camada

```text
CM-WF-010 identidade/contexto
→ CM-WF-020 fatos
→ regras determinísticas
→ JEV
→ Guards
→ compositor
→ projeção Trello
→ Meta quando credenciais chegarem
```

**Princípio operacional:** se uma informação precisa sobreviver à troca de conversa, agente ou modelo, ela deve ser registrada no lugar canônico correto.

# Click Mais Cabine — Base Canônica do Click Mais OS

> **Status:** arquitetura-base v0.4  
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
- **Chatwoot** = fora do projeto V1.
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
4. `docs/00_governanca/CLICK_MAIS_OS_BASELINE_FUNCIONAL_v1.1.md`
5. `docs/00_governanca/REGISTRO_DE_DECISOES.md`
6. `ARCHITECTURE.md`
7. `MANIFEST.json`
8. README da pasta afetada
9. schemas, testes e ADRs relacionados

Ordem de autoridade:

```text
decisão humana registrada
→ ADR homologada mais recente
→ baseline funcional homologada
→ schemas/contratos
→ arquitetura
→ manifesto
→ implementação
```

## 3. Organização documental

A fase de Projeto Executivo usa a estrutura:

- `docs/00_governanca/`
- `docs/01_negocio/`
- `docs/02_arquitetura/`
- `docs/03_dados/`
- `docs/04_workflows/`
- `docs/05_seguranca/`
- `docs/06_testes/`
- `docs/07_projeto_executivo/`

Ver `docs/README.md`.

Documentos anteriores em `docs/architecture/` e `docs/decisions/` permanecem preservados e versionados.

## 4. Arquitetura adotada

> **Oficial no transporte, determinístico no negócio, JEV nas decisões, LLM na linguagem, Supabase na memória, n8n na execução e Trello na operação humana visual.**

Documentos vinculantes atuais:
- `docs/00_governanca/CLICK_MAIS_OS_BASELINE_FUNCIONAL_v1.1.md`
- `docs/00_governanca/REGISTRO_DE_DECISOES.md`
- `docs/decisions/ADR-0006_origem-lead-pipeline-comercial-v1.md`
- `docs/architecture/CLICK-MAIS-OS-v1.md`
- `docs/architecture/TRELLO-CRM-V1.md`
- `docs/architecture/MODULE-ALLOCATION.md`

Fluxo de aquisição principal:

```text
Anúncio
  ↓
Landing Page
  ↓
WhatsApp / Meta Cloud
  ↓
n8n
  ↓
Supabase / Event State Engine
  ↓
Trello quando ORCAMENTO_ENVIADO
```

## 5. Trello CRM V1

Regra:

```text
Supabase = verdade
Trello = projeção humana
n8n = sincronização
```

Uma ação no Trello não escreve diretamente no estado canônico. Ela passa por n8n + Guard + Supabase + Audit.

O Supabase pode registrar contato/evento desde a entrada. O card do **Trello Comercial nasce somente após orçamento efetivamente enviado**, quando o contato se torna lead qualificado.

Pipeline homologado:

```text
ORÇAMENTO
→ RESPOSTA
→ FAC / DÚVIDAS
→ NEGOCIAÇÃO BOT / HUMANO
→ FECHAMENTO
→ GANHO ou PERDIDO
```

Um cartão comercial representa um `business.customer_event` qualificado por orçamento enviado.

## 6. Workflows n8n

Os JSONs homologados vivem no GitHub.

`n8n/WORKFLOW-MANIFEST.json` descreve o mapa funcional; não afirma que os JSONs executáveis já existem.

## 7. Supabase

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

## 8. Integrações

- Meta/WhatsApp: standby até credenciais/número de teste.
- Trello: ativo e adotado como cockpit humano da V1.
- Chatwoot: fora do escopo V1.
- OneDrive: entrega canônica.
- Google Drive, Calendar, Trello, Autentique e demais integrações não substituem o estado canônico do Supabase.

## 9. Segurança

Nunca commitar senhas, tokens, chaves API, `service_role`, credenciais Meta/WhatsApp, credenciais n8n, dumps ou dados reais de clientes.

## 10. Estado atual

A arquitetura-base **v0.4** inclui:
- governança multiagente;
- baseline funcional v1.1;
- registro de decisões;
- Event State Engine;
- CRM operacional no Supabase;
- OneDrive canônico;
- Trello como cockpit humano/CRM visual da V1;
- qualificação do lead por orçamento enviado;
- pipeline comercial homologado;
- Chatwoot fora do projeto V1;
- manifesto funcional dos workflows;
- validação automática do repositório.

Ainda não significa:
- Projeto Executivo concluído;
- workflows n8n executáveis concluídos;
- pricing engine final;
- Meta ativa;
- sincronização Trello V1 pronta;
- JEV runtime;
- compositor/Guards em produção.

## 11. Próxima camada

```text
Baseline + decisões
→ Projeto Executivo
→ contratos/schemas
→ especificações de workflow
→ fixtures/testes
→ implementação
→ DEV
→ homologação
→ PROD
```

**Princípio operacional:** se uma informação precisa sobreviver à troca de conversa, agente ou modelo, ela deve ser registrada no lugar canônico correto.

# Click Mais Cabine — Base Canônica do Click Mais OS

> **Status:** arquitetura-base v0.2  
> Este repositório é a fonte canônica de software, documentação, workflows, pesquisas, contratos de dados e instruções para agentes do projeto Click Mais Cabine.

## 1. Regra principal

O projeto não pertence a uma IA, a uma conversa ou ao n8n.

- **GitHub** = memória canônica do projeto.
- **Supabase** = estado operacional, Event State Engine e auditoria.
- **n8n** = orquestração e execução.
- **JEV** = decisão semântica dentro de classes autorizadas.
- **código determinístico** = regras inequívocas.
- **LLM** = linguagem e transformação, sem autoridade comercial própria.
- **Chatwoot** = cockpit humano e CRM visual.
- **Meta Cloud API** = transporte oficial do WhatsApp.
- **OneDrive** = entrega canônica de mídia pós-evento.
- **Agentes** = trabalhadores especializados que leem e alteram artefatos versionados.

```text
GitHub (o que o sistema É)
        ↓
DEV / testes
        ↓
homologação
        ↓
n8n PROD na VPS
        ↓
Supabase + Meta/WhatsApp + Chatwoot + serviços externos
```

## 2. Leitura obrigatória para qualquer agente

Antes de criar, revisar ou alterar qualquer artefato, leia nesta ordem:

1. `README.md`
2. `AGENTS.md`
3. `PROJECT.md`
4. `ARCHITECTURE.md`
5. `MANIFEST.json`
6. o `README.md` da pasta afetada
7. schemas, testes e ADRs relacionados

Se houver conflito, a ordem de autoridade é:

```text
decisão humana registrada
→ ADR aprovada
→ schemas/contratos
→ ARCHITECTURE.md
→ MANIFEST.json
→ implementação
→ notas/comentários
```

Nenhum agente deve “corrigir” uma regra superior alterando apenas a implementação.

## 3. Arquitetura adotada

A fórmula vinculante é:

> **Oficial no transporte, determinístico no negócio, JEV nas decisões, LLM na linguagem, Supabase na memória, n8n na execução e Chatwoot na operação humana.**

Mapa completo:

- `docs/architecture/CLICK-MAIS-OS-v1.md`
- `docs/architecture/MODULE-ALLOCATION.md`
- `docs/architecture/COMPONENT-MAP.md`
- `docs/decisions/ADR-0003_click-mais-os-arquitetura-producao.md`

Fluxo resumido:

```text
Cliente
  ↕
WhatsApp / Meta Cloud
  ↕
Chatwoot
  ↓ webhook
n8n / WF-00
  ↓
Supabase / Event State Engine
  ↓
regras determinísticas
  ↓
JEV quando necessário
  ↓
Guards
  ↓
módulo operacional
  ↓
LLM compositor quando houver texto
  ↓
Audit
  ↓
Chatwoot / Meta / cliente
```

## 4. Estrutura

```text
Click-Mais-Cabine/
├── README.md
├── AGENTS.md
├── PROJECT.md
├── ARCHITECTURE.md
├── MANIFEST.json
├── CHANGELOG.md
├── .env.example
├── docs/
│   ├── decisions/
│   ├── architecture/
│   ├── business-rules/
│   ├── integrations/
│   ├── security/
│   └── product/
├── knowledge/
├── schemas/
├── prompts/
├── n8n/
│   ├── WORKFLOW-MANIFEST.json
│   ├── workflows/
│   ├── subflows/
│   ├── fixtures/
│   └── tests/
├── src/
│   ├── functions/
│   ├── validators/
│   └── adapters/
├── research/
├── supabase/
│   └── migrations/
└── deploy/
```

## 5. Onde guardar cada coisa

| Artefato | Local |
|---|---|
| Workflow n8n exportado | `n8n/workflows/` |
| Manifesto funcional de workflows | `n8n/WORKFLOW-MANIFEST.json` |
| Subworkflow reutilizável | `n8n/subflows/` |
| Entrada de teste | `n8n/fixtures/` |
| Teste de workflow | `n8n/tests/` |
| Schema JSON | `schemas/` |
| Prompt | `prompts/` |
| Regra de negócio | `docs/business-rules/` |
| Decisão arquitetural | `docs/decisions/` |
| Mapa de integração | `docs/integrations/` |
| Pesquisa | `research/<tema>/` |
| Conhecimento do chatbot | `knowledge/` |
| Código auxiliar | `src/` |
| Migração Supabase | `supabase/migrations/` |
| Segredo/credencial | **NUNCA no GitHub** |

## 6. Convenções

### Workflows n8n
```text
CM-WF-000_whatsapp-ingress-orchestrator.json
CM-WF-010_identity-context.json
CM-WF-020_fact-normalization.json
```

### Subflows
```text
CM-SF-001_normalizar-telefone.json
```

### ADRs
```text
ADR-0001_fonte-canonica-github.md
ADR-0003_click-mais-os-arquitetura-producao.md
```

### Pesquisas
```text
research/meta/2026-10-01_webhooks-whatsapp.md
```

Toda pesquisa deve registrar data, pergunta, fontes, fatos verificados, conclusão, impacto e itens ainda incertos.

## 7. Ciclo de alteração

```text
tarefa/issue
→ branch
→ alteração
→ testes
→ revisão
→ Pull Request
→ homologação
→ merge
→ DEV
→ validação
→ PROD
```

O n8n de produção não é o editor principal do sistema.

## 8. Regra para workflows n8n

O JSON exportado e homologado deve existir no GitHub.

O `n8n/WORKFLOW-MANIFEST.json` é apenas o mapa da construção. Ele não afirma que um workflow executável já existe.

Ao alterar um workflow:

1. localizar o ID `CM-WF-xxx`;
2. ler workflow, schemas e testes relacionados;
3. alterar em branch;
4. validar o JSON;
5. executar fixtures/testes;
6. atualizar `MANIFEST.json` se dependências/status mudarem;
7. atualizar `CHANGELOG.md`;
8. homologar em DEV;
9. somente depois promover para PROD.

Credenciais do n8n nunca entram no repositório.

## 9. Supabase / Event State Engine

Projeto operacional: **Chatbot Clique Mais**.

O Supabase não substitui o GitHub. Ele guarda o estado de execução.

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

### Integrações

`integrations.registry` registra disponibilidade e runtime sem armazenar qualquer segredo.

A definição versionável do banco também existe em `supabase/migrations/`.

## 10. Estado das integrações

No momento da arquitetura v0.2:

- Meta/WhatsApp: **standby / credenciais pendentes**;
- Chatwoot: **standby / credenciais pendentes**;
- Supabase, n8n/Hostinger, GitHub, OpenAI, Google, Trello, Autentique e OneDrive: infraestrutura/acessos disponíveis segundo a operação;
- OneDrive: **canônico para entrega pós-evento**;
- publicação social: fluxo separado, opcional e dependente de consentimento.

Ver `docs/integrations/STATUS.md`.

## 11. OneDrive e publicação social

OneDrive é o arquivo canônico das pastas de cada festa e o link entregue ao cliente.

Facebook/rede social não substitui essa entrega.

Publicação só ocorre quando existir consentimento registrado e pode ser executada separadamente por humano ou agente autorizado.

Ver ADR-0004.

## 12. MANIFEST.json

É o índice legível por máquina dos artefatos oficiais. Antes de criar algo novo, o agente deve consultá-lo para evitar duplicação.

Estados permitidos:

- `draft`
- `development`
- `review`
- `homologated`
- `production`
- `deprecated`
- `archived`

## 13. Como um agente inicia uma tarefa

```text
1. Ler os arquivos obrigatórios.
2. Identificar artefatos afetados.
3. Ler schemas/testes relacionados.
4. Declarar premissas relevantes.
5. Fazer a menor alteração suficiente.
6. Não inventar campos, estados ou integrações.
7. Atualizar testes/documentação.
8. Entregar diff, evidências e riscos.
```

## 14. Segurança

Nunca commitar senhas, tokens, chaves de API, `service_role`, credenciais Meta/WhatsApp, credenciais n8n, dumps de banco ou dados pessoais reais de clientes.

Use `.env.example` apenas com nomes de variáveis vazias.

> **Importante:** este repositório estava público no momento da última auditoria. Conteúdo estratégico/sensível e qualquer segredo continuam proibidos mesmo se a visibilidade mudar.

## 15. Estado atual

A arquitetura-base **v0.2** inclui:

- governança multiagente;
- estrutura canônica de artefatos;
- Event State Engine mínimo;
- Event State Engine de negócio;
- fatos com procedência;
- idempotência e controle de concorrência;
- auditoria de agentes e workflows;
- módulos persistentes de CRM/operação;
- integração registry com Meta/Chatwoot em standby;
- OneDrive canônico para entrega;
- migrations e schemas versionados;
- manifesto funcional dos workflows futuros;
- validação automática do repositório via GitHub Actions.

Ainda **não** significa:

- workflows n8n executáveis concluídos;
- pricing engine final;
- Meta/Chatwoot conectados;
- JEV runtime instalado no fluxo;
- compositor/guards em produção.

## 16. Documentos operacionais complementares

- `SECURITY.md` — segredos, banco e resposta a incidentes.
- `CONTRIBUTING.md` — branch, PR, commits e definição de pronto.
- `deploy/N8N-OPERATIONS.md` — relação entre agentes, DEV, PROD e VPS.
- `docs/security/ACCESS-MODEL.md` — níveis de acesso.
- `docs/architecture/COMPONENT-MAP.md` — responsabilidade de cada componente.
- `docs/architecture/MODULE-ALLOCATION.md` — alocações por capacidade.
- `docs/decisions/` — decisões arquiteturais vinculantes.

Um agente não deve receber acesso à VPS apenas para revisar workflow: para isso, deve usar o JSON versionado.

## 17. Próxima camada de construção

```text
regras homologadas
→ contratos/schemas
→ CM-WF-010 identidade/contexto
→ CM-WF-020 fatos
→ motor determinístico
→ JEV
→ Guards
→ compositor
→ módulos
→ Meta/Chatwoot quando credenciais chegarem
```

**Princípio operacional:** se uma informação precisa sobreviver à troca de conversa, agente ou modelo, ela deve ser registrada no lugar canônico correto.

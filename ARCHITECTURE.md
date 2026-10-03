# ARCHITECTURE.md — Arquitetura-base v0.2

## Visão

```text
                         GitHub
            definição versionada do sistema
                         │
             DEV / testes / homologação
                         │
                         ▼
                 n8n self-hosted
                   Hostinger VPS
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
   Supabase             JEV              Audit
 estado/negócio    decisão limitada   trilha/runtime
       │                 │                 │
       └────────────┬────┴─────────────────┘
                    ▼
             regras + Guards
                    │
                    ▼
             módulos operacionais
                    │
                    ▼
               LLM compositor
                    │
                    ▼
        Chatwoot ↔ Meta Cloud ↔ WhatsApp
                    │
                    ▼
                  cliente
```

## Fórmula arquitetural

**Oficial no transporte, determinístico no negócio, JEV nas decisões, LLM na linguagem, Supabase na memória, n8n na execução e Chatwoot na operação humana.**

Detalhe: `docs/architecture/CLICK-MAIS-OS-v1.md`.

## Separação de responsabilidades

### GitHub

Guarda o estado desejado e versionado: workflows, código, documentação, contratos, prompts, pesquisas, migrations e testes.

### Supabase

Guarda o estado vivo. Quatro áreas conceituais:

- `core`: sessão, eventos de runtime e estado transitório;
- `business`: contato, evento da empresa, fatos e módulos operacionais;
- `audit`: execuções de agentes/workflows;
- `integrations`: prontidão de integrações, sem segredos.

### n8n

Executa integrações e workflows. O n8n não é memória nem fonte canônica de regras.

Um workflow em produção deve possuir correspondente versionado no GitHub.

### JEV

É uma camada decisória restrita:

- recebe estado + mensagem + choices autorizadas;
- seleciona uma classe/opção;
- não calcula preço;
- não confirma pagamento;
- não cria alternativas fora do contrato recebido;
- pode solicitar humano/indefinido quando previsto.

### Código determinístico

Responsável por decisões inequívocas e reprodutíveis:

- datas e diferenças entre datas;
- preço e faixa homologada;
- combo;
- promoção homologada;
- completude;
- validação de estado;
- bloqueadores;
- Guards.

### LLM compositor

Recebe ação autorizada + fatos + template/contexto mínimo.

Responsável por redação e síntese. Não aumenta autoridade.

### Chatwoot

Cockpit humano:

- inbox;
- contato/conversa;
- atribuição;
- labels/atributos;
- segmentos;
- handoff.

O estado mestre continua no Supabase.

### Meta / WhatsApp

Transporte oficial. Meta e Chatwoot estão em standby até chegada das credenciais.

O primeiro teste usa número de teste; o número oficial entra somente após homologação.

### OneDrive

Repositório canônico de mídia pós-evento e link entregue ao cliente.

Publicação em rede social é fluxo separado e depende de consentimento.

## Runtime mínimo — sessão

```text
mensagem/evento
→ normalização
→ gravação idempotente
→ leitura da sessão
→ correlação com contato/evento
→ decisão/roteamento
→ ação
→ transição
→ auditoria
→ efeito externo
```

Tabelas-base:

- `core.sessions`
- `core.events`
- `core.state_transitions`
- `audit.agent_runs`
- `audit.workflow_runs`

Helpers:

- `core.get_or_create_session()`
- `core.record_event()`
- `core.transition_session()`

## Event State Engine de negócio

A sessão de WhatsApp e o evento comercial são objetos diferentes.

```text
business.contacts
      │
      └──< business.customer_events
                 │
                 ├── event_services
                 ├── event_facts
                 ├── event_stage_transitions
                 ├── module_states
                 ├── quotes
                 ├── contracts
                 ├── payments
                 ├── art_jobs
                 ├── logistics
                 ├── deliveries
                 ├── publication_consents
                 ├── followups
                 └── human_handoffs
```

### Fatos

`business.event_facts` preserva procedência e histórico.

Status:

- `known`
- `derived`
- `verified`
- `conflict`

Atualização não apaga silenciosamente o fato anterior: o novo registro aponta para o anterior e apenas um fica `is_current=true`.

### Ciclo de vida

Estados iniciais implementados:

- `lead_new`
- `lead_qualifying`
- `quote_presented`
- `awaiting_decision`
- `negotiation_human`
- `contracting`
- `contracted_pre_event`
- `event_day`
- `post_event`
- `completed`
- `lost`
- `cancelled`

`business.transition_customer_event()` usa controle de versão para evitar corrida e grava histórico explícito.

### Handoff

`business.human_handoffs` materializa o human lock.

Enquanto houver handoff ativo, o sistema pode registrar mensagens, mas a automação comercial não deve responder até retomada explícita.

## Módulos operacionais

Os domínios de contrato, pagamento, arte, logística, entrega e CRM agora possuem **estrutura persistente**, mas as regras internas continuam sendo promovidas progressivamente.

Isso evita confundir:

```text
estrutura pronta
≠
regra de negócio homologada
≠
workflow executável pronto
```

## Integrações

`integrations.registry` guarda apenas estado de prontidão.

Exemplo:

```text
Meta:
status = pending_credentials
runtime_enabled = false

Chatwoot:
status = pending_credentials
runtime_enabled = false
```

Credenciais reais permanecem no cofre/secret store.

## Manifesto de workflows

`n8n/WORKFLOW-MANIFEST.json` é o mapa funcional dos workflows planejados.

Ele **não** equivale a JSON n8n executável. Os arquivos `CM-WF-XXX_*.json` só serão registrados como workflows oficiais quando existirem e forem validados.

## Segurança

- schemas internos não são destinados ao cliente/anon;
- segredos nunca entram no GitHub;
- novas tabelas `business` e `integrations` têm RLS habilitado e grants públicos revogados;
- acesso backend é explícito;
- efeitos externos devem respeitar Guards e handoff;
- produção não deve ser editada informalmente.

## Evolução

Próximos passos: especificar e construir, em ordem suficiente para o fluxo, identidade/contexto, fatos, motor determinístico, JEV, Guards, compositor, módulos operacionais e adapters Meta/Chatwoot.

O mapa de alocações vinculante está em `docs/architecture/MODULE-ALLOCATION.md`.

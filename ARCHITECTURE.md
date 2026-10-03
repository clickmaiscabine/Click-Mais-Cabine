# ARCHITECTURE.md — Arquitetura-base v0.3

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
          ┌─────────┴─────────┐
          ▼                   ▼
       Trello             Meta Cloud
   cockpit humano              │
          │                    ▼
          └──────────────► WhatsApp
```

## Fórmula arquitetural

**Oficial no transporte, determinístico no negócio, JEV nas decisões, LLM na linguagem, Supabase na memória, n8n na execução e Trello na operação humana visual.**

Chatwoot passa a ser opcional/futuro e não integra o caminho crítico da V1.

## Separação de responsabilidades

### GitHub
Estado desejado e versionado.

### Supabase
Estado vivo:
- `core`: sessão e eventos de runtime;
- `business`: contato, evento, fatos e módulos;
- `audit`: execuções;
- `integrations`: prontidão sem segredos.

### n8n
Executa integrações e workflows. Não é fonte de verdade.

### JEV
Escolhe apenas entre classes/opções autorizadas.

### Código determinístico
Datas, preço homologado, combo, promoção autorizada, completude, validações e Guards.

### LLM compositor
Redação e síntese. Não aumenta autoridade.

### Trello
Cockpit humano e CRM visual da V1:
- Kanban de oportunidades;
- filas comerciais;
- follow-up;
- dúvidas/objeções;
- handoff humano;
- campanhas;
- filtros por data;
- visão de datas ociosas;
- continuidade manual quando agentes/automação falham.

**Trello é projeção, não fonte de verdade.**

Relação:
```text
Supabase → n8n → Trello
Trello → webhook/n8n → Guard → Supabase → Audit
```

Unidade recomendada:
```text
1 cartão Trello = 1 business.customer_event
```

### Meta / WhatsApp
Transporte oficial. O número de teste entra primeiro; o número oficial somente após homologação.

### Chatwoot
`optional_future`. Pode ser reavaliado se surgir solução sem novo custo relevante ou necessidade real de inbox compartilhado.

### OneDrive
Mídia pós-evento e link entregue ao cliente.

## Handoff

`business.human_handoffs` materializa o human lock.

Na V1, uma fila/coluna do Trello pode representar atendimento humano:
```text
Trello → n8n → human_handoff.active=true
```

Enquanto ativo, o bot registra mensagens, mas não responde comercialmente.

## Event State Engine

Sessão e evento comercial são objetos diferentes.

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

## Remarketing por data ociosa

Caso canônico da V1:

```text
data próxima sem venda
→ consultar oportunidades abertas no Supabase
→ projetar subconjunto no Trello
→ humano revisa
→ aprova campanha
→ business.campaigns
→ n8n executa contato autorizado
```

Promoção pontual nunca altera preço canônico global.

## Integrações

Meta:
```text
status = pending_credentials
runtime_enabled = false
```

Chatwoot:
```text
status = optional_future
runtime_enabled = false
```

Trello:
```text
status = active
papel = human cockpit / CRM projection
```

## Evolução

Antes de construir o Trello CRM V2, estudar o quadro legado **Controle de Orçamentos** e mapear colunas, labels, webhooks antigos, filtros úteis e etapas obsoletas.

Documentos vinculantes:
- `docs/decisions/ADR-0005_trello-cockpit-crm-v1.md`
- `docs/architecture/TRELLO-CRM-V1.md`
- `docs/architecture/MODULE-ALLOCATION.md`

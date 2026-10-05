# ARCHITECTURE.md — Arquitetura-base v0.4

## Visão

```text
       ANÚNCIOS / LANDING PAGES
                 │
                 ▼
          WhatsApp / Meta
                 │
                 ▼
                n8n
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
   Supabase     JEV      Audit
 estado/negócio choices   trilha
       │         │         │
       └─────┬───┴─────────┘
             ▼
        regras + Guards
             │
             ▼
      módulos operacionais
             │
        ┌────┴────┐
        ▼         ▼
     Trello    WhatsApp
 cockpit humano  canal
```

O GitHub define o estado desejado e versionado acima de todo o runtime.

## Fórmula arquitetural

**Oficial no transporte, determinístico no negócio, JEV nas decisões, LLM na linguagem, Supabase na memória, n8n na execução e Trello na operação humana visual.**

**Chatwoot está fora do projeto V1.**

## Aquisição

Fluxo principal:

```text
anúncio
→ landing page
→ mensagem WhatsApp predefinida/tagueada
→ Meta Cloud API
→ n8n
→ Supabase
```

Produtos de entrada inicialmente homologados:
- Cabine de Fotos;
- Plataforma 360;
- Totem de Fotos.

Origem/produto devem ser registrados quando disponíveis.

## Separação de responsabilidades

### GitHub
Estado desejado e versionado.

### Supabase
Estado vivo:
- `core`: sessão e eventos de runtime;
- `business`: contato, evento, fatos e módulos;
- `audit`: execuções;
- `integrations`: prontidão sem segredos.

Supabase também preserva histórico/coortes; a posição atual no Trello não substitui esse histórico.

### n8n
Executa integrações e workflows. Não é fonte de verdade.

### JEV
Escolhe apenas entre classes/opções autorizadas.

### Código determinístico
Datas, preço homologado, combo, promoção autorizada, completude, validações e Guards.

### LLM compositor
Redação e síntese. Não aumenta autoridade.

### Trello
Cockpit humano e CRM visual da V1.

Regra:

```text
Supabase → n8n → Trello
Trello → webhook/n8n → Guard → Supabase → Audit
```

O Supabase pode possuir `business.customer_event` antes da criação de card.

**Condição para card no Trello Comercial: orçamento efetivamente enviado.**

Pipeline:

```text
ORÇAMENTO
→ RESPOSTA
→ FAC / DÚVIDAS
→ NEGOCIAÇÃO BOT / HUMANO
→ FECHAMENTO
→ GANHO ou PERDIDO
```

Um cartão comercial corresponde a um `business.customer_event` qualificado por orçamento enviado.

### Meta / WhatsApp
Transporte oficial. O número de teste entra primeiro; o número oficial somente após homologação.

### Chatwoot
Fora do escopo V1. Reentrada futura exige decisão explícita.

### OneDrive
Mídia pós-evento e link entregue ao cliente.

## Handoff

`business.human_handoffs` materializa o human lock.

Uma fila/estado de negociação humana no Trello pode solicitar:

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

Contato/prospect torna-se lead qualificado após orçamento enviado.

## Remarketing por data/coorte

Caso canônico:

```text
definir período/data alvo
→ consultar no Supabase leads que receberam orçamento
→ aplicar filtros de venda/elegibilidade
→ projetar subconjunto operacional no Trello
→ humano revisa/aprova
→ business.campaigns
→ n8n executa contato autorizado
```

A lista atual do Trello não é o critério único de pertencimento à coorte.

Promoção pontual nunca altera preço canônico global.

## Integrações

Meta:
```text
status = pending_credentials
runtime_enabled = false
```

Chatwoot:
```text
status = out_of_scope_v1
runtime_enabled = false
```

Trello:
```text
status = active
papel = human cockpit / CRM projection
```

## Documentos vinculantes

- `docs/00_governanca/CLICK_MAIS_OS_BASELINE_FUNCIONAL_v1.1.md`
- `docs/00_governanca/REGISTRO_DE_DECISOES.md`
- `docs/decisions/ADR-0005_trello-cockpit-crm-v1.md`
- `docs/decisions/ADR-0006_origem-lead-pipeline-comercial-v1.md`
- `docs/architecture/TRELLO-CRM-V1.md`
- `docs/architecture/MODULE-ALLOCATION.md`

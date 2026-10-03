# Click Mais OS — Blueprint funcional v1

Status: homologated  
Data: 2026-10-03

## 1. Princípio

A Click Mais está construindo um sistema operacional de atendimento e operação comercial.

```text
OFICIAL NO TRANSPORTE
Meta Cloud API

DETERMINÍSTICO NO NEGÓCIO
código + regras homologadas

DECISÃO SEMÂNTICA
JEV com choices autorizadas

LINGUAGEM
LLM compositor

MEMÓRIA OPERACIONAL
Supabase / Event State Engine

EXECUÇÃO
n8n self-hosted

OPERAÇÃO HUMANA / CRM VISUAL
Trello

ENTREGA DE MÍDIA
OneDrive
```

Chatwoot fica fora do caminho crítico da V1.

## 2. Relacionamento e operação humana

```text
Cliente
  ↕
WhatsApp
  ↕
Meta Cloud API
  ↕
n8n
  ↕
Supabase
  ↕
Trello (projeção humana)
```

Trello não é inbox de conversa nem banco mestre. É cockpit Kanban/CRM visual.

## 3. Cérebro operacional

```text
                 n8n / WF-00
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    Supabase      JEV        Audit
    estado       choices     trilha
        │          │          │
        └──────┬───┴──────────┘
               ▼
             Guards
               ▼
       módulo autorizado
               ▼
       LLM se houver texto
```

- **Supabase sabe**.
- **n8n faz**.
- **JEV decide quando necessário**.
- **Código calcula**.
- **LLM escreve**.
- **Guard impede**.
- **Audit explica**.
- **Trello mostra e recebe comandos humanos**.

## 4. Estado: sessão não é evento comercial

- `core.sessions`: conversa/canal;
- `business.contacts`: pessoa/entidade;
- `business.customer_events`: festa/oportunidade;
- `business.event_stage_transitions`: histórico comercial.

Uma pessoa pode ter vários eventos.

## 5. Fatos e completude

`business.event_facts` preserva:
- known;
- derived;
- verified;
- conflict;
- procedência;
- histórico.

`business.module_states` registra prontidão e bloqueadores.

## 6. Domínios persistidos

| Domínio | Tabela principal |
|---|---|
| Contato | `business.contacts` |
| Evento | `business.customer_events` |
| Serviços | `business.event_services` |
| Fatos | `business.event_facts` |
| Completude | `business.module_states` |
| Orçamento | `business.quotes` |
| Contrato | `business.contracts` |
| Pagamento | `business.payments` |
| Arte | `business.art_jobs` |
| Logística | `business.logistics` |
| Entrega | `business.deliveries` |
| Campanhas | `business.campaigns` |
| Follow-up | `business.followups` |
| Handoff | `business.human_handoffs` |

## 7. Trello CRM V1

Unidade recomendada:

```text
1 cartão = 1 business.customer_event
```

Usos:
- Kanban comercial;
- filtros por data;
- reforço/follow-up;
- dúvidas/objeções;
- handoff;
- campanhas;
- datas ociosas;
- substituição manual da automação quando necessário.

Sincronização:

```text
Supabase → n8n → Trello

Trello → n8n → Guard → Supabase → Audit
```

O quadro histórico **Controle de Orçamentos** deve ser estudado antes do CRM V2.

## 8. Remarketing por data ociosa

```text
sábado próximo sem venda
→ consultar oportunidades abertas para a data
→ projetar no Trello
→ humano seleciona/aprova
→ criar campaign
→ n8n executa contato
```

A promoção é local à campanha e não altera a tabela global.

## 9. Handoff

`human_handoffs.active=true` pausa o bot comercial.

Uma coluna/fila Trello pode solicitar ativação/liberação do lock, sempre via n8n + Guard.

## 10. Integrações pendentes

Meta pode ser modelada sem credencial e ativada depois.

Chatwoot é opcional/futuro e não bloqueia a V1.

## 11. Estado atual

Já implementado:
- Event State Engine;
- business state;
- CRM básico no Supabase;
- Trello disponível como integração;
- OneDrive canônico;
- mapa funcional dos workflows.

Ainda não implementado:
- workflows n8n executáveis;
- pricing engine final;
- adapter Meta ativo;
- sincronização Trello CRM V1;
- JEV runtime;
- compositor e Guards executáveis.

Ver `TRELLO-CRM-V1.md` e ADR-0005.

# Click Mais OS — Blueprint funcional v1

Status: homologated  
Data original: 2026-10-03  
Atualizado: 2026-10-05  
Decisões vinculantes: ADR-0005 + ADR-0006 + Baseline Funcional v1.1

## 1. Princípio

A Click Mais está construindo um sistema operacional de aquisição, atendimento e operação comercial.

```text
AQUISIÇÃO
Anúncios + Landing Pages

TRANSPORTE
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

Chatwoot fica fora do projeto V1.

## 2. Entrada e relacionamento

```text
Anúncio
  ↓
Landing Page
  ↓
WhatsApp
  ↕
Meta Cloud API
  ↕
n8n
  ↕
Supabase
```

Landing pages iniciais:
- Cabine de Fotos;
- Plataforma 360;
- Totem de Fotos.

A mensagem predefinida/tagueada do botão “Quero orçamento” deve ser aproveitada para origem e produto quando disponível.

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
- **Trello mostra e recebe comandos humanos autorizados**.

## 4. Estado: contato, evento e lead

- `core.sessions`: conversa/canal;
- `business.contacts`: pessoa/entidade;
- `business.customer_events`: festa/oportunidade;
- `business.event_stage_transitions`: histórico comercial.

Uma pessoa pode ter vários eventos.

Contato/prospect torna-se lead qualificado quando o orçamento é efetivamente enviado.

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

## 7. Trello Comercial V1

O Supabase pode ter contato/evento antes do Trello.

Card comercial nasce somente após orçamento enviado.

Pipeline:

```text
ORÇAMENTO
→ RESPOSTA
→ FAC / DÚVIDAS
→ NEGOCIAÇÃO BOT / HUMANO
→ FECHAMENTO
→ GANHO ou PERDIDO
```

Regra:

```text
Supabase → n8n → Trello
Trello → n8n → Guard → Supabase → Audit
```

Trello mostra estágio atual. Supabase preserva histórico e coortes.

## 8. Remarketing

```text
definir período/data alvo
→ consultar no Supabase quem recebeu orçamento
→ aplicar elegibilidade
→ projetar subconjunto operacional no Trello
→ humano seleciona/aprova
→ criar campaign
→ n8n executa contato autorizado
```

A promoção é local à campanha e não altera a tabela global.

## 9. Handoff

`human_handoffs.active=true` pausa o bot comercial.

A fila/estado de negociação humana no Trello pode solicitar ativação/liberação do lock, sempre via n8n + Guard.

## 10. Integrações pendentes

Meta pode ser modelada sem credencial e ativada depois.

Chatwoot está fora do projeto V1.

## 11. Estado atual

Já implementado:
- Event State Engine;
- business state;
- CRM básico no Supabase;
- Trello disponível como integração;
- OneDrive canônico;
- mapa funcional dos workflows;
- governança documental v0.4.

Ainda não implementado:
- Projeto Executivo;
- workflows n8n executáveis;
- pricing engine final;
- adapter Meta ativo;
- sincronização Trello CRM V1;
- JEV runtime;
- compositor e Guards executáveis.

Ver:
- `../00_governanca/CLICK_MAIS_OS_BASELINE_FUNCIONAL_v1.1.md`
- `TRELLO-CRM-V1.md`
- ADR-0005
- ADR-0006

# Trello CRM V1 — Blueprint de cockpit humano

Status: homologated  
Data: 2026-10-03  
Decisão vinculante: ADR-0005

## Objetivo

Usar Trello como camada visual e operacional humana da V1 da Click Mais, sem transformar o quadro em banco mestre.

## Regra principal

```text
SUPABASE = verdade
TRELLO   = projeção humana
n8n      = sincronização e execução
```

## Blueprint

```text
                          CLIENTE
                             │
                             ▼
                        WHATSAPP
                             │
                             ▼
                    META CLOUD API
                             │
                             ▼
                            n8n
                      ORQUESTRADOR
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
           SUPABASE                      TRELLO
      Event State Engine             CRM / cockpit
        fonte canônica                humano legível
               │                           │
               │                           │ ações humanas
               │                           ▼
               │                          n8n
               │                           │
               └──────────────┬────────────┘
                              ▼
                       Guard + Audit
                              │
                              ▼
                     estado atualizado
```

## Relação entre objetos

```text
business.contacts
      │
      └──< business.customer_events
                    │
                    └── 1 cartão Trello por evento
```

Um contato pode ter vários cartões em datas/anos diferentes.

## Projeção recomendada do cartão

```text
TÍTULO
15-11-2026 | Maria | Mogi

DESCRIÇÃO
EVENT_ID: EV-...
Cliente: Maria
Evento: Casamento
Data: 15/11/2026
Cidade: Mogi das Cruzes
Serviços: Cabine + Plataforma 360
Orçamento: ...
Status: AGUARDANDO DECISÃO
Último contato: ...
Próxima ação: ...
Observações: ...
```

O EVENT_ID/customer_event_id é a chave de reconciliação.

## Funções do Trello na V1

- visão Kanban de oportunidades;
- filas comerciais;
- visualização de follow-up;
- dúvidas e objeções;
- atendimento humano;
- preparação de campanhas;
- filtro de datas;
- identificação de datas/equipamentos ociosos;
- intervenção manual quando automação falhar;
- visão legível por qualquer operador autorizado.

## Exemplo: sábado ocioso

```text
segunda-feira
     ↓
sábado sem venda
     ↓
Supabase consulta oportunidades para sábado
     ↓
remove fechados/perdidos/cancelados
     ↓
n8n projeta conjunto no Trello
     ↓
humano revisa
     ↓
aprova promoção
     ↓
business.campaigns
     ↓
n8n executa contato autorizado
```

A promoção pontual não altera a tabela canônica de preços.

## Human lock

```text
cartão entra em fila humana
        ↓
human_handoff = active
        ↓
bot para de responder comercialmente
        ↓
humano atua
        ↓
retomada explícita
        ↓
human_handoff = released
```

## Direção da sincronização

### Supabase → Trello

Automática sempre que estado relevante mudar.

### Trello → Supabase

Tratada como **comando humano solicitado**, nunca como escrita direta.

```text
Trello webhook
→ n8n
→ validação
→ Supabase
→ audit
→ atualização de projeção
```

## Quadro legado

O quadro histórico **Controle de Orçamentos** é considerado material de referência operacional e deve ser estudado antes de qualquer redesign.

Elementos visíveis já reconhecidos:

- CONTATO;
- ORÇAMENTO / CONFIRMAÇÃO;
- ORÇAMENTO / REFORÇO;
- ORÇAMENTO / REMARKETING 1;
- ORÇAMENTO / PRÓX. 30 DIAS;
- DÚVIDAS / OBJEÇÕES;
- CHECK DÚVIDAS;
- DÚVIDAS / REMARKETING 2;
- labels de preço/faixa/grupo/período/estado.

Não há autorização nesta decisão para limpar, mover ou editar o quadro legado.

## Futuro

Se o Trello não cobrir inbox compartilhado ou outras necessidades futuras, Chatwoot Community/Cloud pode ser reavaliado. Isso é extensão, não fundamento da V1.

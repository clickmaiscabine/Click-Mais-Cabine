# Trello CRM V1 — Blueprint de cockpit humano

Status: homologated  
Data original: 2026-10-03  
Atualizado: 2026-10-05  
Decisões vinculantes: ADR-0005 + ADR-0006

## Objetivo

Usar Trello como camada visual e operacional humana da V1 da Click Mais, sem transformar o quadro em banco mestre.

## Regra principal

```text
SUPABASE = verdade
TRELLO   = projeção humana
n8n      = sincronização e execução
```

## Regra de entrada no Trello Comercial

O Supabase pode registrar contato/prospect e evento antes do Trello.

O card comercial só é criado quando existe orçamento efetivamente enviado:

```text
contato/prospect
→ dados suficientes
→ ORCAMENTO_ENVIADO
→ lead qualificado
→ criar/projetar card no Trello Comercial
```

Isto substitui a orientação anterior de criar card para todo novo `business.customer_event`.

## Pipeline homologado

```text
ORÇAMENTO
→ RESPOSTA
→ FAC / DÚVIDAS
→ NEGOCIAÇÃO BOT / HUMANO
→ FECHAMENTO
→ GANHO
  ou
→ PERDIDO
```

### ORÇAMENTO
Lead qualificado que recebeu orçamento.

### RESPOSTA
Houve resposta após o orçamento, sem necessariamente haver dúvida ou negociação.

### FAC / DÚVIDAS
Informações adicionais, explicação do produto, diferenciais, FAQ, objeções e esclarecimentos.

### NEGOCIAÇÃO BOT / HUMANO
Negociação dentro das regras autorizadas ou handoff quando houver barganha, desconto extra, proposta de preço ou exceção.

### FECHAMENTO
Intenção concreta de contratar e entrada no fluxo de fechamento.

### GANHO
Resultado comercial positivo. O critério técnico exato de transição para operação será formalizado no Projeto Executivo.

### PERDIDO
Oportunidade não convertida. O registro permanece na base histórica.

## Blueprint

```text
                        WHATSAPP
                           │
                           ▼
                    META CLOUD API
                           │
                           ▼
                          n8n
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
             SUPABASE              TRELLO
          fonte da verdade      cockpit humano
                 │                   │
                 └─────────┬─────────┘
                           ▼
                     Guard + Audit
```

## Relação entre objetos

```text
business.contacts
      │
      └──< business.customer_events
                    │
                    └── card Trello somente se quote_sent
```

Um contato pode ter vários eventos/cartões em datas ou anos diferentes.

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
Pipeline: FAC / DÚVIDAS
Último contato: ...
Próxima ação: ...
Observações: ...
```

O EVENT_ID/customer_event_id é a chave de reconciliação.

## Estado atual x histórico

A lista atual do Trello representa estágio atual e não apaga fatos anteriores.

Exemplo:

```text
quote_sent = true
qualified_lead = true
pipeline_stage = FAC_DUVIDAS
```

Campanhas e coortes devem consultar o Supabase.

Leads PERDIDOS permanecem historicamente registrados. A elegibilidade futura depende de regra explícita.

## Human lock

```text
negociação exige humano
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
Criar card apenas no marco de orçamento enviado e depois manter a projeção sincronizada.

### Trello → Supabase
Ação humana é **comando solicitado**, nunca escrita direta.

```text
Trello webhook
→ n8n
→ validação
→ Supabase
→ audit
→ atualização de projeção
```

## Remarketing e datas ociosas

```text
definir período/data alvo
→ Supabase consulta leads com orçamento enviado
→ aplica critérios de venda/elegibilidade
→ n8n projeta conjunto operacional no Trello
→ humano revisa
→ aprova campanha
→ business.campaigns
→ n8n executa contato autorizado
```

A posição atual no Trello não é o único critério de pertencimento à coorte.

## Quadro legado

O quadro histórico **Controle de Orçamentos** continua sendo material de referência e não deve ser alterado sem planejamento explícito.

## Trello Logística

É separado do Trello Comercial.

O Comercial acompanha oportunidade até resultado de venda.

O Logística acompanha o evento operacional após a transição definida para GANHO/entrada operacional.

## Chatwoot

Fora do projeto V1.

Qualquer reentrada futura exige nova decisão explícita e não pode substituir Supabase como fonte canônica.

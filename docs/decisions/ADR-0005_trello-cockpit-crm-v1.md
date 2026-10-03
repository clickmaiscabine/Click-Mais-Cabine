# ADR-0005 — Trello como cockpit humano e CRM visual da V1

- Status: homologated
- Data: 2026-10-03
- Supersede parcialmente: ADR-0003, apenas nas decisões que colocavam Chatwoot como componente obrigatório da operação humana da V1.

## Contexto

A arquitetura original previa Chatwoot Cloud como inbox, CRM visual e handoff humano. A Click Mais decidiu que a V1 não pode depender de uma nova assinatura mensal nem de uma segunda VPS apenas para hospedar Chatwoot Community.

A empresa já possui um quadro Trello de **Controle de Orçamentos** que foi usado na prática como CRM comercial, alimentado por webhook. O quadro se mostrou útil para:

- visualizar oportunidades em formato Kanban;
- filtrar eventos por data;
- localizar rapidamente datas ociosas;
- selecionar leads para promoções pontuais;
- acompanhar orçamento, reforço, remarketing, dúvidas e objeções;
- continuar a operação manualmente quando a automação não está disponível.

Essa experiência real tem prioridade sobre introduzir um SaaS pago apenas para obter uma interface humana.

## Decisão

Na V1:

1. **Supabase continua sendo a fonte canônica do estado.**
2. **Trello passa a ser o cockpit humano e CRM visual da operação comercial.**
3. **n8n mantém Supabase e Trello sincronizados.**
4. **Trello não é fonte de verdade:** alterações feitas nele são tratadas como solicitações humanas que o n8n valida antes de persistir no Supabase.
5. **Chatwoot sai do caminho crítico da V1** e fica como integração opcional/futura.
6. O atendimento conversacional continua no WhatsApp oficial; Trello não substitui o canal de conversa.
7. O desenho do quadro antigo deve ser estudado antes de criar um quadro novo ou alterar o existente.

## Modelo de projeção

```text
                    WhatsApp / Meta
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
                          n8n
                           │
                     ação autorizada
```

## Unidade do cartão

A unidade recomendada é:

```text
1 cartão Trello = 1 business.customer_event
```

Não:

```text
1 cartão = 1 telefone
```

Motivo: um mesmo contato pode ter várias festas/oportunidades em anos diferentes.

O cartão deve carregar uma referência estável ao `customer_event_id` do Supabase.

## Conteúdo humano legível do cartão

Título recomendado:

```text
DD-MM-AAAA | Nome | Cidade
```

Descrição mínima recomendada:

- EVENT_ID;
- cliente;
- telefone/identificador de contato quando apropriado;
- tipo de evento;
- data;
- cidade/localidade;
- serviços;
- orçamento vigente;
- lifecycle stage;
- última interação;
- próxima ação;
- observações operacionais/comerciais aprovadas.

Labels podem representar elementos de leitura rápida, mas não substituem campos canônicos do Supabase.

## Colunas e lógica do quadro antigo

O quadro histórico observado possui, entre outras, colunas como:

- CONTATO;
- ORÇAMENTO / CONFIRMAÇÃO;
- ORÇAMENTO / REFORÇO;
- ORÇAMENTO / REMARKETING 1;
- ORÇAMENTO / PRÓX. 30 DIAS;
- DÚVIDAS / OBJEÇÕES;
- CHECK DÚVIDAS;
- DÚVIDAS / REMARKETING 2.

Essas colunas são **evidência de uma lógica comercial já validada na prática**. Elas não devem ser copiadas cegamente nem descartadas.

Antes da implementação do CRM Trello V2, deve ser feito um estudo do quadro existente para identificar:

- significado real de cada coluna;
- significado das labels;
- automações/webhooks antigos;
- filtros usados com frequência;
- campos que realmente ajudavam a operação;
- etapas obsoletas;
- oportunidades de automatização sem perder legibilidade humana.

## Sincronização Supabase → Trello

Exemplos:

```text
novo customer_event
→ criar cartão

quote_presented
→ mover/projetar em orçamento

follow-up pendente
→ atualizar coluna/label/data

contracting
→ refletir fechamento

lost/cancelled/completed
→ mover para estado correspondente ou arquivar conforme regra
```

A projeção deve ser idempotente e usar `customer_event_id` como correlação.

## Sincronização Trello → Supabase

Uma ação humana no Trello não altera diretamente a verdade operacional.

Fluxo:

```text
humano move/edita cartão
        ↓
webhook Trello
        ↓
n8n traduz ação
        ↓
Guard valida
        ↓
Supabase persiste
        ↓
Audit registra ator = human / source = trello
```

Se a ação for inválida para o estado atual, o Supabase não deve ser alterado silenciosamente.

## Human lock

Uma fila/coluna específica pode representar atendimento humano.

Exemplo:

```text
cartão → ATENDIMENTO HUMANO
        ↓
n8n
        ↓
business.human_handoffs.active = true
        ↓
bot comercial pausa
```

A retomada deve ser explícita e registrada.

## Remarketing e datas ociosas

O Trello deve preservar a capacidade operacional que motivou esta decisão:

> localizar rapidamente oportunidades ainda abertas para uma data próxima e permitir uma promoção pontual quando equipamento/equipe ficariam ociosos.

A seleção deve nascer de consulta canônica ao Supabase, por exemplo:

```text
event_date = sábado alvo
AND lifecycle_stage não fechado/perdido/cancelado
AND oportunidade ainda comercialmente válida
```

O resultado pode ser projetado no Trello por:

- label temporária;
- lista/fila operacional;
- checklist/campanha;
- outra visualização definida após estudo do quadro legado.

A campanha só é executada após aprovação humana e registro em `business.campaigns`.

## Continuidade operacional

O Trello é adotado também porque permanece compreensível por humano quando:

- um agente está indisponível;
- créditos de uma LLM acabam;
- uma automação falha;
- o operador precisa assumir manualmente.

O objetivo não é eliminar o humano do quadro, mas reduzir manutenção manual desnecessária sem perder capacidade de substituição.

## Chatwoot

Chatwoot passa a ser:

```text
optional_future
```

Pode ser reavaliado se futuramente houver:

- plano sem custo adequado;
- infraestrutura disponível sem novo custo relevante;
- necessidade real de inbox compartilhado que Trello + WhatsApp não cubram.

Sua eventual adoção não deve substituir Supabase nem exigir reescrita do Event State Engine.

## Critério para implementação futura

Antes de modificar o quadro existente:

1. ler o quadro e suas listas/labels/cartões;
2. documentar semântica legada;
3. mapear cada etapa útil para estados/campos do Supabase;
4. definir o mínimo de automação bidirecional;
5. criar testes simples de sincronização;
6. somente então alterar ou criar o Trello CRM V2.

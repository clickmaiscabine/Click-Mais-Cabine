# ADR-0006 — Origem, qualificação do lead e pipeline comercial V1

- Status: homologated
- Data: 2026-10-05
- Supersede parcialmente: ADR-0005 e TRELLO-CRM-V1 apenas nos pontos descritos abaixo.

## Contexto

A definição funcional foi refinada a partir do processo comercial real da Click Mais.

A maior parte dos novos contatos tende a chegar por anúncios e por três landing pages principais:
- Cabine de Fotos;
- Plataforma 360;
- Totem de Fotos.

O botão “Quero orçamento” direciona ao WhatsApp com mensagem predefinida/tagueada, que pode ser usada como sinal de origem e produto de interesse.

Também foi esclarecido que o Trello Comercial não deve receber todo contato que apenas escreveu no WhatsApp. O pipeline deve representar leads que já receberam orçamento e, portanto, entraram de fato na base comercial qualificada.

## Decisão

### 1. Aquisição

O fluxo principal de aquisição da V1 é:

```text
anúncio
→ landing page
→ botão Quero orçamento
→ WhatsApp
→ Meta Cloud API
→ n8n
→ Supabase
```

A mensagem predefinida deve ser aproveitada para registrar origem/produto quando possível.

### 2. Chatwoot

Chatwoot fica fora do projeto V1.

A operação humana visual é composta por:
- WhatsApp para conversa;
- Trello para cockpit/pipeline;
- Supabase para estado canônico;
- n8n para sincronização e execução.

Uma eventual reentrada de Chatwoot exige nova decisão explícita.

### 3. Qualificação do lead

```text
contato/prospect
→ orçamento efetivamente enviado
→ lead qualificado
```

O envio de orçamento é o marco de qualificação comercial.

### 4. Nascimento do card Trello Comercial

O card nasce após `ORCAMENTO_ENVIADO`.

Isto substitui a orientação anterior de criar card automaticamente para todo novo `business.customer_event`.

O Supabase pode registrar o contato/evento antes disso; o Trello Comercial só começa quando existe lead qualificado.

### 5. Pipeline

Ordem homologada:

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

### 6. Orçamento antes de venda

No modelo de negócio, o orçamento precede o processo comercial de venda.

“Venda” compreende:
- apresentação e explicação do produto;
- diferenciais;
- dúvidas;
- quebra de objeções;
- negociação autorizada;
- condução ao fechamento.

### 7. Histórico e segmentação

A lista atual do Trello é somente o estágio atual.

Ela não apaga:
- orçamento enviado;
- data do evento;
- serviço;
- origem;
- respostas;
- estágios anteriores;
- resultado comercial.

Coortes e campanhas devem consultar o Supabase.

Leads PERDIDOS permanecem historicamente registrados. Sua elegibilidade para campanhas futuras depende de regra explícita.

### 8. Comercial e logística

Trello Comercial e Trello Logística têm responsabilidades diferentes.

O quadro Comercial acompanha a oportunidade até o resultado de venda.

O quadro Logística acompanha o evento operacional após a transição definida para GANHO/entrada operacional.

## Consequências

- schemas e workflows deverão distinguir contato/prospect de lead qualificado;
- Trello projection deverá condicionar criação do card a orçamento enviado;
- o motor de campanhas deverá consultar Supabase;
- o Projeto Executivo deverá formalizar os critérios exatos de GANHO e da transição para Logística;
- documentos anteriores que contradigam estes pontos deverão ser atualizados ou marcados como superseded parcialmente.

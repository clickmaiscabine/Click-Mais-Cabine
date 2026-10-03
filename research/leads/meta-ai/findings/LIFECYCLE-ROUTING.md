# Roteamento por ciclo de vida — candidato

Status: review

A auditoria da Meta AI mostra que intenção sozinha não basta. A mesma palavra pode exigir resposta diferente conforme a etapa do cliente.

## Estados candidatos

### NON_COMMERCIAL

Mensagem sem relação com contratação/execução do serviço.

Ação:
- não qualificar;
- não fazer follow-up;
- não alimentar aprendizado comercial.

### LEAD_NEW

Primeiro contato ou pedido geral.

Ações possíveis:
- identificar serviço;
- data;
- localidade;
- tipo de evento.

### LEAD_QUALIFYING

Já existe parte dos dados do orçamento.

Ação:
- perguntar somente o dado faltante;
- não reiniciar roteiro.

### QUOTE_PRESENTED

Preço já foi apresentado.

Ação:
- responder dúvidas;
- tratar objeção;
- follow-up conforme política;
- evitar repetir qualificação.

### NEGOTIATION_HUMAN

Cliente propôs preço, desconto fora da regra ou exceção.

Ação:
- handoff.

### CONTRACTING

Cliente decidiu avançar.

Ação:
- microsite/contrato/sinal;
- coletar apenas dados necessários no canal apropriado.

### CONTRACTED_PRE_EVENT

Contrato/reserva já existe.

Intenções típicas:
- arte;
- convite/referência;
- endereço;
- horário;
- montagem;
- contato do salão;
- confirmação.

Ação:
- não tratar como lead novo.

### EVENT_DAY

Evento em execução ou próximo da execução.

Intenções típicas:
- equipe chegando;
- acesso/portaria;
- atraso;
- logística em tempo real.

Ação:
- atendimento humano/operacional quando depender de posição/execução real.

### POST_EVENT

Evento já aconteceu.

Intenções típicas:
- link;
- download;
- fotos;
- edição;
- entrega;
- reclamação;
- avaliação.

Ação:
- fluxo pós-venda próprio.

### HUMAN_ACTIVE

Atendente humano assumiu.

Ação:
- pausar mensagens comerciais automáticas;
- retomar somente com sinal explícito.

## Implicação

O roteador de estado precisa combinar:

```
intenção
+ ciclo de vida
+ dados já conhecidos
+ autoridade da automação
```

e não apenas classificar a última mensagem.

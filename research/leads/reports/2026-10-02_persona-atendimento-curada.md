# Relatório curado — persona e atendimento WhatsApp

Status: review  
Data: 2026-10-02  
Escopo: atendimento histórico da Click Mais Cabine

## 1. Síntese

O cliente típico escreve de forma curta, móvel e orientada a resolver uma necessidade imediata. A mediana da mensagem recebida foi de **18 caracteres**; no atendimento, **62 caracteres**.

O assunto dominante no topo do funil é preço/orçamento. Também aparecem com frequência dúvidas sobre escopo do serviço, pagamento, disponibilidade, local do evento, logística, contrato, entrega de fotos e pós-venda.

## 2. Linguagem do cliente

Padrões observados:
- mensagens curtas e diretas;
- alternância entre cordialidade e objetividade;
- uso moderado de emoji;
- vocabulário concreto: serviço, evento, data, cidade/bairro, horário, valor, pagamento e contrato;
- pouca tolerância a respostas longas antes de a necessidade principal ser atendida.

## 3. Linguagem do atendimento histórico

Pontos positivos:
- proximidade;
- informalidade adequada ao WhatsApp;
- personalização;
- comunicação operacional.

Pontos de fricção:
- respostas maiores do que o necessário em estágios iniciais;
- respostas muito curtas que não deixam próximo passo;
- qualificação que às vezes repete perguntas já respondidas;
- tratamento de desconto e condições de forma pouco padronizada.

## 4. Temas mais relevantes

No recorte analisado:
- preço/orçamento é o principal tema comercial;
- escopo do produto aparece em milhares de mensagens;
- pagamento e parcelamento são recorrentes;
- disponibilidade/data/horário é essencial;
- contrato funciona como elemento de confiança;
- logística e entrega das fotos geram ansiedade;
- objeção de preço/desconto aparece em **647 conversas**;
- indecisão/decisor terceiro aparece em **1.315 conversas**;
- confiança/contrato aparece em **679 conversas**;
- reclamação/pós-venda aparece em **544 conversas**.

## 5. Funil observado

Entre 5.234 conversas de atendimento:
- **3.871** tiveram registro de preço enviado;
- **171** tiveram pedido de preço sem resposta registrada;
- **979** chegaram ao envio de dados para contrato;
- **948** apresentaram sinal explícito de fechamento;
- **3.386** terminaram com duas ou mais mensagens do atendimento sem nova resposta;
- **2.710** tiveram reativação após 30 dias ou mais.

A proporção de conversas relacionadas a preço foi registrada como aproximadamente **77%**; existe divergência entre artefatos antigos sobre o número absoluto e ela deve ser resolvida antes de transformar esse dado em KPI canônico.

## 6. Hipóteses de melhoria

Ainda não homologadas:
- responder primeiro à necessidade principal;
- usar respostas iniciais curtas;
- pedir apenas o dado que realmente falta;
- aceitar respostas parciais e continuar o fluxo;
- detectar objeção durante qualquer etapa;
- não usar confirmação vazia como encerramento de etapa ativa;
- registrar próximo passo e responsável;
- usar follow-up com cadência definida e possibilidade de encerramento;
- encaminhar para humano quando a negociação sair das regras;
- consultar fontes reais para preço e disponibilidade, sem inferência.

## 7. Impacto esperado no projeto

Este relatório deve alimentar, após homologação:
- `knowledge/persona-click.md`;
- `knowledge/faq.md`;
- `docs/business-rules/`;
- schemas de intenção/estado, se aprovados;
- prompts;
- roteador de estado;
- workflows n8n;
- métricas de CRM.

## 8. Regra de segurança

Este relatório é deliberadamente agregado. Não contém falas literais, nomes de clientes, documentos, contatos, endereços ou preços históricos detalhados.

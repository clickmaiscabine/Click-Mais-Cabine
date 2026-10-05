# Click Mais OS — Baseline Funcional v1.1

- Status: homologated
- Data: 2026-10-05
- Substitui: definição funcional v1.0 da conversa de projeto
- Próxima etapa: Projeto Executivo v1.0
- ADR vinculada: ADR-0006

## 1. Finalidade

Esta baseline congela as decisões funcionais que deverão orientar o Projeto Executivo do Click Mais OS.

O Click Mais OS não é apenas um chatbot. É o sistema que acompanha aquisição, orçamento, processo comercial, fechamento e operação do evento mantendo estado persistente e auditável.

## 2. Entrada principal de leads

A principal origem comercial prevista para novos leads são anúncios e landing pages da Click Mais.

Landing pages iniciais:
- Cabine de Fotos;
- Plataforma 360;
- Totem de Fotos.

Cada página possui um botão **Quero orçamento** que direciona ao WhatsApp com mensagem predefinida/tagueada.

Essa mensagem deve ser aproveitada como sinal de aquisição para registrar, quando disponível:

- origem;
- landing page;
- produto de entrada;
- campanha;
- data/hora;
- mensagem inicial;
- telefone/identificador do contato.

A arquitetura deve permitir evolução futura para UTMs ou parâmetros equivalentes sem alterar o núcleo do modelo.

## 3. Gate de entrada

Nem toda mensagem recebida no WhatsApp é lead.

O sistema deverá distinguir entrada comercial de mensagens como:
- familiares e contatos pessoais;
- fornecedores;
- bancos;
- notificações;
- mensagens automáticas;
- contatos internos;
- outras mensagens sem intenção comercial.

Entradas provenientes das landing pages são sinal forte de intenção comercial, mas continuam sujeitas às validações do sistema.

## 4. Níveis do sistema

### Nível 1 — Aquisição e relacionamento

```text
Anúncios
→ Landing Pages
→ WhatsApp
↔ Meta Cloud API
→ n8n
```

**Chatwoot está fora do projeto V1.**

O acompanhamento visual e o registro operacional serão feitos por Trello + Supabase.

### Nível 2 — Cérebro operacional

- Supabase / Event State Engine;
- n8n;
- JEV;
- Guards;
- Audit;
- LLM compositor;
- código determinístico.

Responsabilidades:
- Supabase sabe e registra;
- n8n coordena e executa;
- JEV decide somente dentro de choices autorizadas;
- código calcula regras determinísticas;
- LLM escreve;
- Guard impede ações indevidas;
- Audit registra e explica.

### Nível 3 — Jornada comercial e operacional

Orçamento vem antes do processo comercial de venda.

```text
ENTRADA
→ ORÇAMENTO
→ RESPOSTA
→ FAC / DÚVIDAS
→ NEGOCIAÇÃO BOT / HUMANO
→ FECHAMENTO
→ GANHO ou PERDIDO
```

Depois de GANHO:

```text
GANHO
→ CONTRATO
→ PAGAMENTO / SINAL
→ ARTE
→ LOGÍSTICA
→ PRÉ-EVENTO
→ EVENTO
→ ENTREGA
→ PÓS-VENDA
```

No projeto, "venda" é o processo comercial posterior à apresentação do orçamento: explicação do produto, diferenciais, dúvidas, quebra de objeções, argumentação, negociação autorizada e condução para decisão.

## 5. Marco de qualificação do lead

Um contato/prospect se torna **lead qualificado** quando recebe um orçamento efetivamente gerado e enviado.

```text
CONTATO / PROSPECT
→ dados suficientes
→ ORÇAMENTO ENVIADO
→ LEAD QUALIFICADO
```

Regra canônica:

> Todo contato que recebe orçamento integra a base de leads qualificados da Click Mais.

## 6. Trello Comercial V1

O card comercial nasce no marco `ORCAMENTO_ENVIADO`.

Não criar card comercial apenas porque alguém escreveu no WhatsApp.

Ordem canônica das listas:

1. ORÇAMENTO
2. RESPOSTA
3. FAC / DÚVIDAS
4. NEGOCIAÇÃO BOT / HUMANO
5. FECHAMENTO
6. GANHO
7. PERDIDO

### Significado

**ORÇAMENTO**  
Lead qualificado que recebeu orçamento.

**RESPOSTA**  
Cliente respondeu após receber o orçamento, sem necessariamente entrar em dúvida ou negociação.

**FAC / DÚVIDAS**  
Cliente busca informações adicionais sobre produto, funcionamento, diferenciais, objeções ou condições já autorizadas.

**NEGOCIAÇÃO BOT / HUMANO**  
Existe intenção comercial mais forte. O bot só atua dentro das regras homologadas. Barganha, preço proposto pelo cliente, desconto extra ou exceção seguem para humano.

**FECHAMENTO**  
Cliente manifesta intenção concreta de contratar e entra no fluxo de fechamento.

**GANHO**  
Venda confirmada segundo critérios que serão formalizados no Projeto Executivo. É o marco de transição comercial → operacional.

**PERDIDO**  
Oportunidade não convertida. O registro permanece na base histórica.

## 7. Estado atual não apaga histórico

Mover um card entre listas não remove o lead de coortes anteriores.

Exemplo:

```text
quote_sent = true
qualified_lead = true
pipeline_stage = FAC_DUVIDAS
```

O Trello responde:
> Em que estágio este lead está agora?

O Supabase responde:
> Quais leads possuem determinadas características históricas e atuais?

## 8. Remarketing e campanhas

Campanhas devem consultar o Supabase, não apenas a coluna atual do Trello.

Exemplo de consulta conceitual:

```text
orçamento enviado = sim
AND event_date dentro do período alvo
AND venda não ganha
AND campanha elegível = sim
```

Um lead pode estar em ORÇAMENTO, RESPOSTA, FAC/DÚVIDAS, NEGOCIAÇÃO, FECHAMENTO ou PERDIDO e ainda pertencer a uma coorte histórica. A elegibilidade final depende das regras da campanha.

## 9. Trello e Supabase

Regra mantida:

```text
SUPABASE = verdade operacional
TRELLO   = projeção humana / cockpit
n8n      = sincronização e execução
```

Trello não substitui o banco canônico.

## 10. Trello Logística

O Trello Logística continua separado do Trello Comercial.

Ele recebe o evento após o marco comercial definido para GANHO/entrada operacional e acompanha a execução do serviço.

A automação não deve duplicar desnecessariamente no quadro comercial atividades que pertencem à logística.

## 11. Preservação do que já existe

O projeto deverá reaproveitar, quando compatível:
- GitHub;
- VPS Hostinger;
- n8n;
- Supabase;
- microsite;
- contrato/assinatura;
- Trello;
- armazenamento e catálogos existentes;
- documentação comercial curada;
- tabela oficial de preços;
- materiais de logística;
- Hermes;
- MCP de desenvolvimento/inspeção.

A finalidade é integrar e governar, não reconstruir sem necessidade.

## 12. Fora do escopo V1

Não fazem parte do núcleo V1:
- Chatwoot;
- novo CRM próprio com interface gráfica;
- API não oficial de WhatsApp no caminho crítico;
- negociação autônoma fora das regras;
- descontos livres por IA;
- confirmação financeira totalmente autônoma;
- alteração contratual autônoma;
- preços aprendidos de conversas;
- uma IA única com autoridade sobre todo o sistema;
- MCP com poderes administrativos irrestritos.

## 13. Próxima etapa

O Projeto Executivo deverá detalhar, sem alterar silenciosamente esta baseline:

1. origem do contato;
2. identidade do contato;
3. ciclo do lead;
4. ciclo do evento;
5. modelo de dados;
6. estados e transições;
7. regras de qualificação;
8. Trello Comercial;
9. Trello Logística;
10. workflows n8n;
11. JEV e Guards;
12. handoff humano;
13. auditoria;
14. testes e homologação;
15. implantação progressiva.

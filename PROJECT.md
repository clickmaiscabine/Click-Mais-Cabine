# PROJECT.md — Click Mais Cabine Chatbot / Click Mais OS

## Objetivo

Construir uma plataforma de atendimento e automação da Click Mais Cabine, centrada em WhatsApp, capaz de receber contatos, manter contexto, conduzir atendimento, acionar processos e registrar estado de forma auditável.

O sistema não é definido como um único chatbot. Ele combina aquisição, canal oficial, estado persistente, regras determinísticas, decisão semântica limitada, linguagem natural e operação humana.

## Princípios

- estado explícito, não dependente apenas do contexto da LLM;
- idempotência;
- rastreabilidade;
- baixo acoplamento entre canais, IA e regras;
- possibilidade de trocar modelos sem reescrever o sistema;
- revisão humana para exceções relevantes;
- reconstrução possível a partir dos artefatos versionados;
- uma pessoa pode ter vários eventos;
- um evento pode ter vários orçamentos;
- exceção humana não altera regra canônica automaticamente;
- estado atual não apaga histórico comercial;
- nenhuma dependência obrigatória da V1 deve exigir nova assinatura mensal quando houver alternativa adequada já disponível.

## Pilares

1. **GitHub**: fonte canônica de artefatos versionáveis.
2. **Supabase**: estado operacional, Event State Engine e auditoria.
3. **n8n self-hosted**: orquestração e execução.
4. **Meta WhatsApp Cloud API**: transporte oficial.
5. **Trello**: cockpit humano e CRM visual da V1, como projeção do estado canônico.
6. **JEV**: decisão semântica somente dentro de opções autorizadas.
7. **Código determinístico**: preço, datas, promoções, combo, validações e completude.
8. **LLM**: linguagem, síntese e transformação; não é autoridade comercial.
9. **OneDrive**: repositório canônico da mídia pós-evento entregue ao cliente.
10. **Drive / Autentique / Calendar**: integrações operacionais, não fontes do estado mestre.
11. **Chatwoot**: fora do projeto V1.

## Aquisição principal V1

```text
Anúncio
→ Landing Page (Cabine / Plataforma 360 / Totem)
→ botão Quero orçamento
→ WhatsApp
→ Meta Cloud API
→ n8n
→ Supabase
```

A mensagem predefinida/tagueada deve ser aproveitada como sinal de origem e produto de interesse.

## Qualificação comercial

Contato/prospect e lead qualificado são estados conceitualmente diferentes.

```text
contato/prospect
→ orçamento efetivamente enviado
→ lead qualificado
```

O card do Trello Comercial nasce apenas após orçamento enviado.

Pipeline homologado:

```text
ORÇAMENTO
→ RESPOSTA
→ FAC / DÚVIDAS
→ NEGOCIAÇÃO BOT / HUMANO
→ FECHAMENTO
→ GANHO ou PERDIDO
```

Orçamento precede o processo comercial de venda. Venda designa explicações, diferenciais, dúvidas, quebra de objeções, negociação autorizada e condução ao fechamento.

## Estado da fundação — v0.4

Já existe no Supabase:

- runtime mínimo de sessão/evento/transição;
- auditoria de agentes e workflows;
- contatos e eventos comerciais;
- fatos com procedência e histórico;
- transições explícitas do ciclo de vida;
- prontidão por módulo;
- estruturas de orçamento, contrato, pagamento, arte, logística, entrega, campanhas, follow-up e handoff;
- registro não secreto de integrações.

No repositório existem:

- ADRs da arquitetura de produção;
- Baseline Funcional v1.1;
- Registro de Decisões;
- decisão formal de Trello como cockpit humano da V1;
- decisão formal de origem/qualificação/pipeline comercial;
- blueprint do Trello CRM V1;
- schemas do runtime;
- mapa de alocações;
- manifesto de workflows planejados;
- migrations sincronizadas com o banco;
- pesquisa curada de leads e Meta AI.

## Integrações

- **Meta/WhatsApp**: aguarda credenciais da nova estrutura; primeiro uso será com número de teste.
- **Chatwoot**: fora do projeto V1.

## Trello CRM V1

Regra:

```text
Supabase = verdade
Trello   = cockpit/projeção
n8n      = sincronização
```

O Supabase registra o contato/evento desde a entrada quando necessário. O Trello Comercial recebe somente oportunidades com orçamento enviado.

Uma alteração no Trello é tratada como solicitação humana; o n8n valida e o Supabase registra.

## Próxima camada

```text
baseline + decisões homologadas
→ Projeto Executivo
→ regras homologadas
→ contratos/schemas de negócio
→ especificação do workflow
→ fixtures/testes
→ JSON n8n
→ DEV
→ homologação
→ PROD
```

Pricing/localidades só devem entrar no motor determinístico após promoção explícita da fonte vigente.

# PROJECT.md — Click Mais Cabine Chatbot / Click Mais OS

## Objetivo

Construir uma plataforma de atendimento e automação da Click Mais Cabine, centrada em WhatsApp, capaz de receber contatos, manter contexto, conduzir atendimento, acionar processos e registrar estado de forma auditável.

O sistema não é definido como um único chatbot. Ele combina canal oficial, estado persistente, regras determinísticas, decisão semântica limitada, linguagem natural e operação humana.

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
11. **Chatwoot**: integração opcional/futura, fora do caminho crítico da V1.

## Estado da fundação — v0.3

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
- decisão formal de Trello como cockpit humano da V1;
- blueprint do Trello CRM V1;
- schemas do runtime;
- mapa de alocações;
- manifesto de workflows planejados;
- migrations sincronizadas com o banco;
- pesquisa curada de leads e Meta AI.

## Integrações em standby

- **Meta/WhatsApp**: aguarda credenciais da nova estrutura; primeiro uso será com número de teste.
- **Chatwoot**: opcional/futuro; não bloqueia nenhuma etapa da V1.

## Trello CRM V1

O quadro histórico **Controle de Orçamentos** será estudado antes de qualquer redesign. A decisão é reaproveitar a lógica comercial validada em produção, sem perder legibilidade humana.

Regra:

```text
Supabase = verdade
Trello   = cockpit/projeção
n8n      = sincronização
```

Uma alteração no Trello é tratada como solicitação humana; o n8n valida e o Supabase registra.

## Próxima camada

```text
regras homologadas
→ contratos/schemas de negócio
→ especificação do workflow
→ fixtures/testes
→ JSON n8n
→ DEV
→ homologação
→ PROD
```

Em especial, pricing/localidades só devem entrar no motor determinístico após promoção explícita da fonte vigente.

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
- exceção humana não altera regra canônica automaticamente.

## Pilares

1. **GitHub**: fonte canônica de artefatos versionáveis.
2. **Supabase**: estado operacional, Event State Engine e auditoria.
3. **n8n self-hosted**: orquestração e execução.
4. **Meta WhatsApp Cloud API**: transporte oficial.
5. **Chatwoot Cloud**: cockpit humano, inbox, CRM visual e handoff.
6. **JEV**: decisão semântica somente dentro de opções autorizadas.
7. **Código determinístico**: preço, datas, promoções, combo, validações e completude.
8. **LLM**: linguagem, síntese e transformação; não é autoridade comercial.
9. **OneDrive**: repositório canônico da mídia pós-evento entregue ao cliente.
10. **Trello / Drive / Autentique / Calendar**: integrações operacionais, não fontes do estado mestre.

## Estado da fundação — v0.2

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
- schemas do runtime;
- mapa de alocações;
- manifesto de workflows planejados;
- migrations sincronizadas com o banco;
- pesquisa curada de leads e Meta AI.

## Integrações em standby

- **Meta/WhatsApp**: aguarda credenciais da nova estrutura; primeiro uso será com número de teste.
- **Chatwoot**: aguarda conclusão do onboarding/credencial.

A ausência dessas credenciais não bloqueia a construção do núcleo. Os adaptadores permanecem com runtime desabilitado até configuração e teste.

## Próxima camada

O esqueleto de dados não significa que todas as regras de negócio estejam congeladas.

A construção funcional segue:

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

Em especial, pricing/localidades só devem entrar no motor determinístico após promoção explícita da fonte vigente; faixas ainda marcadas como provisórias não viram regra automática.

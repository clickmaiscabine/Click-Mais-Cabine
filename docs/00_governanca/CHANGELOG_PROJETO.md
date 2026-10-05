# Changelog do Projeto — Click Mais OS

## 2026-10-05 — Baseline Funcional v1.1

### Adicionado
- estrutura documental numerada para a fase de Projeto Executivo;
- baseline funcional homologada;
- registro numerado de decisões;
- formalização da origem por landing pages;
- marco de qualificação do lead em orçamento enviado;
- novo pipeline Trello Comercial;
- separação explícita entre estado atual e coorte histórica;
- regra de remarketing baseada no Supabase;
- ADR-0006.

### Alterado
- Chatwoot deixa de ser opcional no caminho V1 e passa a ficar fora do projeto V1;
- criação de card Trello deixa de ocorrer no primeiro customer_event e passa a ocorrer após orçamento enviado;
- ordem comercial passa a ser:
  ORÇAMENTO → RESPOSTA → FAC/DÚVIDAS → NEGOCIAÇÃO BOT/HUMANO → FECHAMENTO → GANHO/PERDIDO;
- definição de “venda” é deslocada para o processo comercial posterior ao orçamento.

### Preservado
- Supabase como fonte de verdade;
- n8n como orquestrador/executor;
- Trello como cockpit humano;
- JEV limitado a choices autorizadas;
- regras determinísticas para preço e políticas;
- human lock/handoff;
- auditoria;
- separação Trello Comercial × Trello Logística.

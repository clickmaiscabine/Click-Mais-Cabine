# Changelog

## [0.3.0] - 2026-10-03

### Changed
- Trello adotado como cockpit humano e CRM visual da V1;
- Supabase permanece CRM/estado canônico;
- Chatwoot removido do caminho crítico e classificado como opcional/futuro;
- fluxo Meta/WhatsApp passa diretamente por n8n, sem dependência obrigatória de Chatwoot;
- arquitetura passa a prever sincronização bidirecional controlada Supabase ↔ n8n ↔ Trello.

### Added
- ADR-0005 — Trello como cockpit humano e CRM visual da V1;
- `docs/architecture/TRELLO-CRM-V1.md`;
- unidade recomendada `1 cartão = 1 customer_event`;
- conceito de Trello como projeção humana e canal de comandos validados;
- caso canônico de remarketing por data/equipamento ocioso;
- `CM-WF-160 trello-crm-projection`;
- `CM-WF-161 trello-human-actions`;
- regra de estudar o quadro legado Controle de Orçamentos antes de alterá-lo.

## [0.2.0] - 2026-10-03

### Added
- arquitetura de produção Click Mais OS formalizada em ADR-0003;
- OneDrive homologado como entrega canônica pós-evento em ADR-0004;
- mapa funcional e mapa de alocações por componente;
- schemas privados `business` e `integrations` no Supabase;
- contatos e eventos comerciais separados de sessões de conversa;
- fatos com procedência `known/derived/verified/conflict` e histórico de substituição;
- histórico explícito do ciclo de vida de eventos da empresa;
- prontidão/completude por módulo;
- estruturas persistentes para orçamento, contrato, pagamento, arte, logística, entrega, consentimento, campanhas, follow-up e handoff;
- registro não secreto de integrações e estado `runtime_enabled`;
- OneDrive registrado como integração canônica de entrega;
- manifesto funcional dos workflows n8n planejados;
- schemas JSON para customer event, event fact e integration status.

### Fixed
- ambiguidade PL/pgSQL em `business.transition_customer_event()`;
- separação entre transição da sessão e transição do ciclo de vida do evento.

## [0.1.0] - 2026-10-01
### Added
- GitHub definido como fonte canônica do projeto;
- protocolo multiagente;
- documentação de arquitetura, segurança, contribuição e operação n8n;
- Event State Engine mínimo;
- auditoria;
- helpers atômicos;
- validador do repositório e GitHub Action.

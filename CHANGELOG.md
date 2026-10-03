# Changelog

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
- Meta e Chatwoot registrados em standby/pending credentials;
- OneDrive registrado como integração canônica de entrega;
- manifesto funcional dos workflows n8n planejados;
- schemas JSON para customer event, event fact e integration status;
- grants backend necessários para n8n/service role no runtime privado.

### Fixed
- ambiguidade PL/pgSQL em `business.transition_customer_event()`, encontrada no smoke test;
- separação entre transição da sessão e transição do ciclo de vida do evento.

### Verified
- teste funcional de criação de contato/evento/sessão;
- atualização de fato com preservação de histórico e apenas um fato atual;
- transição de ciclo de vida com controle de versão e histórico;
- remoção dos dados sintéticos após o teste.

## [0.1.0] - 2026-10-01
### Added
- GitHub definido como fonte canônica do projeto;
- protocolo multiagente (`AGENTS.md`, `CLAUDE.md`, instruções de agentes);
- documentação de arquitetura, segurança, contribuição e operação n8n;
- estrutura de knowledge, research, prompts, schemas, n8n, src, deploy e Supabase;
- templates de ADR, regras de negócio, pesquisa, workflow e teste;
- Manifest legível por máquina;
- schemas JSON do runtime;
- migrations Supabase sincronizadas;
- Event State Engine mínimo com sessões, eventos e transições;
- auditoria de execuções de agentes e workflows;
- helpers atômicos de criação de sessão, idempotência de eventos e transição com controle de versão;
- índices de runtime;
- validador `scripts/validate_repository.py`;
- GitHub Action de validação;
- `CODEOWNERS` e template de Pull Request;
- arquivos iniciais de knowledge em estado draft.

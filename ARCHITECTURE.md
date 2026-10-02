# ARCHITECTURE.md — Arquitetura-base v0.1

## Visão

```text
                    GitHub
          documentação + código + JSONs
          schemas + prompts + pesquisas
                       |
          +------------+-------------+
          |            |             |
       ChatGPT       Codex       Claude/Hermes
          |            |             |
          +------------+-------------+
                       |
                    n8n DEV
                       |
                    testes
                       |
                  homologação
                       |
               n8n PROD / VPS
                       |
        +--------------+--------------+
        |              |              |
     Supabase       WhatsApp       Serviços
     runtime         Meta API       externos
```

## Separação de responsabilidades

### GitHub
Guarda o estado desejado e versionado do sistema: workflows, código, documentação, contratos, prompts, pesquisas, migrations e testes.

### Supabase
Guarda o estado observado em execução: sessões, eventos, transições e auditoria. Domínios de negócio serão adicionados por migrations versionadas.

### n8n
Executa integrações e workflows. Um workflow em produção deve possuir correspondente versionado no GitHub.

### Agentes
Leem a base canônica, propõem/implementam mudanças em branch e produzem evidências. Nenhum agente é a memória exclusiva do projeto.

## Runtime mínimo — Event State Engine

Fluxo conceitual:

```text
mensagem/evento
→ normalização
→ gravação idempotente do evento
→ leitura da sessão/estado
→ decisão/roteamento
→ ação
→ transição de estado
→ auditoria
→ resposta/efeito externo
```

Tabelas-base:
- `core.sessions`
- `core.events`
- `core.state_transitions`
- `audit.agent_runs`
- `audit.workflow_runs`

Os schemas `core` e `audit` não são destinados à exposição pública direta.

## Evolução
Domínios como lead, orçamento, contrato, pagamento, arte, logística, entrega e CRM entram somente após modelagem explícita de regras, contratos e transições.

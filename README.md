# Click Mais Cabine — Base Canônica do Chatbot

> **Status:** arquitetura-base v0.1  
> Este repositório é a fonte canônica de software, documentação, workflows, pesquisas, contratos de dados e instruções para agentes do projeto Click Mais Cabine.

## 1. Regra principal

O projeto não pertence a uma IA, a uma conversa ou ao n8n.

- **GitHub** = memória canônica do projeto.
- **Supabase** = estado operacional e auditoria.
- **n8n** = orquestração e execução.
- **Agentes/LLMs** = trabalhadores especializados que leem e alteram artefatos versionados.

```text
GitHub (o que o sistema É)
        ↓
DEV / testes
        ↓
homologação
        ↓
n8n PROD na VPS
        ↓
Supabase + Meta/WhatsApp + serviços externos
```

## 2. Leitura obrigatória para qualquer agente

Antes de criar, revisar ou alterar qualquer artefato, leia nesta ordem:

1. `README.md`
2. `AGENTS.md`
3. `PROJECT.md`
4. `ARCHITECTURE.md`
5. `MANIFEST.json`
6. o `README.md` da pasta afetada
7. schemas, testes e ADRs relacionados

Se houver conflito, a ordem de autoridade é:

```text
decisão humana registrada
→ ADR aprovada
→ schemas/contratos
→ ARCHITECTURE.md
→ MANIFEST.json
→ implementação
→ notas/comentários
```

Nenhum agente deve “corrigir” uma regra superior alterando apenas a implementação.

## 3. Estrutura

```text
Click-Mais-Cabine/
├── README.md
├── AGENTS.md
├── PROJECT.md
├── ARCHITECTURE.md
├── MANIFEST.json
├── CHANGELOG.md
├── .env.example
├── docs/
│   ├── decisions/
│   ├── architecture/
│   ├── business-rules/
│   └── product/
├── knowledge/
├── schemas/
├── prompts/
├── n8n/
│   ├── workflows/
│   ├── subflows/
│   ├── fixtures/
│   └── tests/
├── src/
│   ├── functions/
│   ├── validators/
│   └── adapters/
├── research/
├── supabase/
│   └── migrations/
└── deploy/
```

## 4. Onde guardar cada coisa

| Artefato | Local |
|---|---|
| Workflow n8n exportado | `n8n/workflows/` |
| Subworkflow reutilizável | `n8n/subflows/` |
| Entrada de teste | `n8n/fixtures/` |
| Teste de workflow | `n8n/tests/` |
| Schema JSON | `schemas/` |
| Prompt | `prompts/` |
| Regra de negócio | `docs/business-rules/` |
| Decisão arquitetural | `docs/decisions/` |
| Pesquisa | `research/<tema>/` |
| Conhecimento do chatbot | `knowledge/` |
| Código auxiliar | `src/` |
| Migração Supabase | `supabase/migrations/` |
| Segredo/credencial | **NUNCA no GitHub** |

## 5. Convenções

### Workflows n8n
```text
CM-WF-001_whatsapp-ingress.json
CM-WF-002_normalizacao.json
CM-WF-003_event-state-router.json
```

### Subflows
```text
CM-SF-001_normalizar-telefone.json
```

### ADRs
```text
ADR-0001_fonte-canonica-github.md
ADR-0002_event-state-engine.md
```

### Pesquisas
```text
research/meta/2026-10-01_webhooks-whatsapp.md
```

Toda pesquisa deve registrar data, pergunta, fontes, fatos verificados, conclusão, impacto e itens ainda incertos.

## 6. Ciclo de alteração

```text
tarefa/issue
→ branch
→ alteração
→ testes
→ revisão
→ Pull Request
→ homologação
→ merge
→ DEV
→ validação
→ PROD
```

O n8n de produção não é o editor principal do sistema.

## 7. Regra para workflows n8n

O JSON exportado e homologado deve existir no GitHub.

Ao alterar um workflow:

1. localizar o ID `CM-WF-xxx`;
2. ler workflow, schemas e testes relacionados;
3. alterar em branch;
4. validar o JSON;
5. executar fixtures/testes;
6. atualizar `MANIFEST.json` se dependências/status mudarem;
7. atualizar `CHANGELOG.md`;
8. homologar em DEV;
9. somente depois promover para PROD.

Credenciais do n8n nunca entram no repositório.

## 8. Supabase

Projeto operacional: **Chatbot Clique Mais**.

O Supabase não substitui o GitHub. Ele guarda o estado de execução: eventos, sessões, transições, auditoria e, progressivamente, dados de CRM, contrato, pagamento, arte, logística e entrega.

A definição versionável do banco deve existir também em `supabase/migrations/`.

## 9. MANIFEST.json

É o índice legível por máquina dos artefatos oficiais. Antes de criar algo novo, o agente deve consultá-lo para evitar duplicação.

Estados permitidos:

- `draft`
- `development`
- `review`
- `homologated`
- `production`
- `deprecated`
- `archived`

## 10. Como um agente inicia uma tarefa

```text
1. Ler os arquivos obrigatórios.
2. Identificar artefatos afetados.
3. Ler schemas/testes relacionados.
4. Declarar premissas relevantes.
5. Fazer a menor alteração suficiente.
6. Não inventar campos, estados ou integrações.
7. Atualizar testes/documentação.
8. Entregar diff, evidências e riscos.
```

## 11. Segurança

Nunca commitar senhas, tokens, chaves de API, `service_role`, credenciais Meta/WhatsApp, credenciais n8n, dumps de banco ou dados pessoais reais de clientes.

Use `.env.example` apenas com nomes de variáveis vazias.

> **Importante:** este repositório está público no momento. Antes de registrar conteúdo estratégico, prompts internos, preços não públicos ou artefatos de produção, recomenda-se torná-lo privado.

## 12. Estado atual

A arquitetura-base **v0.1** está implantada e inclui:

- governança multiagente;
- estrutura canônica de artefatos;
- Event State Engine mínimo no Supabase;
- idempotência e controle de concorrência;
- auditoria de agentes e workflows;
- migrations e schemas versionados;
- templates de workflow, teste, ADR, pesquisa e regra de negócio;
- validação automática do repositório via GitHub Actions.

Para validar localmente:

```bash
python scripts/validate_repository.py
```

CRM, contrato, pagamento, arte, logística e entrega serão modelados progressivamente, com regras e schemas próprios.

**Princípio operacional:** se uma informação precisa sobreviver à troca de conversa, agente ou modelo, ela deve ser registrada no lugar canônico correto.

# Workflows n8n

Arquivos executáveis oficiais usam:

```text
CM-WF-XXX_nome.json
```

O JSON deve ser exportável/importável, sem credenciais embutidas. Status e dependências devem constar no `MANIFEST.json`.

## Mapa antes da implementação

O arquivo `../WORKFLOW-MANIFEST.json` registra a alocação funcional planejada de workflows.

Ele é **especificação**, não um export do n8n.

Portanto:

```text
WORKFLOW-MANIFEST
→ especificação do CM-WF
→ fixtures/testes
→ JSON executável
→ DEV
→ homologação
→ PROD
```

Não criar um arquivo `CM-WF-XXX_*.json` vazio apenas para representar intenção arquitetural.

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

## Implementação de intake em review

`CM-WF-000_whatsapp-intake-lab.json` é o export importável do workflow isolado de ficha cumulativa. Está inativo e não substitui o receiver Meta de teste. Credenciais são referências por nome, sem segredos. As RPCs SQL foram validadas em banco isolado; não foram instaladas no operacional. Ver a auditoria em `docs/04_workflows/WHATSAPP_INTAKE_AUDIT_2026-10-14.md`.

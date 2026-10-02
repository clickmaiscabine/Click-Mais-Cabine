# n8n — operação, acesso e promoção

## Princípio
Agentes não devem receber acesso root à VPS para revisar workflows. Revisão acontece sobre JSONs versionados no GitHub.

## Ambientes
- DEV: edição, importação, testes e validação.
- PROD: somente workflows homologados.

Fluxo:
```text
GitHub branch → validação → n8n DEV → teste → homologação → merge main → promoção PROD
```

## Acesso de agentes
Preferência:
1. GitHub para leitura/revisão de JSON;
2. API n8n autenticada para operações necessárias;
3. acesso ao host apenas para administração de infraestrutura.

Não compartilhar uma mesma credencial entre todos os agentes quando for possível emitir credenciais separadas.

## Credenciais
Nunca exportar credenciais do n8n para o GitHub.
No JSON versionado, preservar apenas referências/stubs que não revelem segredo.

## Community/self-hosted
A funcionalidade nativa de Source Control/Environments do n8n é dependente de plano. Se ela não estiver disponível na instalação, manter este repositório como canônico e usar API/CLI/import-export para sincronização.

## Produção
- não editar lógica diretamente em PROD como rotina;
- se houver correção emergencial em PROD, exportar imediatamente, abrir PR de reconciliação e registrar no CHANGELOG;
- registrar `CM-WF-XXX` e versão em `audit.workflow_runs`.

## Auditoria
Executar periodicamente o Security Audit do n8n e registrar achados relevantes em `research/n8n/` ou issue.

Referências oficiais:
- https://docs.n8n.io/source-control-environments/create-environments/
- https://docs.n8n.io/hosting/securing/security-audit/

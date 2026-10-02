# SECURITY.md — Click Mais Cabine

## Regra absoluta
Segredos nunca são versionados, mesmo em repositório privado.

Inclui:
- chaves Supabase secret/service_role;
- API keys n8n;
- tokens Meta/WhatsApp;
- senhas;
- SSH private keys;
- cookies/sessões;
- dumps com dados de clientes;
- exports de credenciais do n8n.

## Onde guardar
- credenciais de nodes: Credential Store do n8n;
- variáveis de runtime: ambiente/secret store da VPS;
- GitHub Actions: GitHub Secrets;
- agentes: conexão autorizada/MCP com menor privilégio possível.

## Banco
Os schemas internos `core` e `audit` não devem ser expostos diretamente pela Data API. Se uma necessidade futura exigir exposição, primeiro definir grants mínimos + RLS + políticas e revisar com Security Advisor.

## Incidente
Se um segredo for commitado:
1. considerar o segredo comprometido;
2. revogar/rotacionar imediatamente;
3. remover do histórico;
4. registrar o incidente e os componentes afetados.

Privatizar o repositório reduz exposição futura, mas não torna seguro versionar segredos.

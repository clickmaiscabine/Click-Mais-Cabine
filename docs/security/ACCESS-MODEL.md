# Modelo de acesso — agentes e infraestrutura

## Objetivo
Permitir que vários agentes trabalhem no mesmo projeto sem transformar uma credencial de produção em ponto único de comprometimento.

## GitHub
Todos os agentes autorizados podem ler a base canônica.
Escrita deve ocorrer preferencialmente via branch + PR.

## Supabase
- schema/migrations: alteração controlada e versionada;
- dados de produção: somente quando a tarefa exigir;
- secret/service_role: nunca no repositório ou prompt;
- preferir conexões autorizadas por ferramenta/MCP.

## n8n
Camadas de acesso:
1. leitura/revisão: JSON no GitHub;
2. DEV: importar/editar/executar workflows;
3. PROD: promoção e diagnóstico;
4. VPS/root: somente administração de infraestrutura.

Um agente que só revisa JSON não precisa de acesso ao host nem às credenciais do cliente.

## Segregação
Quando tecnicamente disponível, usar credenciais/tokens distintos por integração/agente e aplicar menor privilégio.

## Regra de produção
Qualquer alteração emergencial feita fora do GitHub gera uma obrigação de reconciliação: exportar o estado real, comparar, versionar e registrar a decisão.

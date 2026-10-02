# ADR-0002 — Event State Engine mínimo

- Status: homologated
- Data: 2026-10-01

## Contexto
O chatbot precisa preservar estado fora da memória da LLM e permitir troca de agentes/modelos sem perder continuidade.

## Decisão
O runtime mínimo usa:
- `core.sessions` para o estado atual;
- `core.events` para eventos idempotentes;
- `core.state_transitions` para histórico explícito;
- `audit.agent_runs` para execuções de IA/agentes;
- `audit.workflow_runs` para execuções n8n.

Os schemas `core` e `audit` não serão expostos à Data API por padrão. Se forem expostos no futuro, RLS e políticas específicas devem ser definidas antes da exposição.

## Consequências
- a LLM não é a fonte do estado;
- transições ficam auditáveis;
- workflows podem ser correlacionados com eventos/sessões;
- novos domínios serão adicionados sem misturar lógica de negócio com o mecanismo básico de estado.

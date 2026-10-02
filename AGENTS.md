# AGENTS.md — Protocolo obrigatório para agentes

Este arquivo vale para ChatGPT, Hermes, Codex, Claude Code e qualquer outro agente que trabalhe no projeto.

## Entrada obrigatória
Leia: README.md → PROJECT.md → ARCHITECTURE.md → MANIFEST.json → README da pasta afetada.

## Regras
1. GitHub é a fonte canônica de artefatos versionáveis.
2. Não use memória de conversa como fonte superior ao repositório.
3. Não invente campos, estados, endpoints, credenciais ou regras de negócio.
4. Antes de criar artefato novo, procure equivalente no MANIFEST.json.
5. Faça a menor alteração suficiente.
6. Toda mudança estrutural exige documentação; decisões arquiteturais relevantes exigem ADR.
7. Mudança em workflow deve considerar fixtures e testes.
8. Mudança em schema exige revisar consumidores.
9. Segredos nunca entram no Git.
10. Produção não deve ser alterada diretamente sem homologação.

## Ao revisar
Informe:
- artefato revisado;
- versão/commit;
- achados;
- severidade técnica;
- evidências;
- mudança proposta;
- testes necessários.

## Ao implementar
Entregue:
- arquivos alterados;
- motivo;
- impacto;
- testes executados;
- resultado;
- riscos/pendências.

## Status
Use somente: draft, development, review, homologated, production, deprecated, archived.

## Regra de parada
Se uma alteração exigir uma decisão de negócio ainda não registrada, não a invente. Registre a pendência e preserve o comportamento canônico existente.

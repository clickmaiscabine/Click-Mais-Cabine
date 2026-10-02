# CONTRIBUTING.md

## Fluxo padrão
1. sincronize a `main`;
2. crie branch curta e descritiva;
3. leia README.md + AGENTS.md + documentos do componente;
4. faça a menor alteração coerente;
5. rode `python scripts/validate_repository.py`;
6. registre testes/evidências;
7. atualize MANIFEST/CHANGELOG quando aplicável;
8. abra PR;
9. só promova a PROD após homologação.

## Branches
Exemplos:
- `feat/cm-wf-003-state-router`
- `fix/idempotency-meta-events`
- `docs/adr-payment-state`
- `research/meta-template-rules`

## Commits
Preferir:
- `feat:`
- `fix:`
- `docs:`
- `test:`
- `refactor:`
- `chore:`

## Definição mínima de pronto
Uma alteração está pronta quando código/JSON, contrato, documentação e testes afetados contam a mesma história.

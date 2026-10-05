# Documentação — Click Mais OS

Status: homologated  
Data: 2026-10-05

Esta pasta organiza a documentação do projeto em camadas. A numeração define a ordem lógica de leitura para a fase de Projeto Executivo.

## Estrutura

1. `00_governanca/` — baseline aprovada, decisões e changelog.
2. `01_negocio/` — jornada comercial, qualificação, pipeline e operação do negócio.
3. `02_arquitetura/` — arquitetura lógica e responsabilidades dos componentes.
4. `03_dados/` — modelo de dados, estados, transições e dicionário.
5. `04_workflows/` — manifesto e especificações dos workflows n8n.
6. `05_seguranca/` — handoff, guards, human lock e auditoria.
7. `06_testes/` — estratégia de homologação, replay, shadow mode e casos adversos.
8. `07_projeto_executivo/` — projeto executivo consolidado e seus anexos.

## Documentação preexistente

As pastas `docs/architecture/` e `docs/decisions/` permanecem preservadas. Elas contêm a fundação arquitetural e ADRs anteriores.

Quando houver conflito entre um documento anterior e uma decisão posterior explicitamente homologada, prevalece a decisão posterior registrada em ADR ou em `00_governanca/REGISTRO_DE_DECISOES.md`.

## Ordem de autoridade

```text
decisão humana registrada
→ ADR homologada mais recente
→ baseline funcional homologada
→ schemas/contratos
→ arquitetura
→ manifesto
→ implementação
```

Nenhum documento do Projeto Executivo pode alterar silenciosamente uma decisão homologada.

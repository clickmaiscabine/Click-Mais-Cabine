# TSK-144 — arquitetura para homologação

Este pacote documenta a Fase 1 do atendimento automático até o orçamento completo. Ele é **somente de homologação**: não cria, ativa ou executa workflows; não toca no WhatsApp comercial, Trello ou VPS.

## Regra de responsabilidade

Qualquer instrução histórica que mencione `Codex` como executor foi reinterpretada para **Whork**. Não há tarefa operacional atribuída ao Codex neste pacote.

## Evidência reconciliada

| Workflow | Estado observado | Papel |
|---|---|---|
| Agenda Trello → Supabase (`iExoGUJ4CgBTXcWP`) | ativo | espelho de agenda às 15h e 23h |
| Meta LAB Ingress (`iIAtpaRgvtssABsB`) | ativo | entrada do número Meta de teste, sem resposta |
| F1 Persistência (`3RAuwFaHIaZvOMjU`) | ativo | ficha cumulativa e JEV, sem resposta |
| Quote, Response, Trello, Follow-up e Handoff | inativos | planejadores LAB, sem despacho |

Os arquivos `graphify-out/*`, `ARCHITECTURE.md`, `MANIFEST.json`, baseline e ADRs não foram fornecidos neste espelho. A reconciliação Graphify fica marcada como pendência de evidência, sem inventar cobertura.

## Conteúdo

- `01-visao-geral.mmd` a `06-excecoes-controle-humano.mmd`: seis fluxogramas Mermaid.
- `MAPA_ARQUITETURAL.md`: visão consolidada, dependências e lacunas.
- `MATRIZ_NODES_CONEXOES.md`: matriz de workflows, nós e conexões.
- `ESTADOS_E_CONTRATOS.md`: estados e contratos de entrada/saída.
- `FILA_E_TEMPORIZACAO.md`: fila persistente e cronograma.
- `TESTES_E_RISCOS.md`: plano ponta a ponta, riscos e comparação.

## Limites comerciais

O motor de preço deve consultar exclusivamente a planilha homologada indicada na OS. Este pacote não contém valores, descontos ou regras inferidas de conversas.

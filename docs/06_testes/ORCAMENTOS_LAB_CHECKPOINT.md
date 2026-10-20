# Orçamentos social + empresarial → Trello LAB

Status: development

## Contrato aprovado

Usuário aprovou o projeto em 19/10/2026. Escopo: concluir o atendimento de orçamento social e empresarial e o acompanhamento no Trello LAB, reutilizando os componentes existentes. Sem merge, promoção, WhatsApp comercial ou alteração de reservas reais.

Base: `cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af`, PR #24 em rascunho.

- [x] P0: HEAD remoto/local reconciliado; working tree inicial limpa; versões efetivas inspecionadas.
- [x] P0: projeto/mapa aprovado preservados em `docs/07_projeto_executivo/orcamentos-lab/`.
- [x] P0: anexos inventariados por SHA256. Propostas antigas com Chatwoot e preços não promovidos não substituem baseline/DEC-017/catálogo vigente.
- [x] P1: qualificação social responsiva no F1 atual.
- [x] P2: contexto TEST e prontidão social/corporativa; preço e agenda preservados.
- [x] P3: apresentação social, persistência e fila compatíveis. Mídia permanece opcional até haver ativo oficial estável.
- [x] P4: projeção Trello recuperável/idempotente, somente board LAB.
- [ ] P5: resposta pós-orçamento e acompanhamento/handoff.
- [ ] P6: regressão, integração, falhas e reprocessamento.
- [ ] P7: E2E real dos dois ramos com ACK/callback e cartão.
- [ ] P8: commits, versões, evidências e PR draft atualizados.

## Base operacional

F1 `3RAuwFaHIaZvOMjU` / `8b24cd61-74ff-4b99-969f-398b901f6f3e`; fila `JVZIPknnB7iIwcxi` / `d83ff35f-2adc-4d8c-8a45-bc9c1fc1c267`; planner Trello `qr2WiKWr00oZMKbh` / `ffcdc7d9-2bf7-42e4-aed4-7cbe7c67aded` (shadow/inativo). Não identificar workflows somente pelo nome 070, usado também na fila.

Board autorizado: `6ad446503b529e753ac4b878`. Listas iniciais: CONTATO `6ad44654dd62ee3c9c13ed76`, ORÇAMENTO `6ad446552feeb154f01a96a0`. Cartão histórico existe; mapping vazio. Não recriar nem reabrir evento arquivado para aparentar integração.

## Incidente do teste e correção

Em 19/10/2026, um teste manual recebeu a continuação de uma qualificação corporativa anterior. A causa foi estado residual do único número Meta TEST, e não uma interpretação da nova mensagem. A rotina existente `cmc_reset_meta_test_session_v1` foi executada pelo workflow `xM4kkGHmZKVPCIKj`; ela arquivou apenas o evento TEST ativo, preservou auditoria e não tocou na agenda.

O F1 ativo foi publicado na versão `d0140655-8cd8-48c8-8efc-0a84c5391ee9`. A mensagem social após uma data recém-identificada agora confirma, em linguagem comercial, a data registrada antes de solicitar a localidade: “Anotei a data DD/MM/AAAA. Confirma que é essa data para eu seguir com a consulta?”. O compositor ativo foi publicado na versão `2ea7a773-a150-4606-8aa1-be22b1ea39bb`, removendo benefícios duplicados.

Após a observação do teste de qualificação corporativa, o F1 foi corrigido e publicado na versão `80c57e2e-16db-42a2-b95e-8e5aabd53cc5`: uma data inicial completa somada à quantidade de dias gera as datas corridas automaticamente (por exemplo, 2 dias a partir de 15/12/2026 = 15 e 16/12/2026). A pergunta de datas separadas só permanece para a declaração explícita de dias não consecutivos. A correção não altera agenda, preços, reservas ou o ramo social; 387 testes automatizados passaram.

## Proteções e retomada

Sessão Meta TEST reiniciada e pronta para um novo atendimento. Testes isolados usam replay identificado ou transação revertida, sem inventar inbound/janela. Credenciais serão reutilizadas por referência e omitidas nos exports. Três reservas ativas em 24/10/2026 permanecem protegidas.

Próxima ação: executar uma conversa autêntica do número autorizado, registrar confirmação de envio e comprovar o percurso social completo até o cartão Trello. Nenhum processo em segundo plano representa um harness autônomo.

# BR-002 — Turno 1: reconciliação do runtime LAB

Status: review  
Inspeção: 2026-10-18, aproximadamente 19h46–19h50 America/Sao_Paulo.  
Escopo: diagnóstico e evidências; nenhuma implementação ou execução com efeitos externos.

## Resultado

A BR-002 está homologada e testada, mas **o F1 ativo não está conectado ao Quote Engine, à apresentação ou à inserção na fila**. Há componentes reutilizáveis e registros de testes anteriores. Esses registros não comprovam um percurso automático completo.

O caminho de menor impacto é conectar o handoff já existente ao CM-WF-030, acrescentando seleção corporativa no seu adapter e reaproveitando catálogo, persistência, apresentação, guards e fila. Não reconstituir uma arquitetura nova nem importar todas as branches acumuladas.

## Condições de entrada e fontes

- Lidos AGENTS.md, README, PROJECT, Baseline Funcional v1.1, Registro de Decisões (incluindo DEC-017), ARCHITECTURE, MANIFEST e READMEs relacionados.
- PR #23: aberto, draft, não integrado. HEAD: `c913e7e51fc6ddcfc700b05b01fc198b92bf0e92`.
- main: `047297d54d26620c73076d68ade3e55dcf29977b`.
- BR-002: `src/functions/corporate-pricing.cjs`, export `calcularOrcamentoCorporativo`.
- Documento Drive homologado: [07_REGRA_CANONICA_CALCULO_CORPORATIVO_CLICK_MAIS_2026](https://docs.google.com/document/d/1Z--hPmKF7uRZ79BB7z39GGU0FP3km3IyvqzfKzPvn1Y/edit).
- [Fonte oficial de preços](https://drive.google.com/file/d/1ZkoS54blFcWQxC66OTnHuI9ZBu_ErFmH/view): revisão atual confirmada `0B6VWt3lEydcWUFVOSTYrS0RESm9NRERaUUpBNzNMUm9IcG4wPQ`; modificação 2026-08-30T05:50:16.516Z. As oito bases Pix T1190–T1890 coincidem com catalog.pricing_tiers.
- Anexos antigos não substituíram essa fonte. Nenhuma decisão comercial nova foi tomada.

## Caminho realmente publicado

1. `iIAtpaRgvtssABsB`: Receive WhatsApp test message → normalização → gate de phone_number_id Meta TEST → Executar Flow1 sem envio.
2. `3RAuwFaHIaZvOMjU`: snapshot Supabase → restauração de contexto → extração → JEV opcional → RPC `public.cm_quote_flow1_apply_v1` → Roteador — preparar próximo flow.
3. O roteador é terminal. Em FLOW_5_READY retorna `ready_for_price=true`, `draft_only=true`, `auto_send=false`. Não há ligação ao CM-WF-030 ou a uma gravação na fila.
4. A execução integrada **367**, filha da execução **366**, confirma esse término: status success, último nó Roteador — preparar próximo flow. Portanto success do n8n significa que a qualificação terminou, não que o orçamento foi calculado/enviado.
5. O dispatcher `JVZIPknnB7iIwcxi` está ativo e consome a fila persistente separadamente. Ele não supre a ligação ausente entre F1 e orçamento.

As versões publicadas de ingress, F1 e dispatcher coincidem com os respectivos drafts na inspeção. O nome “sem envio” não foi tomado como prova: conexões, parâmetros, RPC e execução foram conferidos.

## Quote Engine existente e interface

Workflow `3LlqxQwA5JZBoaZd`, CM-WF-030, atualizado em 06/10, não publicado, dois nós: Receive Quote Context → Run F2 Quote Kernel.

| Área | Contrato atual |
|---|---|
| Fatos | `facts.service_interest`, `event_date`, `locality`, `event_type` |
| Catálogo | `localities`, `locality_aliases`, `pricing_tiers`, `services`, `rule_set` |
| Contexto | `reference_date`, `same_event_date_time` |
| Saída | `status`, `locality_result`, `readiness`, `date_policy`, `quote_result`, `requested_actions`, `blockers` |
| Preços | `quote_result.totals` e `quote_result.customerVisible.pix/card` |
| Efeitos | Nenhum: ações solicitadas não executam persistência ou envio |

O jsCode do nó é **idêntico byte a byte** a `n8n/generated/f2-quote-kernel.generated.js` da branch `feat/phase1-integration-v1.2.1`, HEAD `9c17bcb226a30706ed5d2094452431592850597f`. O adapter identifica o código F2 de origem `4d4673c94ef9d382f7a01cdc87f36266d572cd29`.

O adapter social sempre passa por evaluateDatePolicy e calculateQuote: promoção social, combo e cartão social. Não há seleção de BR-002. A bifurcação corporativa deve ocorrer **depois da resolução/validação de localidade e serviço e antes da aplicação das regras sociais**.

A saída do F1 usa `context.facts.services/purpose/city/district`; exige mapeamento explícito para o contrato acima. Há ainda um alias de serviço a reconciliar: F1 `fotografo`, catálogo `fotografo_evento`. Não inventar equivalência de preço para esse alias.

## Persistência e componentes disponíveis

Projeto Supabase: `tsuuqcodmyuwqxfwevps` — Chatbot Clique Mais.

- Catálogo: 234 localidades, aliases, oito faixas, serviços e regras sociais versionadas. source_version atual é um identificador fase0, não a revisão Drive exata; o orçamento corporativo precisa registrar a origem/revisão efetivamente consultada.
- RPC cm_quote_flow1_apply_v1: advisory lock por remetente, evento idempotente por mensagem, histórico de fatos, conflitos pendentes, contexto persistente e checagem de human_handoffs.
- Essa RPC admite somente os fatos já acordados; não admite atualmente dias, períodos, lista de datas ou intervalo corporativo. Exceto services, exige string. Enviar números/arrays novos sem adequar o contrato causará rejeição.
- Reutilizar core.sessions.context e business.event_facts para os novos fatos; business.quotes.pricing_snapshot comporta o detalhamento corporativo. Não há necessidade demonstrada de criar tabelas.
- Fila public.cmc_test_outbound_queue: unicidade por idempotency_key e por evento/sequence_no; limite de tentativas; constraints fixam remetente Meta TEST e destinatário autorizado.
- cmc_test_claim_outbound usa SKIP LOCKED e verifica handoff ativo por evento. Não encontrei na função uma checagem da janela Meta de 24h; essa pré-condição precisa ser assegurada antes do E2E.
- cmc_test_mark_outbound_sent registra confirmação Meta e espaça a sequência; o callback do ingress persiste sent/delivered/read/failed.
- Reset existente: workflow `xM4kkGHmZKVPCIKj` → cmc_reset_meta_test_session_v1. Escopo restrito ao telefone autorizado, preserva histórico e não altera agenda. Foi inspecionado, não executado.
- Estado lido da fila: 20 sent e 5 cancelled; nenhum pending/processing/failed. business.followups estava vazio.
- Há dois orçamentos TEST recentes com status presented e snapshots sociais. O mais recente tem origem em planilha homologada de 17/10 e consulta de disponibilidade registrada. Não foi encontrada uma chamada de cálculo/apresentação no grafo ativo do F1; não atribuir esses registros a uma conexão automática inexistente.

## Disponibilidade e apresentação

- public.cmc_agenda_reservas tem 17 linhas; **24/10/2026 mantém três reservas ativas**. Nenhuma reserva foi alterada.
- Sincronizador existente: `iExoGUJ4CgBTXcWP`, agenda Trello → Supabase, ativo, 15h/23h.
- Execução **5187**, 18/10/2026 18:00 UTC: success, Planejar sincronizacao não emitiu alterações.
- max(atualizado_em) das linhas é 16/10/2026 06:57:57.899 UTC. Isso não demonstra falha de sincronização: linhas sem mudança não recebem timestamp novo. Falta uma evidência persistente própria da última consulta bem-sucedida para uma política de frescor confiável.
- CM-WF-031 (`q1ac0eQAPGcyAimY`) existe, mas não é chamado pelo F1 e fixa availability_claim=preliminary. Não consulta agenda. Não deve ser ligado sem adaptar essa afirmação às três situações homologadas.
- O snapshot de um orçamento antigo contém escapes literais de quebra de linha. Testar o payload efetivamente composto/enfileirado, não apenas a aparência do arquivo JSON.
- Reutilizar o composer/presentation e estendê-los somente para dados corporativos: dias, períodos, horas, cartão, à vista, sinal e saldo; manter benefícios homologados e frase final aprovada.

## Componentes mais recentes e divergências

| Fonte | Estado observado | Tratamento |
|---|---|---|
| PR #23 c913e7e | BR-002 + 44 testes; não contém a biblioteca F2 completa nem exports atuais do F1 | Base da branch isolada de integração |
| phase1-integration 9c17bcb | Biblioteca F2 e kernel idêntico ao CM-WF-030 | Reutilizar seletivamente dependências e testes, sem merge global |
| event-purpose-taxonomy 7197933 | Taxonomia v1.0.2 e draft com classificação mais rica | Recuperar seletivamente no Turno 3; não presumir deploy |
| Runtime F1 de 16/10 | Classificador anterior, sem dias/períodos/múltiplas datas | Reconciliar com a taxonomia antes da qualificação corporativa |
| Runtime ingress/fila de 18/10 | Mais recente que os manifests básicos do PR #23 | Preservar; registrar versões e testar conexões reais |

A extração ativa pode classificar “aniversário da empresa” como aniversário, pois testa aniversário antes de empresarial. A taxonomia mais recente trata esse caso com prioridade maior para empresa. Não aplicar automaticamente a precificação social ou o brinde a esse caso.

## Testes e evidências

- GitHub Actions do HEAD do PR: [run 39172719356](https://github.com/clickmaiscabine/Click-Mais-Cabine/actions/runs/39172719356), job 117808960163, completed/success. Logs: 44 testes JavaScript, 44 pass, 0 fail; validação Python também aprovada.
- Reexecução local isolada, sem I/O externo: `node --test src/functions/corporate-pricing.test.cjs tests/f2/deterministic-library.test.mjs`.
- Resultado: **91 pass, 0 fail** = 44 BR-002 + 47 F2. Inclui preços, promoção social, combo, datas, localidade, idempotência e guards. Não representa teste ponta a ponta.
- Paridade: kernel CM-WF-030 = arquivo gerado no commit 9c17bcb, igualdade integral.
- Todas as consultas SQL desta inspeção foram SELECT. Não executados reset, RPC de ingestão, dispatcher, agenda, WhatsApp ou Trello.
- Evidência sanitizada com versões e contagens em `BR002_TURNO1_EVIDENCIAS.json`. Nenhum token, texto de cliente, telefone completo ou título de reserva foi incluído.

## Plano de menor impacto — Turno 2 e continuidade

1. Usar branch isolada a partir de c913e7e; esta branch recebe somente diagnóstico neste turno.
2. Recuperar seletivamente biblioteca F2 e testes verificados; preservar os arquivos sociais sem alteração de fórmula.
3. Acrescentar seleção determinística no adapter CM-WF-030: corporativo chama o único módulo BR-002; social conserva o kernel atual. Gerar o código n8n a partir das fontes, sem fórmula copiada manualmente em outro nó.
4. Usar lookup existente localidade → pricing_tier.pix_base com origem/revisão verificável. Corporativo não recebe promoção social, acréscimo de cartão social ou brinde. Configurações sem política homologada devem bloquear/ir ao humano.
5. Adaptar saída ao contrato de QuoteResult, acrescentando o detalhe corporativo sem recalcular no compositor. Testar 8×3 faixas, múltiplos dias, centavos/overflow, ausência de fatos, serviço/localidade inválidos e isolamento de regras.
6. Nos Turnos 3–4, conectar o ponto **posterior à RPC de qualificação e anterior à apresentação/fila**, somente quando os fatos corporativos e todas as datas estiverem válidos. Adequar a RPC existente e seu contrato de fatos; não abrir novo banco ou workflow.
7. Consultar todas as datas; >=2 reservas ativas em qualquer data impede afirmar disponibilidade do período; falha/frescor incerto permite preço sem afirmação de disponibilidade. Não alterar as três reservas.
8. No Turno 5, conectar apresentação → persistência → fila existente, conferir janela Meta/human lock e executar E2E apenas no número autorizado, reutilizando reset quando necessário e sem nova mensagem manual salvo bloqueio demonstrado.

**Pendências:** ligação F1→motor→apresentação→fila; fatos corporativos e consistência de datas; critério/evidência de frescor; janela Meta; apresentação corporativa; E2E e regressão do atendimento completo. Nenhuma delas foi declarada concluída neste turno.

**Próxima ação recomendada:** iniciar o Turno 2 pelo adapter e seus testes isolados. Este relatório encerra o Turno 1, sem iniciar a implementação.

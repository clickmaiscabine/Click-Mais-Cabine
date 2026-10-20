# Click Mais — projeto de fechamento da etapa de orçamentos

Status: draft · versão 1.0 · 19/10/2026 · exclusivamente LAB

## 1. Resultado almejado

Um atendimento automático para festas e eventos empresariais que entende a solicitação, coleta somente os dados faltantes, calcula na regra homologada, verifica a agenda, envia a apresentação correta pelo WhatsApp TEST, preserva estado e auditoria e registra o acompanhamento no Trello LAB. Cada orçamento efetivamente enviado deve ter seu evento e cartão correlacionados, sem duplicatas.

Esta proposta aguarda a revisão do usuário. Nenhum código de execução, workflow, schema, cartão ou configuração operacional foi alterado durante a elaboração. A implementação só começa após “prossiga”.

## 2. O que a pesquisa resolveu

**O atendimento social já foi construído e testado.** As capturas, o orçamento `presented`, a fila histórica de textos/imagem e o cartão Trello corroboram esse trabalho. Ele não será refeito.

**O corporativo já percorreu o caminho real até a entrega.** O registro do PR #24 comprova ingresso 13783 → F1 13784 → dispatcher 13788 → callback `delivered`. Caso Cabine/Suzano, 01–03/11/2026, três dias, dois períodos/dia: cartão R$ 6.255,00; à vista R$ 5.129,10; sinal e saldo R$ 2.564,55. Os Turnos 3–5 estão concluídos no seu escopo corporativo; a etapa ampliada até Trello ainda exige integração.

**A lacuna atual é a conexão entre componentes.** O roteador social do F1 continua com `draft_only:true` e `auto_send:false`. As RPCs TEST corporativas exigem finalidade empresarial. O adaptador social existe dentro do Quote Engine, mas isso não comprova sua chamada automática pelo F1 publicado.

**O Trello já existe, mas o fechamento automático não está comprovado.** A leitura direta do board LAB encontrou CONTATO e ORÇAMENTO, com um cartão social em CONTATO contendo IDs de evento/orçamento. A consulta atual de `integrations.trello_projections` retornou zero linhas. O planner F6 existe no n8n, inativo/shadow, sem nó de mutação. Portanto “há cartão” e “há projeção automática atual” são afirmações distintas.

**Há uma divergência de estado a reconciliar.** A baseline e a ADR-0006 determinam nascimento do cartão em ORÇAMENTO, após `quote_sent`. O cartão histórico está em CONTATO. A correção deve usar EVENT_ID e mapping, preservando histórico e sem reabrir evento arquivado ou criar outro cartão por conveniência.

**Documentos históricos não serão tratados como inventário atual.** A branch `feat/graphify-auditoria-fase1` contém a TSK-144 de 17/10, que descreve ausência de dispatcher e de saída. Isso foi superado pelas evidências corporativas de 19/10. O manifesto também não prova sozinho que uma integração está ativa.

## 3. Base reconciliada e autoridade

- Repositório: https://github.com/clickmaiscabine/Click-Mais-Cabine
- PR de implementação: https://github.com/clickmaiscabine/Click-Mais-Cabine/pull/24 — rascunho.
- Branch: `feat/corporate-quote-lab-integration-20261018`.
- HEAD observado: `cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af`.
- Implementação corporativa: `170c34d6300207f0d72a143d597560eb169e3034`.
- BR-002/PR #23: `c913e7e51fc6ddcfc700b05b01fc198b92bf0e92`.
- Main observada: `047297d54d26620c73076d68ade3e55dcf29977b` — não alterada.
- Reuso Trello/F6: `e53c4fef2712605687dcdd7e25fa6205981962cb`.
- Auditoria histórica TSK-144: `d6f6e81b79b7a63ff402a5a630016df193e81140`.

Autoridade: decisão humana registrada → ADR homologada → baseline → schema/contrato → arquitetura → manifesto → implementação. Conferidos AGENTS, baseline v1.1, registro de decisões/DEC-017, arquitetura, contratos, relatórios e componentes efetivos. Os arquivos-fonte atuais possuem hashes no JSON do mapa. Versões n8n são registradas separadamente; nomes de workflows não são identidade suficiente.

Evidência de testes anterior: 404 JavaScript aprovados e guardas SQL com rollback; CI final 39297825958. Não foram reexecutados testes de runtime durante esta fase de planejamento e não há novos resultados de implementação a declarar.

## 4. Desenho funcional de menor impacto

1. Ingresso Meta TEST existente → F1 existente → fatos cumulativos e classificação social/empresarial.
2. Dados faltantes → compositor de pergunta → persistência/fila TEST → resposta ao cliente; nova mensagem retoma os fatos já conhecidos.
3. Dados prontos → contexto oficial + Quote Engine único: adaptador social preservado ou módulo BR-002 preservado.
4. Todas as datas → agenda Supabase com reservas ativas + reconciliação da fonte → preliminar, lotada ou desconhecida.
5. Apresentação adequada ao ramo → snapshot de orçamento e texto → fila TEST com guardas → envio → ACK e status disponíveis.
6. ACK comercial válido → `quote_sent`/`presented` → intenção recuperável de projeção → planner Trello existente → cartão LAB em ORÇAMENTO e mapping por EVENT_ID.
7. Resposta posterior → atualização de contexto/estágio permitido ou handoff humano → projeção de acompanhamento, sem reenviar orçamento idêntico.

A frase final aprovada permanece: “Gostaria de seguir com a tentativa de reserva para essa data?”. Ela só aparece quando os bloqueios de disponibilidade e de atendimento humano permitem, sem sugerir disponibilidade em data lotada.

O estado Supabase e as guardas humanas atravessam todo o percurso. Trello é projeção, não fonte de preço nem dono do estado. O envio e a escrita Trello não são uma transação distribuída: intenção persistida, idempotência, reconciliação e retry controlado cobrem a falha entre sistemas.

Fonte de preços preservada: https://drive.google.com/file/d/1ZkoS54blFcWQxC66OTnHuI9ZBu_ErFmH/view — revisão homologada `0B6VWt3lEydcWUFVOSTYrS0RESm9NRERaUUpBNzNMUm9IcG4wPQ`. Antes de executar, conferir eventual revisão posterior e sua homologação; não assumir nem adotar nova tarifa automaticamente.

## 5. Escopo e limites

Inclui: qualificação responsiva social/corporativa, dados conhecidos e correções, preço oficial, disponibilidade, apresentação/mídias homologadas, persistência, fila, confirmação de envio, cartão por evento, resposta e próxima ação rastreáveis. Cobrir os serviços e combinações já suportados automaticamente; exceções já homologadas para atendimento humano continuam nesse caminho. Não ampliar cobertura comercial por suposição.

Não inclui: contrato, pagamento, sinal recebido, criação de reserva real, GANHO sem seus gates, campanhas ou migração do board comercial de produção. A frase “gostaria” após o orçamento precisa ser reconhecida e encaminhada/registrada; não será tratada como autorização para reservar ou cobrar.

Follow-up: a F6 possui política social de um contato em +23h, sem desconto e com cancelamentos. O contrato corporativo atual tem `followupDelayHours:null`. Esta etapa registra acompanhamento e próxima ação; não ativa uma nova cadência corporativa nem transforma automaticamente a política social em regra empresarial. Uma futura ativação deve respeitar a regra homologada e a janela Meta efetiva.

## 6. Ordem de execução

Estimativa estrutural: **dois turnos de consolidação, 6 e 7**, divididos nos nove pacotes abaixo. São grupos de entrega, não promessa de duas mensagens ou prazo fixo. Depois da aprovação, o harness avança automaticamente entre pacotes autorizados, registrando cada gate. Falha de um cenário não interrompe atividades independentes.

### P0 — Fixar a base e comprovar isolamento · Turno 6

**Finalidade:** Preservar o que já funciona e impedir efeitos fora do LAB.

**Entrada:** aprovação desta proposta e leitura atual do ambiente.

**Ação:** Revalidar HEAD e mudanças posteriores; exportar versões efetivas; inventariar contratos, permissões e consumidores. Conferir número Meta, destinatário, board e listas por identificador. Registrar baseline de testes e plano de reversão.

**Reutilização:** PR #24, branch isolada, exports e checkpoint existentes.

**Gate de saída:** Diff revisável; versões e snapshots registrados; caminhos de envio e escrita restritos ao TEST/LAB; nenhum reset da sessão real nesta preparação.

**Evidência:** Commit-base, hashes, inventário de credenciais por referência sem segredos e relatório de isolamento.

### P1 — Completar a qualificação social automática · Turno 6

**Finalidade:** Fazer o social já construído percorrer o F1 atual, sem refazê-lo.

**Entrada:** P0.

**Ação:** Aproveitar o intake e a taxonomia existentes; completar o roteamento hoje draft_only. Consumir fatos persistidos, confirmar naturalmente o dado e perguntar apenas o próximo faltante. Manter conflitos, correções, mensagens fora de ordem e pedido de humano. Evitar saudações ou menus repetidos.

**Reutilização:** F1 ativo, flow1-social-intake/router e kernel cumulativo; avaliar o draft de intake por contrato, sem publicar sua cópia inteira.

**Gate de saída:** Social chega a ready; corporativo continua coletando dias/períodos/datas; apenas dados desconhecidos são solicitados.

**Evidência:** Conversas de fixture e replay com snapshots de fatos/procedência e pergunta pendente.

### P2 — Conectar prontidão, preços e agenda · Turno 6

**Finalidade:** Usar o mesmo Quote Engine com a política correta para cada evento.

**Entrada:** P1.

**Ação:** Estender de modo compatível os contratos TEST de contexto e prontidão que hoje exigem empresarial. Social chama seu adaptador já homologado; empresarial chama exclusivamente BR-002. Preservar localidade, revisão oficial e arredondamento. Reutilizar disponibilidade: consultar todas as datas, contar somente ativas e reconciliar a fonte da sincronização.

**Reutilização:** runQuoteEngine, runF2QuoteAdapter, corporate-pricing e reconciliação da agenda existentes.

**Gate de saída:** Paridade exata social antes/depois; exemplo BR-002 mantém valores; lotação de uma data bloqueia alegação do período; falha/divergência produz orçamento sem afirmar disponibilidade.

**Evidência:** Diff dos contratos, comparação de snapshots, valores em centavos e lista das datas consultadas.

### P3 — Conectar apresentação, estado e fila · Turno 6

**Finalidade:** Entregar a resposta comercial correta com rastreabilidade.

**Entrada:** P2.

**Ação:** Reutilizar apresentação social, mídias e compositor. Persistir versão do orçamento, texto e origem antes do envio. Generalizar o enqueue TEST de forma compatível, preservando janela Meta, locks, idempotência, cancelamento de versão antiga, ordem de mídias/textos e quarentena de envio incerto. Marcar presented/quote_sent somente com confirmação efetiva da API.

**Reutilização:** Compositor/apresentação/dispatcher existentes e public.cmc_test_outbound_queue.

**Gate de saída:** Sem preços da LLM; sem \n literal; inclusos/prova social oficiais; convite condicionado à disponibilidade e human_lock; sequência sem duplicatas; ACK e callbacks correlacionados.

**Evidência:** Snapshot persistido, fila, ID externo sanitizado, eventos e status sent/delivered/read disponíveis.

### P4 — Executar a projeção Trello LAB · Turno 6

**Finalidade:** Garantir acompanhamento de cada orçamento efetivamente enviado.

**Entrada:** P3.

**Ação:** Reaproveitar CM-WF-070 planner e guard de ações humanas. Vincular quote_sent a uma intenção persistente de projeção na infraestrutura existente, para recuperar falhas entre sistemas. Procurar mapping e EVENT_ID antes de criar. Gravar card_id, versão e hash somente após sucesso. Reconciliar o cartão histórico por seu EVENT_ID, sem reativar evento arquivado. Atualizar cartão do evento atual em ORÇAMENTO. Não mover em massa o board comercial real.

**Reutilização:** qr2WiKWr00oZMKbh, GKmiaRZAIf9O1Lni, integrations.trello_projections e estados canônicos.

**Gate de saída:** Um evento/um cartão; nenhum cartão antes de quote_sent; repetição vira no-op; falha Trello não reenvia WhatsApp; resultado incerto exige consulta/reconciliação antes de novo create. Nenhuma escrita fora do board LAB.

**Evidência:** Card e mapping correlacionados, projection_hash/version, histórico da operação e reprocessamento sem duplicação.

### P5 — Fechar o acompanhamento dentro desta etapa · Turno 6

**Finalidade:** Não perder a resposta do cliente após o orçamento.

**Entrada:** P4.

**Ação:** Tratar a próxima resposta sem repetir o orçamento. Aplicar transição canônica permitida ou encaminhamento humano e refletir no cartão. Projetar última interação e próxima ação quando previstas. Respeitar as listas LAB existentes: não fingir sincronização de estágio cuja lista não existe; registrar bloqueio e preparar lista mínima LAB para revisão no diff.

**Reutilização:** State Guard, handoff e contratos F6 existentes.

**Gate de saída:** Resposta pós-orçamento fica registrada e gera ação rastreável; human_lock impede saída comercial. Não cria reserva, contrato ou pagamento.

**Evidência:** Teste de resposta, transição/handoff e projeção correspondente. Follow-up automático corporativo não é ativado por inferência.

### P6 — Executar integração e regressão adversa · Turno 7

**Finalidade:** Comprovar que conectar o social e o Trello preservou o restante.

**Entrada:** P5.

**Ação:** Rodar testes existentes e novos testes de contratos/efeitos reais. Exercitar correção de data, duplicatas, fatos antigos, preços/extremos, disponibilidade preliminar/lotada/desconhecida, concorrência, locks, janela fechada, erro explícito e timeout incerto. Usar transações com rollback e replay identificado; conferir ausência de efeitos externos.

**Reutilização:** Suíte de 404 testes como referência histórica, cenários BR-002 e kernels F6.

**Gate de saída:** Zero regressões; novas invariantes verificadas em integração; contador de testes sozinho não fecha o gate.

**Evidência:** Comando, commit, resultados, cenários, executions e verificações de banco/fila/Trello.

### P7 — Homologar os dois percursos reais no Meta TEST · Turno 7

**Finalidade:** Demonstrar o objetivo de ponta a ponta, incluindo o cartão.

**Entrada:** P6.

**Ação:** Reutilizar a sessão e o único destinatário autorizado. Preservar evidências antes de reset; reset existente somente quando necessário ao cenário. Fazer social e empresarial percorrerem entrada autêntica, coleta, agenda, preço, apresentação, persistência, fila, ACK/callback e Trello. Não simular recebimento nem abertura da janela; se houver bloqueio real, pedir apenas a mensagem mínima indispensável.

**Reutilização:** Meta TEST, mecanismo de reset existente, dispatcher e board LAB.

**Gate de saída:** Dois percursos vinculados por session/event/quote/queue/card; entrega disponível conferida; contagens e conteúdos corretos. Não declarar delivered se o callback disponível disser apenas sent.

**Evidência:** Execuções reais e confirmação de envio/entrega; um cartão por evento; valores e texto entregue conferidos.

### P8 — Encerrar com evidências e retomada · Turno 7

**Finalidade:** Deixar a etapa auditável e pronta para decisão do responsável.

**Entrada:** P7.

**Ação:** Atualizar mapa, checkpoint, docs, versões e PR em rascunho. Publicar evidências sanitizadas, commits, resultados e riscos remanescentes. Registrar rollback por componente. Não fazer merge, promoção ou mudança na operação comercial.

**Reutilização:** PR #24 e padrão de evidência atual.

**Gate de saída:** Todos os critérios abaixo satisfeitos ou bloqueio explícito com próxima ação; produção preservada comprovada.

**Evidência:** Commits, CI, relatório final e checklist fechado.

## 7. Contratos a preservar e completar

| Ligação | Entrada confiável | Saída/garantia | Mudança mínima proposta |
|---|---|---|---|
| Ingresso → F1 | envelope autêntico, message_id, sessão e origem | fatos com procedência, pergunta pendente e versão | Não fabricar inbound/janela; reaproveitar normalização |
| F1 → prontidão | facts, propósito, serviço, datas, localidade, locks | ready / faltantes / conflito / humano | Habilitar o social com o mesmo cuidado do corporativo |
| Prontidão → motor | catálogo, revisão, reference_date e fatos persistidos | contrato atual com quote_result ou bloqueios | Preservar seleção única e cálculo determinístico |
| Agenda → apresentação | todas as datas, ativas, reconciliação da fonte | status por data e claim autorizado ou desconhecido | Compartilhar a mesma evidência; não inventar TTL |
| Composição → fila | quote/version, texto/mídia, origem e guardas | intenção persistida e ordenada | Estender contrato TEST compatível, não abrir produção |
| Dispatcher → estado | ACK API / erro definido / resultado incerto | presented e quote_sent apenas após confirmação | Não confundir sucesso n8n com envio/entrega |
| quote_sent → Trello | evento, quote apresentado, qualified_at e versões | uma projeção consistente por evento | Reusar planner e mapping; intenção recuperável e confirmação Trello |
| Trello → estado | ação humana autorizada, mapping e versão | comando validado ou rejeitado/reprojetado | Nunca adotar movimento manual como verdade sem guard |

As chaves exatas serão as já definidas nos contratos existentes; campos de intenção/retry eventualmente faltantes só serão adicionados após inspeção dos consumidores. Não se presume que o desenho acima seja uma migration pronta.

## 8. Matriz de aceite

| ID | Cenário | Resultado obrigatório | Prova mínima |
|---|---|---|---|
| A01 | Social completo em uma mensagem | Só dados desconhecidos; preço social sem alteração | Fatos, motor, apresentação e envio correlacionados |
| A02 | Social fragmentado, numérico e data corrigida | Confirmação natural; não repetir dados; quote antigo invalidado | Sequência de perguntas, versões e fila |
| A03 | Evento empresarial com dados completos/parciais | Dias, períodos e datas consistentes; BR-002 exata | Valores e snapshot de todas as datas |
| A04 | 0 e 1 reserva ativa | Disponibilidade preliminar | Consulta de cada data e reconciliação da fonte |
| A05 | Uma data com 2+ ativas no período | Sem afirmar disponibilidade e sem convite indevido | Texto + todas as datas; fixtures sem alterar reservas reais |
| A06 | Fonte falha, incompleta ou divergente | Orçamento normal; disponibilidade desconhecida | Falha controlada e mensagem entregue sem afirmação |
| A07 | Fonte consultada com sucesso, sem mudanças | Continua válida como evidência; não supor falha por ausência de alteração | Resultado da reconciliação bem-sucedida |
| A08 | Pedido de humano / lock antes ou durante a fila | Nenhuma saída comercial incompatível | Handoff, cancelamento/claim e ausência de envio |
| A09 | Duplicata, concorrência e input obsoleto | Um efeito por chave/versão; sem sobrescrever fatos novos | Invariantes DB, fila e card |
| A10 | Falha explícita e timeout incerto no Meta | Retry somente quando seguro; incerteza em quarentena | Tentativas e estados, sem reenvio cego |
| A11 | Janela Meta fechada | Bloqueio efetivo; sem consentimento ou janela simulados | Claim/erro disponível e próxima ação mínima |
| A12 | Texto/mídia/catálogo | Ordem e conteúdo homologados; quebras reais | Conteúdo entregue, sem barra invertida+n literal |
| A13 | Falha Trello após WhatsApp enviado | Recuperação do cartão sem reenviar orçamento | Intenção, retry/reconciliação, mapping e no-op |
| A14 | Create Trello com resultado incerto | Consultar EVENT_ID/mapping antes de novo create | Um cartão; incerteza rastreada |
| A15 | Cartão histórico e evento possivelmente arquivado | Preservar histórico; correlação por IDs; não reabrir automaticamente | Plano de reconciliação e resultado por evento |
| A16 | Nova resposta após orçamento | Sem segundo orçamento idêntico; estágio/handoff e acompanhamento | Evento de resposta, estado e card |
| A17 | Social real e empresarial real | Percurso completo com envio confirmado e cartão correto | IDs correlacionados, callbacks disponíveis e conteúdos |
| A18 | Preservação da produção | Main, WhatsApp comercial e reservas intactos | Diff/versões/contagens; três ativas em 24/10 preservadas |

No cenário social histórico, Pix R$ 1.300,00 e cartão R$ 1.540,00 são evidência daquele contexto/data de referência. Regressão deve comparar a mesma referência e regra; um teste atual não deve congelar promoções temporais de outro dia.

## 9. Riscos e respostas de implementação

| Achado/risco | Impacto | Resposta |
|---|---|---|
| Contratos TEST aceitam só empresarial | Ramo social pode parecer pronto sem enviar | Testar contexto, snapshot e enqueue antes de publicar |
| Nomes 070 repetidos para fila e Trello | Editar workflow errado | Identificar por runtime_id e versão, não pelo rótulo |
| Esquema compartilhado | Efeito involuntário fora do LAB | Migração compatível; guardas por origem/IDs; teste de consumidores |
| Card histórico sem mapping | Duplicata ou vínculo com evento errado | Buscar EVENT_ID; respeitar arquivamento; reconciliar por evento |
| LAB tem apenas CONTATO e ORÇAMENTO | Impossível refletir estágios posteriores corretamente | Preparar somente listas LAB necessárias; sem mapping silencioso para lista inadequada |
| Fluxos externos não são atômicos | Mensagem enviada, card ausente ou create duplicado | Intenção persistida, recuperação e consulta antes de retry incerto |
| Sessão real já contém orçamento corporativo | Reset pode apagar a trilha útil | Capturar evidência e usar reset existente apenas quando necessário |
| Atendimento comercial já bloqueado por humano | Resposta automática indevida | Revalidar lock na composição e no claim |
| Prazo de execução depende de Meta/Trello | Teste pode não terminar no mesmo turno | Declarar bloqueio observado; concluir partes independentes |

## 10. Checkpoint e rollback

Após aprovação, cada pacote registra: requisito → componente → diff → teste → execução/efeito → commit/versão → status → próxima ação. Usar estados canônicos `draft`, `development`, `review` etc.; critérios de teste separados do status do artefato. Atualizar o mapa quando a evidência mudar, sem promover uma ligação proposta a comprovada apenas porque o código existe.

Checkpoint proposto no repositório: estender o registro de implementação e adicionar o projeto/mapa sob `docs/07_projeto_executivo/` se não houver equivalente mais recente. O relatório, JSON e HTML desta revisão ainda estão fora da branch de execução.

Rollback: voltar versões LAB exportadas; desabilitar o novo caminho de projeção antes de reprocessar; restaurar somente configurações LAB alteradas; migrations compatíveis preferem correção para frente, sem apagar fatos/eventos. Cartões de teste ficam identificados e auditáveis; limpeza usa o mecanismo existente e apenas entidades TEST autorizadas. Nunca desfazer reservas reais nem restaurar banco inteiro.

## 11. Mapa no estilo Graphify

O HTML permite pesquisar, filtrar estado/relacionamento, selecionar nó, navegar por vizinhos e consultar fontes/tarefa. O JSON é a memória estruturada para continuidade. Comunidades são funcionais e curadas, não uma alegação de execução de Leiden. Não foi instalado nem executado o Graphify ou feito processamento AST/LLM externo deste repositório.

Dois eixos independentes evitam confundir existência com execução:

- **Estado:** comprovado, histórico, existente sem conexão, proposto.
- **Confiança da relação:** EXTRACTED (explícita), INFERRED (ligação proposta), AMBIGUOUS (sem prova suficiente).

O Graphify oficial inspirou a estrutura. Sua extração de código pode ser local, mas documentos/imagens podem usar backend semântico configurado; por isso a afirmação “100% local em qualquer modo” não foi adotada.

Verificação dos artefatos desta proposta: estrutura e referências conferidas; navegação/filtros executados em DOM simulado e mapa SVG renderizado. Não foi possível testar em navegador real neste ambiente. Esta verificação é do projeto/mapa, não uma nova validação da integração operacional.

## 12. Condição de encerramento

Encerrar quando festas e empresarial passarem pelo atendimento automático atual até o orçamento entregue e seu cartão LAB correlacionado, com agenda correta, estado persistido, fila íntegra, tratamento de respostas, guardas e regressão social comprovados. Não basta teste unitário, status success no n8n, cartão manual ou imagem de conversa isolada.

Depois disso, o responsável revisa as evidências. Merge e promoção para produção continuam exigindo autorização própria. Próxima ação agora: revisar esta proposta e dizer “prossiga” ou indicar ajustes.

## 13. Índice de fontes

- **S01** — [Baseline Funcional v1.1](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/docs/00_governanca/CLICK_MAIS_OS_BASELINE_FUNCIONAL_v1.1.md). 
- **S02** — [Decisões / DEC-017 / BR-002](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/docs/00_governanca/REGISTRO_DE_DECISOES.md). 
- **S03** — [Protocolo do repositório](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/AGENTS.md). 
- **S04** — [Checkpoint corporativo](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/docs/06_testes/BR002_HARNESS_STATUS.md). 
- **S05** — [Relatório E2E corporativo](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/docs/06_testes/BR002_TURNOS_3_5_IMPLEMENTACAO.md). 
- **S06** — [Evidências corporativas sanitizadas](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/docs/06_testes/BR002_TURNOS_3_5_EVIDENCIAS.json). 
- **S07** — [Roteador social: draft_only e auto_send=false](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/src/functions/flow1-social-router.n8n.js). 
- **S08** — [Adaptador social preservado](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/src/adapters/quote-social.mjs). 
- **S09** — [Seleção única das regras de preço](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/src/adapters/quote-engine.mjs). 
- **S10** — [Módulo monetário BR-002](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/src/functions/corporate-pricing.cjs). 
- **S11** — [Apresentação corporativa e disponibilidade](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/src/functions/corporate-presentation.mjs). 
- **S12** — [CRM canônico / cartão por evento](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/docs/architecture/TRELLO-CRM-V1.md). 
- **S13** — [Entrada do prospect e pipeline](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/cf1ef918dddf9f79cc7e42c76bbf7482abdbc9af/docs/decisions/ADR-0006_origem-lead-pipeline-comercial-v1.md). 
- **S14** — [F6 Trello / ações humanas / follow-up](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/e53c4fef2712605687dcdd7e25fa6205981962cb/docs/07_projeto_executivo/F6_TRELLO_FOLLOWUP_IMPLEMENTATION_v1.2.1.md). 
- **S15** — [Auditoria histórica TSK-144](https://github.com/clickmaiscabine/Click-Mais-Cabine/blob/d6f6e81b79b7a63ff402a5a630016df193e81140/docs/07_projeto_executivo/TSK-144/README.md). Snapshot de 17/10; declara lacunas que foram superadas pelo E2E corporativo de 19/10. Não é inventário atual.
- **S16** — [Board LAB consultado](https://trello.com/b/rBmu2kJC/labtest-click-mais-homologacao-fase-1). Leitura 19/10: listas CONTATO e ORÇAMENTO; um cartão social em CONTATO, com identificação do evento e orçamento na descrição.
- **S17** — [Supabase: projeções e agenda](https://supabase.com/dashboard/project/tsuuqcodmyuwqxfwevps). Consulta somente leitura em 19/10: integrations.trello_projections=0 linhas; 24/10/2026 mantém 3 reservas ativas. Sem dados pessoais exportados.
- **S18** — [Runtime n8n reconciliado](https://github.com/clickmaiscabine/Click-Mais-Cabine/pull/24). Leitura dos workflows efetivos em 19/10; versões registradas em runtime_versions. Trello 070/071 inativos e sem mutação; F1/engine/composer/dispatcher ativos.
- **S19** — Teste social anterior. Diálogo social, correção de data, mídia e orçamento enviados. Snapshot presented e fila enviada corroboram o teste. Não comprova que a ramificação automática atual esteja ligada.
- **S20** — [Graphify — arquitetura oficial v8](https://github.com/Graphify-Labs/graphify/blob/v8/ARCHITECTURE.md). Referência para nós, relações, procedência e graus de confiança. Este projeto não executou o Graphify.
- **S21** — [Graphify — segurança oficial](https://github.com/Graphify-Labs/graphify/blob/v8/SECURITY.md). Extração de código pode ser local; extração semântica pode utilizar backend configurado. Não houve upload do repositório a modelos externos para criar este mapa.

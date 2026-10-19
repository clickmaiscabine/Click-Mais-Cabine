# Changelog do Projeto — Click Mais OS

## 2026-10-19 — BR-002, qualificação, agenda e apresentação em LAB

- F1 corporativo cumulativo conectado ao motor existente, com todas as datas e reconciliação da agenda sem modificar reservas.
- Apresentação/compositor reutilizados; preços corporativos exatos, origem dos fatos, persistência, idempotência, fila e handoff BR-001 preservados.
- 404 testes JavaScript e guardas SQL em rollback aprovados; replays com serviços reais e um envio de validação Meta TEST confirmado (`sent`).
- E2E corporativo genuíno e confirmação `delivered`/`read` pendentes; PR em rascunho, sem promoção para produção. Ver `docs/06_testes/BR002_TURNOS_3_5_IMPLEMENTACAO.md`.

## 2026-10-18 — BR-002 integrada ao Quote Engine LAB (Turno 2)

- Atualizado somente o CM-WF-030 LAB existente, mantido não publicado e com dois nós.
- Seleção social/corporativa com reutilização do módulo BR-002; biblioteca F2 recuperada sem alteração.
- Lookup corporativo conferido com revisão oficial e hash; guardas para inconsistências e exceções.
- 242 testes locais aprovados e seis cenários no n8n, execução 7443; evidências versionadas.
- F1, apresentação, fila e E2E corporativos permanecem nos Turnos 3–5; produção preservada.

## 2026-10-18 — Precificação corporativa homologada (BR-002)

- Registrada DEC-017 e BR-002 para eventos corporativos: 1, 2 ou 3 períodos de 4h/dia; multiplicadores 1,0, 1,5 e 2,0; multiplicação pelo número de dias.
- Valor à vista empresarial = 82% do total do cartão, com sinal de 50%, sem aplicar cumulativamente a regra social Pix + 18%.
- Incluídos módulo determinístico `src/functions/corporate-pricing.cjs` e 36 testes `node:test` (36/36 aprovados no ambiente local).
- Somente branch de proposta: nenhuma alteração em n8n, Meta WhatsApp, Supabase ou produção.

## 2026-10-10 — Permissão do link OneDrive de entrega

- Registrada a decisão DEC-016: usar link padrão OneDrive “Anyone/qualquer pessoa com o link”, somente para visualização e com download permitido.
- O link será enviado ao cliente contratado pelo WhatsApp, sem exigir autenticação ou identificação por e-mail; o cliente pode repassá-lo, e qualquer pessoa que obtenha o link poderá acessar as fotos.
- A política de compartilhamento depende de a opção “Anyone” estar habilitada na conta OneDrive; o fluxo deverá reportar bloqueio de configuração, sem gerar um link com escopo diferente em silêncio.

## 2026-10-10 — Prazo da entrega pós-evento

- Registrada a decisão DEC-015: programar o envio do link canônico da pasta OneDrive para 12h do dia calendário seguinte à data da festa, no fuso America/Sao_Paulo.
- O envio depende de a pasta estar pronta e vinculada ao evento; publicação social permanece separada da entrega do cliente.
- A decisão detalha a ADR-0004 e deverá ser incorporada à especificação do CM-WF-140; ainda não representa workflow n8n executável.

## 2026-10-10 — Ambiente Meta / WhatsApp de teste

- Registrada configuração concluída conforme declaração de Regis e documento de 09/10/2026.
- Adicionados inventário, evidências relatadas, referência visual sanitizada e handoff seguro do token com Hermes.
- Atualizadas referências antigas de standby em README, PROJECT, ARCHITECTURE, manifesto e status das integrações.
- Sinalizadas divergência do Business Portfolio ID e contagem incompatível de destinatários/vagas.
- Nenhum segredo versionado; nenhuma mudança em Meta, n8n, Supabase ou número real; produção não homologada.

## 2026-10-05 — Baseline Funcional v1.1

### Adicionado
- estrutura documental numerada para a fase de Projeto Executivo;
- baseline funcional homologada;
- registro numerado de decisões;
- formalização da origem por landing pages;
- marco de qualificação do lead em orçamento enviado;
- novo pipeline Trello Comercial;
- separação explícita entre estado atual e coorte histórica;
- regra de remarketing baseada no Supabase;
- ADR-0006.

### Alterado
- Chatwoot deixa de ser opcional no caminho V1 e passa a ficar fora do projeto V1;
- criação de card Trello deixa de ocorrer no primeiro customer_event e passa a ocorrer após orçamento enviado;
- ordem comercial passa a ser:
  ORÇAMENTO → RESPOSTA → FAC/DÚVIDAS → NEGOCIAÇÃO BOT/HUMANO → FECHAMENTO → GANHO/PERDIDO;
- definição de “venda” é deslocada para o processo comercial posterior ao orçamento.

### Preservado
- Supabase como fonte de verdade;
- n8n como orquestrador/executor;
- Trello como cockpit humano;
- JEV limitado a choices autorizadas;
- regras determinísticas para preço e políticas;
- human lock/handoff;
- auditoria;
- separação Trello Comercial × Trello Logística.

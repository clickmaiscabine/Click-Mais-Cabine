# Feature Specification: Envio de orçamento pelo WhatsApp

**Feature Branch**: feat/meta-1-envio-orcamento-whatsapp  
**Created**: 2026-10-11  
**Status**: review  
**Input**: Meta 1 — automatizar o envio de orçamentos pelo WhatsApp, em branch isolada, preservando a arquitetura existente e sem alterar produção.

## User Scenarios & Testing

### User Story 1 — Receber orçamento solicitado (Priority: P1)

Uma pessoa interessada em um serviço da Click Mais pede um orçamento pelo WhatsApp. Quando a intenção comercial, o evento, os serviços, a localidade e todos os dados exigidos por regras comerciais aprovadas estiverem claros, ela recebe pelo mesmo canal um resumo correto do orçamento e das condições autorizadas.

**Why this priority**: É o resultado central da Meta 1: reduzir o trabalho manual de preparar e encaminhar orçamentos sem perder precisão comercial.

**Independent Test**: Simular um pedido comercial completo com catálogo aprovado e destinatário de teste autorizado; verificar que uma única mensagem de orçamento é aceita pelo canal e que o histórico registra qual orçamento foi apresentado.

**Acceptance Scenarios**:

1. **Given** um pedido comercial identificado, um evento sem ambiguidade, dados completos e regras de preço aprovadas e vigentes, **When** o sistema prepara e envia o orçamento, **Then** a pessoa recebe uma mensagem com os serviços e valores autorizados e o envio é registrado como sucesso somente após a confirmação do provedor.
2. **Given** o orçamento foi aceito para envio pelo provedor, **When** a confirmação de envio é persistida, **Then** o evento comercial passa a orçamento apresentado e o Trello Comercial recebe a projeção prevista pela decisão homologada.
3. **Given** o provedor confirma a aceitação da mensagem, mas o status de entrega ainda não chegou, **When** o estado é atualizado, **Then** envio aceito e entrega/read continuam distinguíveis, sem afirmar que a pessoa leu a mensagem.

### User Story 2 — Tratar dados incompletos ou regra não aprovada (Priority: P1)

Uma pessoa pede orçamento, mas faltam dados necessários ou existe uma localidade, serviço, adicional, faixa de preço ou exceção sem regra aprovada. O sistema solicita apenas a informação faltante que puder ser resolvida com segurança ou transfere a situação para atendimento humano, sem estimar ou inventar valores.

**Why this priority**: Um orçamento incorreto pode comprometer a confiança e criar uma obrigação comercial indevida; bloquear com clareza é parte essencial do envio automático.

**Independent Test**: Executar casos com cidade não reconhecida, regra de preço ausente, dados conflitantes e serviço que exige avaliação humana; verificar que nenhum valor é enviado e que o motivo do bloqueio fica rastreável.

**Acceptance Scenarios**:

1. **Given** um dado obrigatório ausente, **When** o pedido é avaliado, **Then** o sistema pede esse dado sem repetir perguntas já respondidas.
2. **Given** o preço ou atendimento depende de uma decisão não homologada, **When** o pedido é avaliado, **Then** nenhum valor é enviado e a conversa segue para revisão humana.
3. **Given** fatos conflitantes ou mais de um evento possível para o mesmo contato, **When** o pedido é avaliado, **Then** o sistema não associa nem envia orçamento para um evento por suposição.

### User Story 3 — Evitar duplicidade e preservar o histórico (Priority: P2)

A responsável pela operação precisa confiar que uma repetição de webhook, replay ou falha técnica não envie novamente o mesmo orçamento nem marque como apresentado algo que não foi confirmado pelo provedor.

**Why this priority**: A automação precisa ser segura diante de reentregas e falhas parciais, preservando o histórico comercial canônico.

**Independent Test**: Repetir a mesma mensagem de entrada e simular respostas de sucesso, rejeição e timeout do provedor; verificar um único envio confirmado, estado coerente e trilha de auditoria.

**Acceptance Scenarios**:

1. **Given** a mesma entrada já processada para a mesma versão do orçamento, **When** ela chega novamente, **Then** o sistema não cria um segundo envio.
2. **Given** o provedor rejeita a mensagem, **When** a tentativa termina, **Then** o orçamento não é marcado como apresentado nem cria card no Trello Comercial.
3. **Given** ocorre timeout depois que a solicitação pode ter chegado ao provedor, **When** a resposta é ambígua, **Then** o sistema reconcilia o estado ou solicita revisão antes de tentar novamente.
4. **Given** um orçamento anterior precisa de correção, **When** uma nova versão é preparada, **Then** a versão anterior permanece no histórico e não é sobrescrita silenciosamente.

### Edge Cases

- A janela de atendimento do WhatsApp expirou ou o tipo de mensagem exige um template aprovado que ainda não foi configurado.
- O contato está em human_lock ou foi encaminhado a atendimento humano.
- A entrada veio de familiar, fornecedor, banco, notificação ou mensagem sem intenção comercial.
- A mensagem é repetida, chega fora de ordem ou não possui identificador correlacionável.
- A Meta aceita o pedido, mas o n8n falha antes de persistir a confirmação.
- A gravação do orçamento tem sucesso, mas a projeção no Trello falha.
- A data, a localidade, o serviço ou a regra comercial mudou entre o cálculo e o envio.
- O contato possui eventos distintos em aberto e não há evidência suficiente para escolher um deles.

## Requirements

### Functional Requirements

- **FR-001**: O fluxo só pode receber pedidos já identificados como comerciais pelo gate de entrada existente; uma mensagem recebida, isoladamente, não cria lead nem orçamento.
- **FR-002**: O sistema MUST associar o pedido ao contato e ao evento corretos, aproveitando fatos conhecidos e sua procedência; não deve pedir novamente informação já registrada como válida.
- **FR-003**: Antes de calcular ou apresentar um orçamento, o sistema MUST validar a completude dos fatos exigidos para o serviço e as regras comerciais correspondentes.
- **FR-004**: O valor, descontos, combos, adicionais, formas de pagamento e condições MUST vir de uma fonte canônica aprovada e vigente, por cálculo determinístico. Um modelo de linguagem não pode definir ou corrigir esses valores.
- **FR-005**: A apresentação ao cliente MUST conter apenas serviços, preços e condições autorizados para aquele evento; faixas e campos internos não podem ser expostos.
- **FR-006**: Falta de preço aprovado, localidade incerta, serviço não catalogado, fato conflitante ou exceção comercial MUST bloquear o envio automático e produzir pedido de esclarecimento seguro ou handoff humano.
- **FR-007**: O envio MUST usar o transporte oficial Meta WhatsApp já escolhido pelo projeto e cumprir as regras atuais de janela de atendimento, templates aprovados e elegibilidade do destinatário. Fora das condições permitidas, o sistema não deve tentar enviar texto livre.
- **FR-008**: Human lock, decisão humana pendente ou guardrail que negue a ação MUST impedir o envio automático.
- **FR-009**: Cada orçamento e sua tentativa de envio MUST ter correlação e idempotência suficientes para impedir uma segunda mensagem causada por reentrega, retry ou replay da mesma entrada.
- **FR-010**: O orçamento só pode ser marcado como apresentado e gerar o evento quote_sent depois de a Meta aceitar a solicitação de envio. Aceitação pelo provedor, entrega e leitura são estados distintos.
- **FR-011**: Uma rejeição ou resultado ambíguo MUST permanecer como falha ou pendência de reconciliação; não pode avançar o ciclo comercial nem criar card comercial como se o envio tivesse ocorrido.
- **FR-012**: Após envio confirmado, o sistema MUST registrar o evento comercial correspondente e solicitar a projeção do card para a lista ORÇAMENTO. Uma falha na projeção do Trello não deve disparar novamente a mensagem.
- **FR-013**: O registro de auditoria MUST permitir rastrear a entrada, contato/evento, versão e fonte do orçamento, workflow, resultado do provedor e ação final, sem incluir tokens ou segredos.
- **FR-014**: A homologação inicial MUST usar exclusivamente destinatário(s) autorizados de teste, com envio de produção desabilitado. A ativação em produção depende de homologação própria, fora desta etapa de especificação.
- **FR-015**: A automação cobre a resposta ao pedido de orçamento. Follow-ups, remarketing, contratos, pagamentos, logística, pós-evento e mudanças nos quadros de logística não fazem parte desta feature.

### Key Entities

- **Contato**: pessoa associada ao número/canal e à classificação comercial existente.
- **Evento do cliente**: evento persistente ao qual se vinculam data, localidade, serviços e fatos com procedência.
- **Orçamento**: versão dos valores e condições calculados a partir de regras aprovadas para um evento.
- **Tentativa de envio**: registro correlacionável do pedido de envio e do resultado informado pela Meta.
- **Projeção comercial**: representação humana no Trello Comercial após orçamento efetivamente apresentado.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos cenários de teste com dados completos e fonte de preço homologada produzem no máximo um envio confirmado por orçamento e versão.
- **SC-002**: 100% dos cenários com preço, localidade, serviço ou fato não aprovado são bloqueados sem apresentar valor comercial.
- **SC-003**: 100% das tentativas rejeitadas ou ambíguas permanecem sem estado de orçamento apresentado e sem criação prematura de card comercial.
- **SC-004**: 100% dos envios de teste podem ser relacionados a uma entrada, um evento, uma versão de orçamento e uma resposta da Meta por identificadores de auditoria.
- **SC-005**: Nenhuma validação desta Meta 1 ativa workflow ou envio para número de cliente em produção.

## Assumptions

- A entrada já passou pelo gate comercial definido na Baseline Funcional; a Meta 1 não automatiza o atendimento geral de todas as mensagens.
- A primeira apresentação é uma mensagem de texto no WhatsApp, seguindo o desenho de apresentação descrito no F4 em revisão; PDF, link de download ou documento anexado não são pressupostos desta versão.
- O envio acontece automaticamente quando dados, preço, guardrails e regras do canal permitem; exceções e human_lock seguem para revisão humana.
- Em 11/10/2026, por DEC-017, o responsável **homologou** os preços/localidades e regras de orçamento da planilha fonte (SHA-256 `80942ae22c307d9cdf31a9a82f458fce34c47b9ec0e576cfceaaa5c1f5bf96f3`); o YAML integral e XLSX permanecem protegidos no acervo interno/Notion, pois o GitHub é público. 233 localidades estão OK; Raposo Tavares permanece com revisão humana. Implementação exige importação protegida e testes de paridade antes do envio Meta TEST.
- Em 11/10/2026, por DEC-018, a **configuração da Meta TEST** foi homologada pelo responsável. Não foram homologados dispatch de orçamento E2E, credencial no runtime ou produção.
- O projeto mantém GitHub como fonte versionada, Supabase como estado operacional, n8n como orquestrador, Meta Cloud API como transporte oficial, JEV em escolhas limitadas, LLM apenas para linguagem e Trello como projeção humana.
- A branch de especificação parte do main homologado. PRs draft de F4 e integração da Fase 1 serão avaliados como referência, sem presumir que estejam incorporados ou aprovados.

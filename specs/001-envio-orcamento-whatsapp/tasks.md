# Tasks — Envio de orçamento pelo WhatsApp

**Spec**: specs/001-envio-orcamento-whatsapp/spec.md  
**Plan**: specs/001-envio-orcamento-whatsapp/plan.md  
**Status**: review; implementação ainda não iniciada  
**Regra de execução**: tasks de implementação só começam depois da revisão deste pacote. Nenhuma task autoriza ativar produção.

## Fase 0 — Revisão antes do código

- [ ] T001 Revisar a spec, o plano, as premissas de mensagem textual e a fronteira entre pedido de orçamento e atendimento geral.
- [ ] T002 Homologar uma fonte versionada para preço, localidade, serviços, adicionais, descontos e condições. Confrontar a planilha anexada, que declara faixas provisórias, sem promovê-la automaticamente a fonte oficial.
- [ ] T003 Revisar PR draft #10 (F4) e PR draft #18 (integração da Fase 1) contra o main atual; registrar quais artefatos podem ser reutilizados.
- [ ] T004 Resolver a colisão de responsabilidades/IDs: CM-WF-030 no main é business-rules-engine; CM-WF-030 no F4 é Quote Engine; CM-WF-031 de apresentação aparece apenas nas branches draft.
- [ ] T005 Confirmar contrato de envio com Meta: janela aplicável, uso de template aprovado quando necessário, destinatários de teste permitidos e correlação de resposta/webhook.
- [ ] T006 Fechar a decisão de envio automático após todas as validações versus necessidade de revisão humana prévia; manter human_lock e exceções sempre bloqueantes.

## Fase 1 — Contratos e dados

- [ ] T007 Mapear os contratos existentes de customer_event, event_facts, business.quotes, core.events, workflow_runs e Trello projection.
- [ ] T008 Especificar o contrato de entrada elegível para orçamento e os motivos tipados de bloqueio/handoff.
- [ ] T009 Especificar o contrato de tentativa de envio, estados de confirmação/ambiguidade, correlação e idempotência; decidir se exige schema/migration.
- [ ] T010 Especificar a mensagem customer-facing a partir dos campos aprovados, sem cálculo ou tier interno no compositor.
- [ ] T011 Atualizar manifesto e registro de decisão/ADR apenas se a reconciliação exigir mudança estrutural homologada.

## Fase 2 — Regras e proteção

- [ ] T012 Implementar ou reutilizar o validador determinístico de prontidão e cálculo, com versão da fonte aprovada e testes de paridade.
- [ ] T013 Implementar Guard para human_lock, conflito, campo ausente, regra vencida/não aprovada, destinatário inválido, allowlist e regra Meta de envio.
- [ ] T014 Implementar idempotência por entrada e versão do orçamento; definir reconciliação segura para timeout ambíguo.
- [ ] T015 Implementar auditoria mínima com referência ao evento, quote/version, workflow, tentativa e retorno Meta; excluir segredos e conteúdo desnecessário.

## Fase 3 — Workflow LAB

- [ ] T016 Desenhar e versionar workflow/subflows com IDs reconciliados, preservando fronteiras CM-WF de main e os contratos aprovados.
- [ ] T017 Criar snapshots n8n LAB inativos, runtime_enabled=false e sem credenciais incorporadas.
- [ ] T018 Integrar dispatch Meta apenas à credencial segura de TEST, com SEND_ENABLED=false por padrão e allowlist explícita.
- [ ] T019 Registrar quote_sent e promover o evento/Trello somente após confirmação do provedor; tratar projeção Trello como side effect independente.
- [ ] T020 Garantir que callbacks de status de mensagem não acionem fluxo de entrada comercial nem disparo duplicado.

## Fase 4 — Verificação e evidências

- [ ] T021 Cobrir cenários de preço aprovado, preço ausente, localidade não reconhecida, evento ambíguo, human_lock, falha Meta e template/janela inválidos.
- [ ] T022 Cobrir reentrega, replay, resposta duplicada, timeout após envio possível, falha de persistência e falha de projeção Trello.
- [ ] T023 Executar validação do repositório, schemas, CI, testes determinísticos e testes de contrato.
- [ ] T024 Executar E2E somente em Meta TEST depois de provar credencial instalada no n8n, destinatário autorizado e correlação da execução; registrar ids/horários com dados minimizados.
- [ ] T025 Entregar relatório de homologação LAB com os critérios SC-001 a SC-005 e riscos/pendências.

## Fase 5 — Gate separado de produção

- [ ] T026 Não ativar envio real nesta Meta 1 de especificação. Preparar plano de promoção e rollback, sem executá-lo.
- [ ] T027 Solicitar homologação explícita de preço, mensagens, controles, evidências LAB e impacto operacional antes de qualquer mudança de runtime ou envio a cliente real.

## Critério de conclusão da Meta 1

A etapa de implementação em LAB só estará pronta para revisão quando T002–T025 tiverem evidências rastreáveis, os critérios de sucesso da spec estiverem atendidos e o estado de produção permanecer sem alteração. A promoção para produção exige etapa e autorização próprias.

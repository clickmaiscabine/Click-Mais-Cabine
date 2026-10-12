# Plan — Envio de orçamento pelo WhatsApp

**Feature**: specs/001-envio-orcamento-whatsapp/spec.md  
**Branch base**: main, commit 047297d54d26620c73076d68ade3e55dcf29977b  
**Branch de trabalho**: feat/meta-1-envio-orcamento-whatsapp  
**Status**: review  
**Data**: 2026-10-11

## 1. Contexto auditado

- A Baseline Funcional v1.1 e o Registro de Decisões definem GitHub como fonte de artefatos, Supabase como estado canônico, n8n como orquestrador, Meta WhatsApp como transporte oficial e Trello como projeção operacional humana.
- No main, n8n/WORKFLOW-MANIFEST.json é um registro de workflows planejados; não há snapshots executáveis de envio. Os itens relevantes são CM-WF-000 (entrada), CM-WF-010 (identidade/contexto), CM-WF-020 (normalização de fatos), CM-WF-030 (regras comerciais), CM-WF-050 (guard), CM-WF-060 (compositor) e CM-WF-070 (guard/dispatch).
- O schema/migration atual já possui business.quotes com versão, estado, totais PIX/cartão, fonte e snapshot de preço, além de presented_at. Não há no main um contrato dedicado para tentativa de envio, resposta da Meta, identificador de mensagem, estado ambíguo ou idempotência de dispatch.
- Em 11/10/2026, DEC-017 homologou a planilha de preços e localidades; knowledge/pricing.md e knowledge/localities.md agora registram a versão/SHA e apontam à cópia integral privada (GitHub é público). knowledge/services.md continua draft quanto à descrição/duração de pacotes e deve bloquear promessas não catalogadas. Antes do dispatch, importar versão homologada em armazenamento protegido e executar testes de paridade.
- DEC-018 homologou a **configuração** Meta TEST por declaração do responsável; documentação preexistente registra Hello World. Ainda faltam validação de credencial no n8n, ciclo E2E de orçamento e correlação IDs/webhooks. Produção não está homologada. Testes somente com destinatários autorizados.
- PR draft #10 (F4) contém motor determinístico e apresentação de orçamento em LAB, mas sem persistência Supabase, envio Meta ou ativação. PR draft #18 reúne snapshots LAB da Fase 1 e declara SEND_ENABLED=false, zero credenciais no LAB e nenhum workflow ativo.
- Há divergência de IDs que deve ser resolvida antes de reutilizar F4: no main, CM-WF-030 é business-rules-engine; no F4, CM-WF-030 é Quote Engine e CM-WF-031 é Quote Presentation. Não importar esses IDs/artefatos por cópia ou merge sem reconciliação com o manifesto e as decisões vigentes.
- A raiz atual possui pipeline de validação documental, schemas, migrations e templates de teste, mas o main não contém testes de dispatch Meta nem execução comercial ativa.

## 2. Alinhamento arquitetural obrigatório

| Responsabilidade | Componente canônico | Limite para a Meta 1 |
|---|---|---|
| Estado atual, fatos, orçamento e histórico | Supabase | Continua sendo a fonte de verdade; não usar mensagem, Trello ou LLM como estado mestre. |
| Coordenação de entrada, validação e envio | n8n | O envio só ocorre depois das validações e do Guard; nenhum node de produção será ativado nesta etapa. |
| Cálculo comercial | Código determinístico + fonte de preço aprovada | Reutilizar o motor revisado se compatível; não duplicar regras nem inferir valores. |
| Decisão semântica | JEV, dentro de opções autorizadas | Pode classificar ambiguidade; não calcula preço nem autoriza exceção comercial. |
| Linguagem da mensagem | LLM compositor ou texto determinístico aprovado | Redige apenas com fatos e valores já validados. |
| Proteção da ação | Guard / human_lock | Pode bloquear; não deve haver caminho alternativo que contorne o bloqueio. |
| Transporte | Meta WhatsApp Cloud API | Usar credencial segura do n8n; nunca WhatsApp Web/Evolution ou chamada direta pela LLM. |
| Acompanhamento humano | Trello Comercial | Criar/projetar card somente após orçamento efetivamente aceito para envio e estado canônico gravado. |
| Artefatos desejados | GitHub | Fazer todas as mudanças na branch isolada e revisar diff antes de qualquer promoção. |

Chatwoot continua fora do escopo da V1. O quadro 3.1 - LOGISTICA não será alterado. Nenhuma decisão do main será substituída por uma branch draft sem nova decisão registrada.

## 3. Fluxo proposto

1. Receber uma mensagem comercial pelo ingresso Meta existente e preservar identificador de origem, contato, mensagem e correlação.
2. Resolver contato e evento. Se não houver evento único, dados suficientes ou intenção comercial inequívoca, pedir apenas o dado necessário ou criar handoff.
3. Normalizar e registrar fatos com sua fonte; consultar o estado canônico, fatos correntes, serviço, localidade e regras vigentes.
4. Avaliar prontidão comercial por código determinístico. Bloquear preço ausente, regra provisória, localidade incerta, serviço não catalogado, conflito, exceção sem autorização ou human_lock.
5. Preparar uma versão de orçamento em estado não apresentado, vinculada ao evento e à versão identificável da fonte comercial aprovada. Expor somente campos destinados ao cliente.
6. O Guard verifica destinatário, estado, teste/produção, janela/template Meta, idempotência e permissão de envio.
7. Registrar a intenção/tentativa de envio antes do side effect. Enviar pela Meta Cloud API somente em LAB e para destinatário allowlisted até homologação separada.
8. Se a Meta aceitar a solicitação, guardar o identificador retornado, registrar quote_sent, marcar orçamento como presented e solicitar atualização de lifecycle/Trello. Status delivered/read, quando disponíveis, permanecem eventos distintos.
9. Se houver rejeição, manter orçamento não apresentado e registrar motivo. Se houver timeout ambíguo depois do envio, não reenviar automaticamente; reconciliar antes de qualquer nova tentativa.
10. Uma falha posterior da projeção Trello deve gerar reconciliação/retry dessa projeção sem repetir a mensagem.

## 4. Contratos e dados

- Primeiro avaliar se os campos existentes de business.quotes e audit.workflow_runs bastam junto a core.events. Não alterar schema antes de revisar F1/F4 e confirmar o modelo vivo.
- Caso falte persistência de tentativa de envio, propor contrato e migration versionada com: quote_id/versão, chave de idempotência, destinatário referenciado sem excesso de PII, estado da tentativa, timestamp, integração/correlation id, id da mensagem do provedor quando disponível e razão de falha. A migration só entra em desenvolvimento depois de revisão e não é aplicada ao banco de produção nesta fase.
- Definir estados que distingam draft, tentativa pendente, aceito pelo provedor, rejeitado e resultado ambíguo; estado de entrega/read é adicional e não redefine quote_sent.
- A nova versão de preço deve preservar a versão anterior e guardar a fonte/snapshot usado. Não salvar token, segredo ou dado pessoal em GitHub, fixtures ou logs de texto bruto.
- O evento de sucesso deve acionar a projeção Trello segundo a decisão homologada de card somente após orçamento enviado. O Trello não confirma, calcula nem altera diretamente o estado canônico.

## 5. Reuso e compatibilidade do F4

- Revisar PR #10 e a integração draft #18 como artefatos de referência, não como base automática.
- Comparar schema, contratos, ids de workflow, estados e regras de negócio com o main vigente antes de selecionar código reutilizável.
- Resolver formalmente a colisão de CM-WF-030 antes de editar n8n/WORKFLOW-MANIFEST.json ou criar snapshots. A feature pode reaproveitar a apresentação F4, mas o dispatch deve permanecer na responsabilidade canônica de resposta/guard/dispatch.
- Revalidar os valores e regras do motor frente a uma fonte aprovada. Os valores e faixas da planilha ou branch F4 não ficam automaticamente homologados por existirem em arquivo ou teste.
- Se a revisão identificar que F4 contradiz decisão mais recente, prevalece a decisão registrada no main até uma nova decisão humana formal.

## 6. Segurança e operação

- Credencial Meta permanece no secret store do n8n; nenhum token é copiado para a branch, prompt, fixture ou relatório.
- O alvo LAB usa somente destinatários de teste confirmados e configuração segura. Não reutilizar dados reais de clientes nos testes.
- Aplicar as regras atuais de janela de atendimento e templates aprovados do WhatsApp; consultar a documentação oficial vigente antes de definir payload/categoria/template.
- Manter SEND_ENABLED=false por padrão e acrescentar allowlist de teste antes de qualquer dispatch de homologação.
- Não alterar variáveis, credenciais, webhooks, workflows ativos, banco ou VPS de produção. Um eventual teste real de produção exige homologação e autorização em etapa própria.
- Mensagens de entrada, status do provedor e notificações de entrega são tipos distintos; um status webhook não pode ser tratado como novo pedido de orçamento.

## 7. Plano de testes

1. Testes determinísticos para prontidão, preço, localidade, service/add-on, conflito, promoção e formato customer-facing com catálogo aprovado versionado.
2. Testes de contrato garantindo que o compositor não recalcula nem expõe tier interno e que o Guard bloqueia human_lock, fonte não homologada, destinatário fora da allowlist e janela/template inválido.
3. Testes de idempotência com webhook repetido, replay, timeout, rejeição, aceitação e falha ao persistir resposta do provedor.
4. Testes de transição assegurando que apenas quote_sent confirmado promove orçamento e card Trello; falha da projeção não repete a mensagem.
5. Replay com fixtures anonimizadas ou sintéticas, sem contato pessoal/familiar e sem mensagens reais cruas.
6. Teste E2E em Meta TEST somente após as credenciais do n8n, callback, destinatário permitido e correlação estarem comprovados. Registrar ids e horários sem segredo.
7. CI deve validar schemas, manifestos e ausência de credenciais; snapshots LAB devem permanecer inativos, runtime_enabled=false e sem credenciais embutidas.

## 8. Sequência de implementação proposta

1. Revisão deste pacote e confirmação das premissas comerciais.
2. Usar a fonte única de preço/localidade/serviços **já homologada** (DEC-017), com importação protegida e testes de paridade; conciliar PRs F4/Fase 1 com a arquitetura atual.
3. Fechamento dos contratos de entrada, quote, dispatch, idempotência, audit e eventos de retorno da Meta.
4. Testes dos contratos e regras determinísticas antes do workflow.
5. Implementação de snapshots somente LAB, mantendo produção desabilitada.
6. Replay e testes unitários/integração; depois E2E com número de teste autorizado.
7. Revisão de segurança, observabilidade e condições de homologação.
8. Encerrar esta Meta 1 com artefatos e evidências prontos para decisão. Ativação em produção é uma decisão e uma etapa separadas.

## 9. Gate antes do código

A implementação não deve começar enquanto não forem resolvidos ou aceitos como premissas: (a) a integração técnica segura da fonte comercial já homologada, com testes de paridade; (b) a colisão de IDs e o estado dos PRs F4/#10 e integração/#18; (c) a apresentação inicial como texto no WhatsApp e o envio automático apenas quando o Guard aprovar; (d) a elegibilidade Meta para a janela/template de envio. Este pacote não declara nenhuma dessas condições homologada.

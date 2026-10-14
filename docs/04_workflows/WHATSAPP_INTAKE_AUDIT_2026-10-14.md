# Auditoria e entrega do primeiro fluxo WhatsApp

- Status: review
- Data: 2026-10-14
- Base de referência: PR #19, commit `b157e8ee0ee840069cd0f4092346fd4378540e31`.
- Branch de implementação: `codex/whatsapp-intake-flow-20261014`.
- Decisões: DEC-017/018, ficha única e origem por evidência.
- Produção: nenhuma alteração. Nenhum envio WhatsApp ou novo teste manual solicitado.

## Correspondência entre manifesto e runtime

| Artefato | ID n8n | Estado observado | Correspondência |
|---|---|---|---|
| Manifesto em main | CM-WF-000 | `spec_only`, runtime desabilitado | Declara o papel do orquestrador, sem implementação executável em main |
| [LAB][F3] CM-WF-000 Ingress Orchestrator | 62B4rRjMHhuPqSOe | Inativo, kernel com snapshot | Implementação anterior na branch `feat/phase1-integration-v1.2.1`; não grava banco |
| [LAB][TESTE] Receber mensagem WhatsApp — classificação inicial | iIAtpaRgvtssABsB | Ativo; versão 4fbe99a0-38e6-484a-a30f-5d747f30de23 | Receiver Meta de teste e classificador. Antecessor parcial do CM-WF-000, sem ficha persistida |
| [LAB][INTAKE] CM-WF-000 — ficha cumulativa e próxima etapa | o1yr47lPPi3CIC1c | Inativo, 15 nós, sem Meta trigger | Implementação desta entrega; consome envelope e estado, retorna próxima etapa |

O receiver ativo foi preservado. A execução webhook 172, em 14/10/2026 às 05:59:07Z, foi lida e confirma normalização aceita com serviço Plataforma 360. Não há necessidade de repetir o teste de recebimento. A integração ao receiver não foi instalada nesta fase.

## Achados e correções

| Achado | Severidade | Tratamento |
|---|---|---|
| Receiver classifica, mas não lê/grava ficha | Alta | Kernel cumulativo + adapter transacional + duas funções SQL de DEV |
| Saída JEV do receiver perde mensagem/contexto | Alta | Novo fluxo preserva o envelope, snapshot e procedência até o commit |
| Apenas primeiro item do payload é reconhecido | Média | Normalização percorre entries/changes/messages e ignora callbacks de status |
| Negação de 360 e listas negativas incompletas | Alta | Respeita negação, remoção de interesse e “só”; “cabine ou totem” pede esclarecimento |
| Schema em main v1.1, banco vivo v1.2.1 | Alta | Quatro schemas e seis migrations F1 copiados da branch canônica existente, sem DDL remoto |
| Manifesto afirma bloqueio Meta para ingress | Média | Registro de evidência de teste e correspondência, mantendo promoção operacional bloqueada |
| Fact writer existente pode superseder sem confirmar conflito | Alta | Kernel preserva valor anterior e persiste candidatos conflitantes em metadata; confirmações explícitas liberam alteração |

A lista de migrations foi conferida pelo conector Supabase. As seis migrations F1 já existem no banco vivo. A migration de agenda de 12/10 também existe, mas não foi alterada nem importada nesta entrega: a etapa termina antes das consultas de disponibilidade/preço.

## Funcionamento entregue

1. Aceitar somente mensagens com identificador, remetente, número receptor e timestamp válidos.
2. Consultar sessão, contato, evento, fatos atuais, catálogo de localidades e human lock.
3. Extrair todos os dados presentes e aproveitar os anteriores. Nome de perfil não vira nome declarado.
4. Manter `service_interest`, `event_type`, `event_date` e `locality` como os quatro campos de prontidão.
5. Perguntar somente o primeiro ausente: serviço → finalidade → data → cidade. Nome, relação e origem não bloqueiam.
6. Interpretar combo no mesmo evento e encaminhar a regra `combo_second_main_discount` ao próximo módulo. Não calcula desconto/valor aqui; mais de dois serviços principais encaminha para humano.
7. Acumular fatos com procedência; conservar conflitos até confirmação explícita. JEV escolhe candidatos encontrados no texto, com confiança mínima 0,8. Não fornece preços, disponibilidade ou texto livre inventado.
8. Serializar commits por contato, travar sessão/evento, conferir versões e usar a constraint de idempotência de `core.events`, `business.record_event_fact` e `core.transition_session` existentes. O evento entra já com `customer_event_id`: a assinatura antiga de `core.record_event` não permite esse vínculo, e `core.events` deve continuar append-only. Não se concede UPDATE nessa tabela.
9. Recarregar estado e recalcular plano em conflito de versão, até três tentativas. Falha final deixa a execução bloqueada para revisão/reprocessamento; não registra sucesso fictício.
10. Retornar `QUOTE_CHECKS` quando a ficha estiver completa. Não chama contrato, logística, pós-evento, Trello ou dispatcher.

As chamadas externas dos testes n8n foram substituídas por pin data. A lógica interna executou de verdade e foi comparada com as fixtures geradas por transações reais no PostgreSQL isolado. Nenhum teste acionou Meta, OpenRouter ou gravação remota.

## Mapeamento de dados e consumidores

| Informação | Representação canônica | Consumidores |
|---|---|---|
| Produtos | `business.event_facts.service_interest` + `business.event_services` | Intake e futuro Quote Engine |
| Finalidade | fato `event_type` + `customer_events.event_type` | Intake/Quote Engine |
| Data | fato `event_date` + `customer_events.event_date` | Intake e futuras consultas de agenda |
| Localidade | fato `locality` + `customer_events.city` | Intake e futuro motor de localidades |
| Endereço informado | fato `venue_address` + `customer_events.venue_address` | Regra oficial de deslocamento, posteriormente |
| Nome declarado | fato `customer_name` + `contacts.display_name` | Personalização |
| Relação com a festa | fato `relationship_to_event` + `customer_events.metadata.relationship_to_event` | Personalização; não usar `contacts.relationship_type` para “mãe/noiva” |
| Origem declarada | fato `acquisition_source`; ausente retorna `unknown` | Atribuição por evidência |
| Sinais técnicos/referral | `core.events.payload.message_context.referral` | Evidência preservada; não adivinhar plataforma/campanha |
| Conflitos e revisão da ficha | `customer_events.metadata.quote_intake.{conflicts,version}` | Intake/controle de concorrência entre sessões do mesmo contato |
| Próxima ação já proposta | `sessions.context.quote_intake.last_action_key` | Supressão de propostas repetidas em shadow |

As chaves novas de metadata e de fatos usam os campos extensíveis existentes, documentados nesta tabela; nenhuma coluna ou estado comercial foi criado. `stage_version` continua com a semântica do ciclo comercial. A revisão da ficha usa metadata, para não interferir nas transições comerciais.

O código existente em outras branches permanece preservado. O planner F3 anterior e o Quote Engine podem consumir os fatos existentes; não foram mesclados nem ativados. O novo orchestrator faz o recorte de entrada até decisão desta etapa, sem redefinir o restante dos workflows.

## Limites e próximos gates

- **Operacional:** instalar `supabase/functions/quote_intake.sql` em banco DEV autorizado, conferir exposição backend do schema `business` na Data API e credencial Supabase. As RPCs não existem hoje no banco operacional; chamá-las sem instalação retorna `PERSISTENCE_BLOCKED`.
- **Operacional:** integrar o receiver somente depois de homologação. Não houve alteração do receiver ativo, merge do PR #19 ou publicação do novo fluxo.
- **Operacional:** antes de habilitar dispatch, revalidar a versão da ficha e usar confirmação real de envio. `last_action_key` nesta entrega representa proposta em shadow, nunca envio. Um envio futuro precisa seu próprio recibo/outbox; não tratar proposta como mensagem entregue.
- **Comercial:** faixas de distância provisórias continuam proibidas para envio. O intake não promove preços, homologações ou materiais antigos por inferência.
- **Comercial:** conferir templates de orçamento, itens inclusos e prova social no módulo de envio. Catálogos/fotos e mensagens complementares continuam pendentes de decisão.
- **Limite de extração:** datas sem ano, várias datas/cidades, serviços alternativos e outras ambiguidades pedem esclarecimento. Linguagem não reconhecida conserva estado e solicita o dado ausente, sem preencher por suposição.

## Evidências

- `npm run test:intake`: 17 testes aprovados, incluindo PostgreSQL durável com reabertura, concorrência, idempotência, histórico, permissões backend reais, rollback e schemas.
- `n8n/fixtures/intake/cases.json`: 15 cenários sintéticos; contatos e datas de banco são de teste.
- n8n execuções 174–188: 15 cenários aprovados; fatos, rota, pergunta, proposta e bloqueio de envio verificados, não apenas status da execução.
- Execução 189: falha 40001 força três releituras e `RETRY_EXHAUSTED`.
- Execução 190: RPC ausente resulta em `PERSISTENCE_BLOCKED`.
- SDK: 15 nós, validação sem erros/avisos após correção dos grupos.
- `n8n/tests/intake-evidence.json`: resultados verificáveis por caso.

Status final: **review — implementação e testes isolados concluídos; integração ao banco/receiver operacional ainda não promovida**.

Referências técnicas: [Supabase — Database functions](https://supabase.com/docs/guides/database/functions), [OpenRouter — Extraction without guessing](https://openrouter.ai/labs/jev/extract). O JEV é mockado nesta validação; não foi feita medição nova do provedor.

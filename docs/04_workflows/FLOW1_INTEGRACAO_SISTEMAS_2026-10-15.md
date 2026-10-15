# Flow 1 integrado — entrega técnica e portões de segurança

- Status: **development** (não homologado)
- Atualizado: 2026-10-15
- Repositório: `clickmaiscabine/Click-Mais-Cabine`
- PR de trabalho: #21 (rascunho), PR #19 preservado e não mesclado
- Workflow n8n **candidato inativo**: `3RAuwFaHIaZvOMjU`
- Workflow de recebimento da Meta **existente e não modificado**: `iIAtpaRgvtssABsB`
- Última regra de negócios: DEC-017 e `docs/01_negocio/REGRAS_DE_QUALIFICACAO.md` no PR #19

## Escopo efetivamente construído

### Supabase

**Instalado no banco existente** — duas migrations registradas e alinhadas à versão real do Supabase:

| Versão | Artefato | Função |
|---|---|---|
| `20261015174256` | `supabase/migrations/20261015174256_cm_quote_flow1_atomic_ingest_v1.sql` | RPC `public.cm_quote_flow1_apply_v1`: grava contatos, sessão, evento, mensagem e fatos, com transação e trava por remetente |
| `20261015175200` | `supabase/migrations/20261015175200_cm_quote_flow1_snapshot_v1.sql` | RPC `public.cm_quote_flow1_snapshot_v1`: consulta o estado antes de interpretar o próximo texto |

A função de escrita usa `pg_advisory_xact_lock` por remetente, `core.events.idempotency_key` para bloquear reprocessamento, `business.record_event_fact` com procedência e histórico, `business.event_services` para os serviços, `business.customer_events` e `core.sessions.context` para a ficha acumulada. O único fluxo autorizado ao gravador de pré-orçamento é `PRE_QUOTE`: eventos em outro estágio seguem rota operacional, sem sobrescrever fatos. Conflitos não substituem valores automaticamente e permanecem em `pending_conflicts` até confirmação.

**Política de acesso checada:** `anon=false`, `authenticated=false`, `service_role=true` para ambas as RPCs. O código não contém tokens e não expõe acesso público.

### Orquestrador n8n

Workflow inativo de **13 nós**, com entrada manual e entrada de WhatsApp Meta credenciada, normalização do payload, descarte de eventos sem mensagem válida, leitura do contexto no Supabase, classificação de todos os campos, fallback JEV 1.13 condicionado, gravação atômica no Supabase e preparação da etapa seguinte.

Credenciais existentes vinculadas: **WhatsApp OAuth account**, **OpenRouter account**, **Supabase account**. Nenhuma credencial nova foi criada; credenciais não foram copiadas para o GitHub.

```text
Manual (fixtures) ───────────┐
Meta WhatsApp (NÃO PUBLICADO)┼→ Normalizar → Validar mensagem
                            │                      │
                            └──────────────────────┘
                                    ↓
                         RPC de leitura Supabase
                                    ↓
                         Reconstituir ficha anterior
                                    ↓
                     Extrair serviços e outros dados
                                    ↓
                       Precisa interpretação JEV?
                            ↙                 ↘
                    JEV 1.13                Não
                       ↓                     │
                Guard / confiança ≥ 0,80     │
                            ↘               ↙
                             RPC de escrita atômica
                                     ↓
                           Rota da ficha atual
                    ↓ serviço / finalidade / data / local
                               ↓ suficiente
                          FLOW_5_READY
```

As saídas `FLOW_1_SERVICE`, `FLOW_2_PURPOSE`, `FLOW_3_DATE`, `FLOW_4_LOCALITY`, `FLOW_5_READY`, `CLARIFY_CONFLICT`, `DUPLICATE_NOOP`, `HUMAN_LOCK_NO_REPLY` e rotas operacionais são campos estruturados no retorno. O roteador compõe **rascunhos**, mas não chama ainda workflows comerciais posteriores nem envia WhatsApp.

### JEV

A interpretação via OpenRouter/JEV só ocorre quando a extração determinística não identifica serviço e a mensagem pode conter linguagem semântica. As opções são enumeradas e a confiança mínima aplicada é `0.80`. Uma dúvida entre equipamentos **não** é convertida em combo. O resultado aprovado complementa apenas o serviço; o JEV não calcula preço, disponibilidade ou distância. Há procedência `jev_semantic_choice` na evidência gerada.

## Evidência de validação

| Ambiente | Execução | Evidência |
|---|---|---|
| SQL (BEGIN/ROLLBACK) | local pelo conector Supabase | Criar ficha, detectar duplicidade, reter conflito, confirmar novo valor, selecionar próximo campo; rollback sem linhas duráveis |
| n8n laboratório anterior | #197 | 154 primeiras mensagens do corpus e 1 caso adicional sem erro técnico, regressões de data e escopo verificadas |
| n8n laboratório integrado | #198 | Mensagem com os quatro campos, caminho determinístico → RPC simulado → FLOW_5_READY |
| n8n laboratório integrado | #199 | Mensagem sem serviço explícito, JEV simulado → serviço → FLOW_2_PURPOSE |
| n8n laboratório integrado | #200 | Payload Meta de teste reconhecido; status sem texto descartado |
| n8n laboratório integrado | #201 | Comparação entre dois equipamentos sem acionar JEV indevidamente |
| n8n laboratório integrado | #202 | Escolha numérica do menu usando ficha restaurada → serviço identificado |
| n8n laboratório integrado | #203 | Data parcial na ficha mais ano informado em outra mensagem → data completa |

Os HTTP nodes foram **simulados por pin data** nas execuções n8n #198–203; isso verifica a estrutura, condições e transformação de itens, **não** autenticação de requisições reais, disponibilidade do endpoint OpenRouter nem gravação end-to-end via n8n. O teste SQL executou a função real dentro de uma transação revertida. O teste de corrida concorrente sob carga ainda não foi executado.

## Itens necessários antes da homologação / ativação

1. Executar um teste controlado de HTTP n8n → RPC Supabase com a credencial existente; confirmar que a chave usada é de serviço e respeita as permissões.
2. Executar chamada real controlada ao JEV OpenRouter, com controle de custo e tratamento de falha sem deduções automáticas.
3. Medir cobertura **semântica**, não só sucesso técnico, de todos os 164 IDs; executar os 10 roteiros completos com persistência durável isolada, incluindo mensagens em concorrência e repetição real de webhook.
4. Confirmar os identificadores de CTAs realmente rastreáveis e seu mapeamento para serviços/landing pages antes de atribuição automática de origem.
5. Completar a cobertura opcional de nome do homenageado, nome de salão e endereço em linguagem livre. Dados básicos e nome explícito já têm tratamento; não declarar extração universal.
6. Decidir mecanismo final de composição e confirmação de **uma única** saudação enviada e de perguntas sem duplicidade após confirmação de entrega; nesta fase são apenas rascunhos.
7. Implementar/ligar os módulos seguintes (Flows 2–7) como workflows separados antes de anunciar encaminhamento externo ou orçamento automático.
8. Validar coexistência com o webhook Meta já ativo; **não publicar dois triggers concorrentes** apontando para a mesma inscrição. Migrar apenas após homologação e plano de reversão.
9. Nenhum envio automático a clientes, alteração de configuração da Meta, publicação do novo workflow ou merge no GitHub sem homologação.

## Observações de governança

O Supabase recebeu somente os dois novos artefatos DDL e permissões associadas; **nenhum disparo real a clientes** ocorreu. O novo workflow n8n foi criado na área **Personal** existente e permanece inativo. O laboratório anterior e o gatilho Meta que já funcionava não foram alterados. O PR #19 continua rascunho e independente. O código de produção está versionado, mas o status funcional permanece development.

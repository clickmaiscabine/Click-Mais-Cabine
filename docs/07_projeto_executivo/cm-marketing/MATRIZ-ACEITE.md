# Matriz finita de aceite
Status: review
Versão: 1.1.0 — preenchida em 2026-11-23 com a execução local

Preencher somente estes caminhos reais. Acrescentar teste apenas por regra aprovada ou falha concreta nova. Não usar contagens históricas como prova do cron novo.

| Automação | Resultado obrigatório e regra | Fonte concreta | Identidade e período | Esperado | Observado | Evidência | Versão | Decisão |
|---|---|---|---|---|---|---|---|---|
| Executor | Credenciais disponíveis no processo agendado | adaptador `adaptador_marketing.py` → `codex exec` (stdin, `-s workspace-write`) no venv do Hermes | perfil `cm-marketing`; conta ChatGPT do proprietário; 23/11/2026 | leitura real no contexto do cron | executado sem interface: 176 s, 30.347 tokens, `codex-cli 0.147.0`, `rc=0`; gravou `report.json` e `resumo.md` | `recibo.json` + `codex_saida.log` na inbox privada | 1.0.0 | **verificado** |
| Ads | métricas, unidade, status e destino por campanha | Google Ads API | customer_id autorizado; 16–22/11/2026 | relatório reproduzível | **bloqueado**: sem credencial/API local (`~/.google-ads.yaml` ausente, sem ADC, sem chave). Gasto, cliques, conversões e saldo permanecem `null`; os únicos dados vêm dos e-mails (saldo baixo em 19/11; pagamento em 16/11; ajuste de 2,9% com vigência em 01/01/2027) | `report.json` → `source_status.google_ads = blocked` (privado) | 1.0.0 | **bloqueado** (provisionamento) |
| Wix | tráfego e contato no site correto | Analytics Data API + HTTP público | `www.clickmaiscabine.com`; 23/11/2026 | sessões, visitantes, cliques e formulários | **parcial**: `/` e `/clickmais-360` responderam 200 com CTA; `/cabine-ia`, `/orcamento`, `/contato` e `/servicos` responderam **404**; sessões, visitantes e cliques de contato `null` por ausência de chave | `coleta_site.json` (privado) | 1.0.0 | **parcial** |
| Avisos | alerta com vigência e ação, sem falso atual | caixas `clickmaiscabine@gmail.com` e `regisdanton1@gmail.com` | 16–22/11/2026 | aviso classificado e deduplicado | **verificado**: 4 avisos no período (2 Ads, 1 recibo do Google Payments, 1 política com vigência 01/01/2027), deduplicados por `message_id`; o alerta de saldo está na caixa **pessoal**, não na corporativa | `report.json` → `evidence` (privado) | 1.0.0 | **verificado** |
| Entrega | produced → received/accepted por ack | gerente `cm-marketing` na inbox privada | `request_id marketing\|clickmais\|2026-11-23` | gerente acusa e registra próximo passo | **verificado**: `produced` → `received` com `ack_ref ACK-20261123-8ffd6f9f`, `recebido_em 2026-11-23T08:56:22-03:00` e `report_sha256` conferido | `recibo.json` + `ack.json` (privado) | 1.0.0 | **verificado** |
| Conteúdo | uma peça adaptada às três redes | fila editorial própria + peça do dia do executor | `content_id` interno; 23/11/2026 | rascunhos úteis com CTA | **verificado (rascunho)**: sete peças temáticas em `draft` e a peça do dia entregue em `instagram`, `facebook` e `tiktok`, com `post_url: null` | `content/PECAS-7-DIAS.md` e `report.content` | 1.0.0 | **verificado** |
| Publicação | post no canal certo sem duplicação | API/painel oficial do canal conectado | — | URL e recibo verificados | **bloqueado por canal**: Instagram e Facebook sem conta profissional/token nesta instalação; TikTok sem app aprovado na Content Posting API. Nenhuma peça publicada | declaração no relatório privado | 1.0.0 | **expansão por canal** |

O núcleo diário pode operar com cobertura parcial explícita. Sua homologação local exige a primeira cadeia completa request → consulta → relatório → ack e um único agendamento ativo. Publicação é homologada por canal e não bloqueia consultas ou rascunhos. Não criar nova homologação do aplicativo Cabine IA.

## Registro da execução de 23/11/2026

- Cadeia completa executada: `request.json` → coleta de e-mail e site → `codex exec` → `report.json`/`resumo.md` → validação → `recibo.json` → ack do gerente.
- Estado final da entrega: **received** (`ACK-20261123-8ffd6f9f`).
- Agendamento: job local `082c5df585e3` criado **pausado**; o agendamento provisório em nuvem segue ativo até 31/12. Um único dispatcher produtivo — o passo de transição está registrado no documento privado de implantação.
- Nada foi alterado em contratos, Trello, Processados, gatilhos ou posição de cartões; Radar preservado.

## Extensão Jornada Comercial (DEC-019)

Execução de 23/11/2026 sobre `JORNADA-COMERCIAL.md`. Saída analítica privada, fora do Git: `journey.json`
(válido contra `journey.schema.json`), relatório visual e `ack-jornada.json`.

| Item de aceite | Resultado | Evidência |
|---|---|---|
| Vínculo real orçamento ↔ contrato | **confirmado** | dois grupos por telefone + data, R$ 1.490 (28/06/2025) e R$ 900 (07/12/2023) |
| Duplicatas/importações não viram aquisição nova | **confirmado** | 11 grupos com mais de dois cartões contados uma vez; 8 cartões do mesmo evento em 19/12/2026 |
| Contrato enviado ≠ assinado; vencimento ≠ liquidação | **separado** | `contract_recorded` (5) sem `contract_signed`; livro financeiro só com data bancária |
| Uma duração calculável e uma bloqueada | **confirmado** | contrato → evento 8 dias; contato → evento mediana 29 (19 casos); recebimento bloqueado |
| Estado dos cartões preservado | **confirmado** | apenas `GET`; nenhum movimento ou arquivamento |
| Arquivo analítico privado | **emitido** | `journey.json` com 87 oportunidades e agregados `null` por falta de denominador |

Recebimento: `ACK JORNADA-20261123-0ee4edc8`, sha256 revisado `0ee4edc8…`; a revisão posterior altera
apenas o bloco `delivery` e o delta fica registrado no recibo privado.

Bloqueios declarados: Ads sem credencial, Wix sem chave, Autentique não consultado, livro financeiro com
dois meses, acervo do WhatsApp posterior aos eventos históricos. Nenhum indicador foi preenchido sem base.


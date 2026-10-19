# BR-002 — Turnos 3–5 em LAB

Status: review

## Resultado e limite da entrega

Turnos 3, 4 e 5 tecnicamente concluídos em LAB. Em 19/10/2026, às 14h47 (America/Sao_Paulo), uma mensagem corporativa autêntica do destinatário autorizado percorreu Meta TEST → F1 → todas as datas/agenda → Quote Engine BR-002 → apresentação → Supabase → fila → Meta TEST. A entrega foi confirmada por callback `delivered` e conferida na captura de tela enviada pelo usuário. O bloqueio de entrada autêntica registrado no checkpoint anterior foi resolvido. Replay não criou consentimento, entrada Meta ou janela de atendimento.

Base reconciliada: PR #24 em rascunho, `475a16c48f59eb03949a2f81fdf618d9c848b8f8`, seguida do checkpoint `1271c2a7c8a75b0158bf6851cb4a55ff47bf2c3d`. PR #23 permaneceu em `c913e7e`. Taxonomia v1.0.2 e 111 casos recuperados da evolução canônica `71979337f33eaf6c8251faeaa5b17fdd11cc339e`, sem reconstruir o projeto.

## Turno 3 — qualificação

- F1 existente recebeu reconhecimento empresarial e coleta cumulativa de serviço, finalidade, dias, períodos, datas e localidade. “Aniversário da empresa” prevalece sobre aniversário pessoal.
- Respostas numéricas só preenchem a pergunta corporativa persistida. Datas parciais são acumuladas; conflitos exigem confirmação; dados conhecidos não são perguntados novamente.
- A confirmação do dado e a próxima pergunta usam a mesma mensagem. Seis execuções sequenciais reais do F1 (8386, 8388, 8389, 8390, 8392, 8393) percorreram dias → períodos → datas parciais → datas restantes → localidade → orçamento. Todas tinham origem explícita `lab_replay`, sem disparo.
- LLM restrita à ambiguidade semântica já existente. Pedido explícito de humano evita JEV. Números e preços não passam por cálculo de LLM.
- BR-001 materializada em `business.human_handoffs` para pedido explícito, configuração especial e exceções do motor. Contexto e auditoria preservados; bloqueio ativo suprime mensagem comercial e cancela fila incompatível.

## Turno 4 — agenda e persistência

O contexto do Quote Engine é carregado do Supabase para a sessão TEST autorizada e seu evento/input atual. Todas as datas são consultadas em `public.cmc_agenda_reservas`, apenas `status='ativa'`.

Para comprovar frescor sem inventar prazo comercial, o F1 lê a lista Trello da sincronização existente e compara os IDs e datas relevantes com o espelho Supabase. Uma leitura bem-sucedida que coincide comprova a reconciliação naquele instante, mesmo quando nenhuma reserva mudou. Falha, leitura incompleta ou divergência deixam disponibilidade desconhecida. A sincronização compartilhada e as reservas não foram alteradas.

| Execução | Datas | Resultado |
|---|---|---|
| 8228 / 8364 | 01–03/11/2026 | Todas consultadas; zero reservas; preliminar |
| 8242 | 23–25/10/2026 | 24/10 com três reservas; período inteiro lotado; sem convite |
| 8249 | 01–03/11/2026 | Falha de agenda injetada somente no draft durante o replay; orçamento normal, sem afirmar disponibilidade |

A injeção de falha foi removida antes da publicação. Testes cobrem também uma reserva ativa, reservas inativas, datas inválidas, espelho divergente e fonte incompleta. As três reservas ativas de 24/10/2026 e as 17 linhas da agenda permaneceram preservadas.

Persistência e fila são atômicas e idempotentes. Fatos, revisão de preços, valores, texto, procedência e disponibilidade ficam no snapshot. Alteração de fatos ou disponibilidade gera versão adequada; fila de orçamento anterior é cancelada. Mensagens antigas não podem sobrescrever o atendimento atual. Replays persistem evidência sem se tornarem entradas Meta ou dispararem automaticamente.

## Turno 5 — apresentação e saída real

O motor BR-002 existente foi reutilizado sem alteração nem cópia da fórmula. Compositor e apresentação existentes têm ramificação corporativa e fallback social preservado. A mensagem apresenta serviço, datas/dias, períodos/horas, cartão, à vista, sinal, saldo, inclusos oficiais e avaliações Google. Não aplica promoção, acréscimo de cartão ou brinde social. O convite final aprovado aparece apenas sob disponibilidade preliminar e sem bloqueio humano.

Caso validado: Cabine de Fotos, Suzano, três dias e dois períodos/dia. Cartão **R$ 6.255,00**, à vista **R$ 5.129,10**, sinal e saldo **R$ 2.564,55** cada. Quebras reais de linha; nenhum `\\n` literal.

Foi enviado **um** orçamento identificado como “TESTE LAB — cenário simulado”, exclusivamente pela fila TEST existente e ao destinatário autorizado. A operação explícita está em `tests/quote-engine/corporate-operator-outbound-test.sql`. Não foi criada mensagem recebida: a operação exigiu a janela Meta já aberta por uma entrada real anterior. O replay normal continua sem autorização automática para enviar.

Execução do dispatcher **8371**, uma tentativa, ID de mensagem retornado pela API Meta e gravado no Supabase; fila `sent`, orçamento `presented`, etapa `ORCAMENTO`, lifecycle `quote_presented`. Na verificação inicial, o callback disponível era **sent**; posteriormente, essa mensagem de operador chegou a **read**. Esse caso histórico comprova saída e persistência. O E2E autêntico foi comprovado separadamente abaixo.

## E2E autêntico — 19/10/2026

- Ingresso webhook **13783**, F1 integrado **13784**, dispatcher **13788**. Origem `meta_whatsapp`, procedência `meta_webhook`, número TEST e destinatário autorizado conferidos. Nenhuma intervenção manual na fila ou reclassificação de origem.
- Os nove fatos conhecidos foram persistidos e o F1 seguiu direto ao motor sem repetir perguntas. Consultou 01, 02 e 03/11/2026; zero reservas ativas em cada data; reconciliação com Trello bem-sucedida.
- Valores exatos do caso acima: cartão R$ 6.255,00; à vista R$ 5.129,10; sinal/saldo R$ 2.564,55 cada. Snapshot registra BR-002 e a revisão oficial já homologada.
- Uma versão de orçamento e um envio corporativo. Confirmação API gravada às 14:47:12; callback `delivered` persistido às 14:47:14. F1: 2.599 ms. O tempo do F1 é uma medição desta execução, não garantia de latência fim a fim.
- Orçamento `presented`, etapa `ORCAMENTO`, lifecycle `quote_presented`, sem bloqueio humano. Texto com 24 quebras reais de linha e zero sequências literais de barra invertida + n; inclusos, prova social e convite final visíveis na captura do usuário.
- A entrada posterior de aceite foi processada em **13798**, sem mudança de fatos e sem segundo envio de orçamento (`duplicate=true` no enqueue). Não existe avanço automático desse aceite para reserva/contrato nesta entrega. Esse fluxo posterior está fora dos Turnos 3–5; nenhuma reserva foi criada.
- Sessão e fatos reais de teste preservados; não foi executado reset após o E2E. Fila sem pendências e três reservas ativas de 24/10/2026 preservadas.

## Testes e segurança

- **404 testes JavaScript aprovados, zero falhas**, incluindo os 242 anteriores, 111 de taxonomia e 51 de qualificação/apresentação/contratos de runtime.
- Código versionado em `170c34d6300207f0d72a143d597560eb169e3034`; [GitHub Actions 39192347703](https://github.com/clickmaiscabine/Click-Mais-Cabine/actions/runs/39192347703) concluído com sucesso.
- `tests/quote-engine/corporate-persistence.sql`: verificações em transação revertida para prontidão, procedência, todas as datas, replay sem envio, duplicatas de entrada/orçamento, input obsoleto, formatação, bloqueios humanos na resposta/fila/claim, handoff real e disparo incerto. Nenhuma fixture permaneceu após rollback.
- Resposta social comparada integralmente com os componentes anteriores; precificação social e módulo BR-002 não foram alterados.
- Cinco RPCs verificadas: execução vedada a `anon`/`authenticated`, permitida a `service_role`. Constraints da fila fixam número Meta TEST e destinatário autorizado. Nenhuma credencial exportada nos workflows; imports exigem vincular as credenciais existentes por interface.
- Disparo com resultado incerto é colocado em quarentena; não há reenvio cego após timeout. Falhas explícitas mantêm a fila persistente existente.
- Advisor Supabase antes/depois: os mesmos 35 achados informativos preexistentes de RLS sem policy, nenhum achado novo. As RPCs continuam restritas ao backend `service_role`; não foram abertas policies públicas. [Referência do advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Migrações aplicadas, com versões retornadas pelo Supabase: `20261019021639`, `20261019022018`, `20261019022334`, `20261019024546`. Compatibilidade do contrato F1 preservada; infraestrutura compartilhada recebe somente operações de sessão TEST e funções compatíveis. Não foram criados bancos ou workflows.

## Versões e retomada

As versões exatas, textos sintéticos e resultados estão em [BR002_TURNOS_3_5_EVIDENCIAS.json](BR002_TURNOS_3_5_EVIDENCIAS.json). Exports sanitizados estão em `n8n/workflows/CM-WF-000_meta-test-ingress-lab.json`, `CM-WF-020_corporate-f1-lab.json`, `CM-WF-031_corporate-presentation-lab.json`, `CM-WF-060_corporate-composer-lab.json` e `CM-WF-070_test-queue-lab.json`. A fila existente recebeu classificação conservadora de erro: timeout/resultado desconhecido e rejeição permanente exigem revisão; rejeição transitória explícita mantém retry limitado. Credenciais existentes: Supabase account, Trello account, WhatsApp account e OpenRouter já vinculadas no runtime; nenhum segredo integra o repositório.

E2E autêntico concluído e registrado. Sessão TEST preservada com o orçamento apresentado; fila sem pendências. Os 404 testes automatizados, os cenários adversos anteriores e esta entrega confirmada sustentam a conclusão técnica em LAB. Isso não autoriza merge, homologação comercial adicional ou promoção para produção. O avanço após aceite para tentativa de reserva/contrato é uma etapa posterior, não incluída nesta missão. Não há harness executando em segundo plano.

Nenhum merge, promoção para produção, disparo comercial em produção ou alteração de reserva foi realizado. PR mantido em rascunho.

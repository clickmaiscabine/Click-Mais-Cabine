# Departamento 06 — Marketing e Aquisição
Status: review
Versão: 1.1.0 — 2026-11-23

## Decisão de negócio
Regis determinou em 23/11/2026 criar uma operação recorrente de marketing para a Click Mais: gerente Hermes coordena e cobra; Codex executa consultas, análises e produção; Google Ads, Wix, avisos por e-mail e redes sociais entram no escopo. Cabine IA é prioridade de lançamento. Esta decisão amplia a operação sob demanda anterior; não demonstra, por si, implantação local.

## Cadência vigente — DEC-018
A decisão posterior de Regis separa vigilância diária de e-mails/avaliações da revisão semanal de Ads, Wix e resultados, segunda à tarde após as 12h. O gerente recebe os extratos antes e é o único responsável por lembrete ao dono, alertas e distribuição no Painel. Codex lê inbox privada e grava outbox privada com recibo. Detalhamento vinculante desta revisão: [OPERACAO-E-INGESTAO.md](OPERACAO-E-INGESTAO.md).

## Responsabilidade
Um único gerente cm-marketing responde pelo Departamento 06 e reporta ao cm-co. Se cm-aquisicao já existir, manter suas rotinas e custódia legada do Radar/recuperação; migrar apenas a supervisão de marketing depois do recibo de aceite. Não criar dois gerentes cobrando o mesmo job. O Radar continua no agendamento e no motor atuais. Atendimento cuida da entrada e do canal; Vendas continua dona da qualificação comercial e do fechamento; Arte fornece peças; Pós-venda fornece somente material com autorização de publicação.

## Arquitetura
1. Cron ou pedido do gerente cria uma requisição com identidade e período.
2. O adaptador real do ambiente Hermes chama o Codex já disponível.
3. Codex consulta fontes autorizadas e devolve relatório estruturado e peças.
4. O gerente confere cobertura, registra recebimento e resolve os próximos passos.
5. O CO recebe apenas síntese e exceções de impacto.

A credencial pertence à conta e ao mecanismo de autenticação. Registrar Codex como executor não transfere OAuth, sessão de navegador ou conectores ChatGPT ao Codex local. Não copiar tokens. Descobrir a integração instalada e provar leitura no contexto do processo agendado, inclusive quando a interface do dono estiver fechada. Sucesso interativo não prova capacidade do cron.

## Escopo inicial
- Ads: gasto, volume, conversões, elegibilidade, anúncios reprovados, destinos, orçamento vigente e avisos financeiros.
- Wix: disponibilidade das páginas de destino, botões, sessões, visitantes, cliques de contato, formulários, domínio/plano/renovação quando expostos.
- E-mails: notificações pertinentes de Ads, Google Payments e Wix; validação de remetente, conta e data de vigência.
- Políticas: avisos oficiais de alteração e aplicação à conta, com prazo e ação.
- Conteúdo: uma peça base diária, versões para Instagram/Facebook/TikTok e fila de publicação.
- Cabine IA: demonstração comercial, página específica, roteiro de oferta e medição da procura.
- Recuperação comercial: consumir resultados existentes do Radar sem reexecutar mensagens.

## Regras de medição
Clique Ads, sessão Wix, clique de contato, conversa, orçamento enviado e venda são etapas distintas. Não somar nem tratar um clique como lead. Confrontar datas, fuso, consentimento e perdas de medição antes de atribuir causa. Zero na plataforma não prova ausência de venda. Resultado ausente é null com erro/cobertura, não zero.

Na revisão semanal, usar a última semana completa de segunda a domingo contra a anterior. A rotina diária cobre avisos e avaliações; consulta de métricas diárias só quando necessária a um incidente ou pedido. Datas Ads inclusivas; Wix endDate exclusivo. Nunca inferir saldo por diferença entre uma recarga e gasto parcial. Não somar visitantes únicos diários como únicos do período sem saber a definição.

## Autonomia
Consultas, relatórios, rascunhos, registro de evidências e recuperação de leitura são automáticos. Ajustes operacionais conhecidos devem usar limites e políticas vigentes. Não inventar preço, desconto, verba, promoção ou disponibilidade. Uma mudança paga segue o fluxo de alteração suportado pelo provedor e os limites já aprovados; pedido de relatório não é autorização para aumento de verba. Pagamento e autenticação pessoal geram apenas a ação humana indispensável, com motivo.

Publicação recorrente exige conta conectada, material e regra editorial aprovados. Material de cliente exige consentimento por canal conforme ADR-0004. Sem material elegível, produzir demonstração própria ou peça sem pessoas. Nunca atrasar a entrega privada de um evento por falta de autorização social. Publicar somente com recibo post_id/URL; estado incerto exige reconciliação antes de repetir.

## Agendamento e custo
jobs.json descreve intenção, não executa jobs. O adaptador deve usar a versão real do Hermes e sua documentação local. Não inventar comandos hermes, endpoint ChatGPT ou webhook Codex.

Agendamento inicial cloud é um executor provisório, não o gerente local. Até o transporte Hermes estar validado, as entregas ficam no ChatGPT. Antes de ativar o mesmo pacote no Hermes, pausar ou reduzir o agendamento provisório e confirmar um único dono. O gerente pode pedir consulta sob demanda, reaproveitando a coleta diária fresca.

Concentrar coleta em um pacote; scripts coletam o que for determinístico, LLM interpreta só as exceções e produz conteúdo. Não criar modelo permanente por rede social nem contratar serviço pago sem necessidade demonstrada. Teto de gasto adicional em mídia: nenhum por esta implantação. Teto de custo de execução deve herdar política existente; se ausente, medir custo da primeira execução e limitar uso recorrente antes de habilitar consumo novo.

## Entrega e recuperação
Estados: requested → running → produced → received → accepted.
partial, failed e delivery_pending expressam problemas, não sucesso.
Somente ack do gerente permite received; completed do processo não prova entrega.

Chave de agrupamento diário: marketing|clickmais|data-local. Cada escopo usa request_id próprio com work_type e revisão para não colidir vigilância e semanal. Pedido sob demanda aponta coleta reutilizada. Leitura com falha admite uma nova tentativa segura; falha persistente vira pendência com causa. Não repetir escrita/publicação após timeout sem buscar o efeito no destino. Evitar vazamento em prompt: executar com acesso mínimo e retornar somente dados necessários.

## Implantação finita
1. Ler spec Hermes vigente e preservar departamentos anteriores.
2. Resolver integração Codex e inventariar capacidades no processo real.
3. Instalar os contratos deste pacote e o destino privado do relatório.
4. Fazer uma chamada real de leitura por Ads/Wix/mail e o ack do gerente.
5. Manter um único dispatcher por rotina; separar vigilância diária e revisão semanal, e configurar o lembrete somente no Hermes.
6. Produzir sete peças e ativar publicação por canal que estiver pronto.
7. Encerrar implantação do núcleo com matriz preenchida. Canais ainda sem acesso ficam como expansão específica e não reabrem o núcleo.

Preservar integralmente gatilho contratual, event_key, fichas Processados, posições dos cartões e motores homologados. Não reaplicar casos encerrados. Não instalar um publicador social como dependência da primeira venda.

## Cabine IA
Usar o produto de fotos generativas, não o chatbot. A homologação registrada em 15/11/2026 cobre captura Breeze, aprovação, overlay/cronômetro e entrega digital por QR/OneDrive. V1 sem impressão; 1–3 imagens conforme temas contratados. Cromaquino é frente futura. A validação comercial utiliza a homologação já existente, sem reabrir a bateria técnica. Confirmar oferta e materiais na fonte atual antes de publicar.

## Arquivos
- OPERACAO-E-INGESTAO.md: funções vigentes, inbox/outbox privada, funil e aceite incremental.
- prompts/diario.md: vigilância de avisos e avaliações.
- prompts/semanal.md: revisão de contas e cruzamento comercial.
- config/jobs.json: intenção dos jobs.
- schemas/request.schema.json e report.schema.json: contratos próprios desta integração.
- examples/request.json: exemplo sintético.
- MATRIZ-ACEITE.md: conjunto finito de aceites.
- CAMPANHA-40-DIAS.md: prioridades e primeira semana editorial.


## Compatibilidade dos contratos
Schemas passam a aceitar 1.0.0 e 1.1.0. Mensagens 1.0.0 e seus recibos continuam válidos; novos campos só entram após atualizar o consumidor correspondente. Relatórios 1.1.0 requerem package_key, work_type e pendências. Não sobrescrever adaptador local funcional nem reclassificar recibo antigo como recibo da nova ponte GitHub.

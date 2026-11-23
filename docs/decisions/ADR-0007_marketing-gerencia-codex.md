# ADR-0007 — Gerência de Marketing e execução por Codex
- Status: review
- Data: 2026-11-23
- Decisão humana de origem: Regis solicitou criar a operação recorrente de Marketing, com gerente Hermes e executor Codex, priorizando Cabine IA e o período comercial até o fim do ano.

## Decisão
Adicionar cm-marketing como responsável pela operação de marketing do Departamento 06. O gerente coordena pedidos, agenda, entrega e recuperação; Codex executa mediante capacidades comprovadas. Preservar Radar e motores comerciais existentes. A mudança da responsabilidade documental não transfere credenciais nem prova integração.

A separação será implantada com uma única cadeia de responsabilidade. cm-aquisicao preserva a custódia legada até migração verificável; não haverá dois jobs para a mesma coleta.

Adotar contratos de request/report, evidência por fonte e ack de entrega. Homologar leitura/entrega local por uma cadeia real finita; redes sociais por canal. Nenhuma nova bateria sobre os departamentos encerrados.

## Consequências
- Marketing passa de coleta sob demanda a rotina recorrente com produção editorial.
- Acesso é verificado no contexto do executor agendado.
- Pagamento, verba e regra comercial continuam nas alçadas vigentes.
- Publicação social segue ADR-0004 e não bloqueia entrega privada.
- Relatórios privados, e-mails, clientes e segredos não entram no repositório público.
- Este ADR permanece review até a instalação local; o pedido do dono já autoriza a preparação e consultas.


## Detalhamento posterior — DEC-018
A decisão de 23/11 separa revisão semanal e vigilância diária; Hermes passa a ser o único ponto de lembrete, alerta e distribuição ao dono/Painel. Adotar inbox/outbox em repositório privado dedicado, checksum, identidade por escopo e ack específico. A coleta de e-mails existente é reaproveitada. Ver OPERACAO-E-INGESTAO.md. O recibo local já registrado não comprova a nova ponte GitHub nem todos os acessos cloud/local. Preservar sua evidência e fazer somente os aceites incrementais.

## Jornada comercial — DEC-019
A revisão semanal passa a vincular Controle de Orçamentos, Logística 3.1 e recebimentos Financeiro em uma visão analítica privada por oportunidade/evento. Incorporar JORNADA-COMERCIAL.md e journey.json separado: preservar schemas/request/report existentes e a alçada dos motores. Não há novo job, novo gatilho de fechamento ou alteração de cartões. Histórico importado, duplicatas e datas desconhecidas não podem gerar aquisição ou conversão fictícia.

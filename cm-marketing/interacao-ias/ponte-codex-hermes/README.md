# Área de interação IAs — Ponte Codex–Hermes

Status: review · criado por ordem de Regis em 23/11/2026.

Área do Departamento cm-marketing para pedidos, insumos, entregas e recibos entre Codex e Hermes. Funciona antes da conclusão do SOUL.md do gerente: o protocolo de transporte não concede autoridade comercial.

**[Abrir a área privada de troca](https://github.com/clickmaiscabine/painel-da-vida/tree/cm-marketing-interacao-ias/cm-marketing/interacao-ias/ponte-codex-hermes).**

Este repositório é público. Aqui ficam orientação e contratos; relatórios, métricas, extratos, e-mails e fichas preenchidas são gravados exclusivamente na área privada acima. Confirmar a visibilidade private antes de cada escrita de dados reais.

| Pasta privada | Quem escreve | Função |
|---|---|---|
| hermes-para-codex/ | Hermes | Pedidos e insumos, incluindo extratos |
| codex-para-hermes/ | Codex | Relatório, evidências, conteúdo e ficha semanal |
| recibos/ | Hermes | Confirmação vinculada ao pacote, commit e hashes |
| estado/ | Responsável pela fonte | Cursores e deduplicação, preservando o coletor existente |

## Disparos efetivos

O agendador do ChatGPT dispara a vigilância diariamente por volta das 08h e a revisão semanal às segundas por volta das 15h, no fuso America/Sao_Paulo. São duas automações existentes; esta área não cria cron, GitHub Action, webhook ou execução local. Os horários são aproximados.

Hermes administra entradas, solicita escopos sob demanda e consome as saídas no mecanismo existente. Depositar um pedido no GitHub não dispara o ChatGPT por si só. Nas próximas execuções agendadas, Codex lê os pedidos elegíveis. Disparo imediato Hermes→Codex depende do adaptador real já disponível no ambiente; não presumir que esteja conectado a esta pasta.

Upload confirmado significa uploaded; received exige recibo correspondente do Hermes. Não gerar o próprio recibo. Preservar revisões, períodos, evidências e o histórico local já instalado. Uma falha de canal mantém entrega parcial dos demais.

Detalhes: [operação canônica](../../../docs/07_projeto_executivo/cm-marketing/OPERACAO-E-INGESTAO.md), [máquina semanal](../../../docs/07_projeto_executivo/cm-marketing/maquina/README.md). A configuração privada define branch e caminhos exatos. Não é necessário reinstalar o painel.

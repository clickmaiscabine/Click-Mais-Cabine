# Catálogo candidato de intenções

Status: review

Os IDs abaixo são candidatos. Ainda não são enums, schemas ou regras canônicas.

| ID | Intenção candidata | Sinal observado |
|---|---|---|
| INT-001 | solicitar_preco | orçamento, preço ou valor |
| INT-002 | consultar_disponibilidade | data, horário ou vaga |
| INT-003 | entender_servico | o que inclui, duração, funcionamento |
| INT-004 | negociar_preco | caro, desconto, ajuste de condição |
| INT-005 | consultar_pagamento | parcela, sinal, Pix ou forma de pagamento |
| INT-006 | informar_dados_evento | data, local, horário, tipo de evento |
| INT-007 | enviar_dados_contrato | avanço para formalização |
| INT-008 | confirmar_fechamento | aceite, sinal ou contratação |
| INT-009 | tirar_duvida_logistica | chegada, montagem, endereço, operação |
| INT-010 | consultar_entrega | fotos, arquivos, link ou prazo |
| INT-011 | reclamar_pos_venda | atraso, falha, insatisfação |
| INT-012 | retomar_orcamento | retorno após período sem contato |
| INT-013 | elogiar_ou_indicar | satisfação, recomendação, prova social |
| INT-014 | solicitar_atendente | escape explícito para humano |

## Próxima decisão

Antes de implementar:
1. revisar sobreposição entre intenções;
2. definir exemplos positivos e negativos;
3. definir campos mínimos exigidos por intenção;
4. homologar os IDs;
5. só então gerar schema/roteamento.

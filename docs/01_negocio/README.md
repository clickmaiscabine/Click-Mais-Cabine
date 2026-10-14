# 01 — Negócio

Status: development

Esta pasta receberá a modelagem funcional detalhada do negócio antes da implementação executiva.

## Artefatos previstos

- `JORNADA_DO_LEAD.md`
- `PIPELINE_COMERCIAL_TRELLO.md`
- `JORNADA_OPERACIONAL.md`
- `REGRAS_DE_QUALIFICACAO.md` — ficha única, campos obrigatórios e sequência de perguntas (DEC-017).
- `ORIGEM_E_ATRIBUICAO.md` — registro de sinais e medição semanal agregada (DEC-018).
- `ORIGEM_E_ATRIBUICAO.md`

## Decisões já congeladas

- origem principal: anúncios/landing pages/WhatsApp;
- produtos de entrada: Cabine, Plataforma 360 e Totem;
- lead qualificado = orçamento enviado;
- para iniciar checagens de orçamento, a ficha requer serviço, finalidade, data e localidade; nome/relação não bloqueiam (DEC-017);
- origem individual só é registrada com evidência; sem evidência, fica não identificada; aquisição comparada semanalmente em dados agregados (DEC-018);
- Trello Comercial começa em ORÇAMENTO;
- pipeline: ORÇAMENTO → RESPOSTA → FAC/DÚVIDAS → NEGOCIAÇÃO BOT/HUMANO → FECHAMENTO → GANHO/PERDIDO;
- GANHO inicia transição para operação/logística.

A especificação detalhada será produzida no Projeto Executivo sem alterar essas decisões silenciosamente.

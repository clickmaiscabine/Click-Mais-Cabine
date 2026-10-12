# Preços e regras de orçamento — fonte homologada

Status: homologated  
Data de aprovação: 2026-10-11  
Decisão: DEC-017 (`docs/00_governanca/REGISTRO_DE_DECISOES.md`)

## Fonte de verdade

A planilha **CLICK_MAIS_AUDITORIA_LOCALIDADES_E_PRECOS.xlsx** foi expressamente homologada pelo responsável após os testes de orçamento.

SHA-256 exato da planilha de origem: `80942ae22c307d9cdf31a9a82f458fce34c47b9ec0e576cfceaaa5c1f5bf96f3`.

Cópia XLSX e transformação YAML integral:
`/Click Mais Cabine/Base Comercial Homologada/` — **Biblioteca do ChatGPT**, com anexo YAML na [página do projeto Notion](https://app.notion.com/p/3eb9fb22b1fa81bcbbbeff9a92ad140d).

**Não publicar XLSX ou YAML integral neste repositório público**: contém códigos internos de faixas e informações comerciais. O conteúdo aprovado deve ser usado por um motor determinístico após importação controlada em repositório privado/configuração protegida ou tabelas privadas do Supabase; nenhuma base protegida foi alterada por esta decisão.

## Escopo aprovado

- 8 faixas numéricas de Pix, cartão, combo, promoção e combo promocional; fórmulas conferidas.
- 234 localidades na planilha: 233 com status OK e 1 com REVISAR (Raposo Tavares, sempre human handoff).
- Serviços principais e regras de orçamento/combos, cartão e promoção com prazo de até 30 dias conforme XLSX.
- Bairros e apelidos: correspondência exata normalizada por nome canônico/alias; sem extrapolação de preço para localidade nova.
- Valores que não constem em fonte aprovada devem ser bloqueados, nunca estimados por LLM/JEV.
- Agenda de disponibilidade **não** faz parte da planilha e requer verificação independente.
- Follow-up/remarketing não são objeto desta homologação da Meta 1; manter controles existentes até reconciliação posterior.

## Regras de implementação

JEV pode identificar intenção/entidades e devolver escolha tipada; **não calcula nem inventa preços**. Código determinístico resolve localidade e aplica a versão homologada. Guard bloqueia ambiguidades, handoff e exceções. Supabase registra estado; n8n executa; Meta TEST faz o transporte após homologação da integração.

Para trocar esta fonte, registrar nova DEC, novo SHA-256 e testes de paridade; nunca reaprender valores a partir de conversas.

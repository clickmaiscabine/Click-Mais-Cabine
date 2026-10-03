# Metodologia — análise de leads do WhatsApp

Status: review  
Data: 2026-10-02

## Objetivo

Identificar padrões reais de linguagem, dúvidas, objeções e comportamento comercial para orientar a construção do chatbot da Click Mais Cabine.

## Escopo analisado

- período histórico: 17/06/2015 a 02/10/2026;
- 408.549 mensagens de texto;
- 7.732 conversas no conjunto geral;
- recorte principal: 5.234 conversas bidirecionais de atendimento;
- 396.058 mensagens no recorte de atendimento;
- 178.289 mensagens recebidas;
- 217.769 mensagens enviadas.

Áudios, imagens e documentos não fizeram parte da análise principal.

## Processo usado

1. leitura local do backup;
2. extração somente de texto;
3. mascaramento de PII antes da análise;
4. auditoria de PII;
5. análise estatística e heurística;
6. consolidação dos achados.

## Limitações

- o histórico cobre muitos anos e diferentes fases da empresa;
- a voz de saída mistura atendimento humano, equipe e automações anteriores;
- temas e estágios foram inferidos por heurísticas e palavras-chave;
- sinais de fechamento não equivalem a conciliação financeira;
- apenas uma conta de WhatsApp foi analisada;
- mídia e áudio ficaram fora;
- preços do histórico não representam necessariamente a tabela vigente.

## Regra para agentes

Separar sempre:
- **evidência observada**;
- **interpretação**;
- **hipótese de melhoria**;
- **regra homologada**.

Somente uma decisão humana explícita pode promover um achado para `knowledge/`, `docs/business-rules/`, `prompts/`, schemas ou workflows.

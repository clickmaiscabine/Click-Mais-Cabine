# PROJECT.md — Click Mais Cabine Chatbot

## Objetivo
Construir uma plataforma de atendimento e automação da Click Mais Cabine, centrada em WhatsApp, capaz de receber contatos, manter contexto, conduzir atendimento, acionar processos e registrar estado de forma auditável.

## Princípios
- estado explícito, não dependente apenas do contexto da LLM;
- idempotência;
- rastreabilidade;
- baixo acoplamento entre canais, IA e regras;
- possibilidade de trocar modelos sem reescrever o sistema;
- revisão humana para mudanças estruturais e exceções relevantes;
- reconstrução possível a partir dos artefatos versionados.

## Pilares
1. GitHub: fonte canônica.
2. Supabase: estado operacional.
3. n8n: orquestração.
4. Meta/WhatsApp e demais serviços: canais/integrações.
5. LLMs/agentes: interpretação, geração e revisão dentro de contratos definidos.

## Fora de escopo nesta fase
O detalhamento definitivo de CRM, contratos, pagamentos, arte, logística e entrega ainda não está congelado. Esses domínios deverão ser modelados em ADRs/schemas próprios.

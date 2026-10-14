# Plano — Primeiro fluxo WhatsApp

Status: review

- Partir da branch do PR #19 e isolar `codex/whatsapp-intake-flow-20261014`.
- Confirmar receiver Meta, kernels F3, schemas e helpers já presentes no banco.
- Alinhar contratos v1.2.1 da branch existente com migrations já aplicadas; nenhum DDL remoto.
- Implementar kernel puro e adapter transacional usando tabelas/helpers canônicos.
- Instalar apenas em PostgreSQL isolado para testes; preparar RPCs de DEV sem promovê-las.
- Criar n8n draft com externals pinned; preservar receiver ativo e demais módulos.
- Registrar correspondência no manifesto, validações, fixtures e limites de promoção.

Não há nova espera, fila, tabela de n8n ou assinatura. Supabase continua canônico; o banco local é somente o ambiente de validação. A próxima etapa operacional depende de DEV/homologação, não de nova decisão sobre os quatro campos.

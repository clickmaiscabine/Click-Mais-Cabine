# Especificação — Primeiro fluxo WhatsApp

Status: review

Implementar exclusivamente entrada, normalização, ficha cumulativa e próxima etapa, conforme DEC-017/018 e PR #19. Quatro campos liberam verificações: serviço, finalidade, data e localidade. Nome/relação/origem são opcionais. Origem sem evidência = unknown.

Uma mensagem preenche todos os campos encontrados; mensagens seguintes acrescentam fatos sem reapresentar pergunta respondida. O próximo ausente segue serviço → finalidade → data → local. Conflitos são preservados e exigem confirmação; negações excluem serviços. Combo vai para a regra homologada, sem preço nesta etapa.

Aceitação: oito casos solicitados, além de duplicata, reinício, concorrência, human lock, múltiplos eventos e falhas de persistência. Proibido modificar Meta/produção, enviar a clientes, mesclar automaticamente PR #19 ou executar novo teste manual WhatsApp.

Detalhamento e evidências: `../../docs/04_workflows/WHATSAPP_INTAKE_AUDIT_2026-10-14.md`.

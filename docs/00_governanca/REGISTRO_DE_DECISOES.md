# Registro de Decisões — Click Mais OS

Status: homologated  
Atualizado em: 2026-10-05

Este arquivo registra decisões humanas funcionais e arquiteturais em linguagem curta. ADRs detalham decisões arquiteturais quando necessário.

| ID | Decisão | Status | Substitui/impacta |
|---|---|---|---|
| DEC-001 | GitHub é a fonte canônica dos artefatos versionáveis do projeto. | homologated | fundação |
| DEC-002 | Supabase é a fonte canônica do estado operacional; Trello é projeção/cockpit humano. | homologated | fundação |
| DEC-003 | Chatwoot fica fora do projeto V1; Trello + Supabase assumem acompanhamento e registro de estado. | homologated | atualiza ADR-0005/arquitetura anterior |
| DEC-004 | A principal entrada comercial prevista são anúncios → landing pages → WhatsApp. | homologated | nova |
| DEC-005 | As landing pages iniciais são Cabine de Fotos, Plataforma 360 e Totem de Fotos. | homologated | nova |
| DEC-006 | A mensagem predefinida/tagueada do botão “Quero orçamento” deve servir como sinal de origem e produto de interesse. | homologated | nova |
| DEC-007 | Um contato se torna lead qualificado quando um orçamento é efetivamente enviado. | homologated | redefine criação de lead operacional |
| DEC-008 | O card do Trello Comercial nasce em ORÇAMENTO, após `ORCAMENTO_ENVIADO`, e não na primeira mensagem. | homologated | substitui projeção “novo customer_event → criar cartão” |
| DEC-009 | Ordem do Trello Comercial: ORÇAMENTO → RESPOSTA → FAC/DÚVIDAS → NEGOCIAÇÃO BOT/HUMANO → FECHAMENTO → GANHO/PERDIDO. | homologated | substitui desenho preliminar anterior |
| DEC-010 | Orçamento vem antes do processo de venda; “venda” designa explicações, diferenciais, dúvidas, objeções, negociação autorizada e condução ao fechamento. | homologated | esclarece terminologia |
| DEC-011 | Mover o card não apaga histórico: coortes e campanhas consultam dados canônicos no Supabase. | homologated | nova |
| DEC-012 | Leads PERDIDOS permanecem na base histórica e podem pertencer a coortes; elegibilidade de campanha é decidida por regra própria. | homologated | nova |
| DEC-013 | Trello Comercial e Trello Logística são quadros com responsabilidades diferentes; operação logística não deve ser duplicada no funil comercial. | homologated | consolida arquitetura |
| DEC-014 | O Projeto Executivo pode detalhar decisões homologadas, mas qualquer mudança exige registro explícito e, quando arquitetural, ADR. | homologated | governança |

## Regra de alteração

Nunca editar uma decisão antiga para esconder mudança histórica.

Quando uma decisão mudar:
- criar nova DEC;
- indicar qual decisão foi substituída;
- atualizar changelog;
- criar/atualizar ADR quando houver impacto arquitetural.

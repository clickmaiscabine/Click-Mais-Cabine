# Registro de Decisões — Click Mais OS

Status: homologated  
Atualizado em: 2026-10-14

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
| DEC-015 | Para eventos com data registrada, programar a entrega do link OneDrive para 12h do dia calendário seguinte à data da festa, no fuso America/Sao_Paulo; executar o envio quando a pasta estiver pronta e vinculada ao evento. | homologated | detalha ADR-0004; workflow CM-WF-140 |
| DEC-016 | Entregar ao cliente um link OneDrive padrão “Anyone/qualquer pessoa com o link”, somente para visualização, com download permitido; não exigir autenticação ou identidade do destinatário. O cliente recebe o link pelo WhatsApp e pode repassá-lo; qualquer pessoa que o obtenha poderá acessar as fotos. | homologated | detalha ADR-0004; workflow CM-WF-140 |
| DEC-017 | Manter uma ficha única cumulativa por contato/evento. Para iniciar as checagens do orçamento, exigir serviço, finalidade, data e localidade; perguntar apenas o próximo campo ausente na ordem serviço → finalidade → data → local. Nome e relação da pessoa são opcionais e não bloqueiam o cálculo. | homologated | docs/01_negocio/REGRAS_DE_QUALIFICACAO.md |
| DEC-018 | Registrar origem individual somente quando houver evidência; CTA pode indicar página/produto, mas não comprova sozinho o canal causal. Sem sinal, usar “não identificada”; acompanhar aquisição semanalmente com dados agregados de Google Ads, Wix e contatos no WhatsApp. | homologated | qualifica DEC-006; docs/01_negocio/ORIGEM_E_ATRIBUICAO.md |

## Regra de alteração

Nunca editar uma decisão antiga para esconder mudança histórica.

Quando uma decisão mudar:
- criar nova DEC;
- indicar qual decisão foi substituída;
- atualizar changelog;
- criar/atualizar ADR quando houver impacto arquitetural.

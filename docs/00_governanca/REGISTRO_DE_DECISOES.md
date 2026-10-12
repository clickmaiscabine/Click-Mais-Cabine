# Registro de Decisões — Click Mais OS

Status: homologated  
Atualizado em: 2026-10-11

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

| DEC-017 | Responsável homologou em 11/10/2026 a planilha CLICK_MAIS_AUDITORIA_LOCALIDADES_E_PRECOS.xlsx como base canônica para preços por localidade e regras de orçamento; 233 localidades OK e Raposo Tavares permanece com revisão humana; o XLSX e YAML integral ficam em acervo restrito, pois este repositório é público. SHA-256 XLSX: `80942ae22c307d9cdf31a9a82f458fce34c47b9ec0e576cfceaaa5c1f5bf96f3`. [Fonte restrita e decisão](https://app.notion.com/p/3eb9fb22b1fa81bcbbbeff9a92ad140d). | homologated | encerra pendência de aprovação comercial para a Meta 1; não autoriza nova faixa por distância nem publicar regras internas no repositório público |
| DEC-018 | Responsável homologa a configuração do Meta WhatsApp TEST e a disponibilização do número de teste para automações n8n; isto não equivale a homologação da execução E2E de orçamento, credencial no runtime ou número comercial/produção. [Fonte e escopo](https://app.notion.com/p/3eb9fb22b1fa81bcbbbeff9a92ad140d). | homologated | encerra pendência de configuração inicial Meta TEST; mantém testes T005/T024 e gate de produção |

| DEC-019 | O workflow local CMC-CRM-CONTRATO-2026 está homologado e não será alterado nesta etapa. Disponibilidade comercial passa a consultar exclusivamente o espelho `public.cmc_agenda_reservas` do projeto Supabase `Chatbot Clique Mais`, criado em 12/10/2026 com 16 datas herdadas da consulta única anterior. Cada festa/contrato conta 1 vaga, independentemente da quantidade de equipamentos; capacidade = 2 festas/dia. A futura integração insere/atualiza por `trello_card_id` quando o CRM local criar o card, sem varredura Trello no chatbot. Datas lotadas bloqueiam confirmação, mas não orçamento meramente informativo. Cancelamento/remarcação exige atualização do espelho; falha de leitura impede confirmar disponibilidade. O Painel da Vida lerá esta mesma tabela. | homologated | atualiza consulta de disponibilidade da Meta 1; CRM preexistente preservado; integração n8n local e leitura chatbot ainda pendentes de testes |

## Regra de alteração

Nunca editar uma decisão antiga para esconder mudança histórica.

Quando uma decisão mudar:
- criar nova DEC;
- indicar qual decisão foi substituída;
- atualizar changelog;
- criar/atualizar ADR quando houver impacto arquitetural.

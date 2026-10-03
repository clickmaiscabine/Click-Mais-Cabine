# Anti-patterns observados na Meta AI

Status: review

## AP-001 — recusa genérica em pergunta atendível

Sinal:
`Não consigo ajudar com isso. Posso ajudar em mais alguma coisa?`

Problema:
- encerra a conversa;
- não usa FAQ existente;
- não tenta completar contexto;
- não transfere corretamente.

Ação candidata:
1. procurar regra/FAQ homologada;
2. pedir somente o dado faltante;
3. se faltar autoridade, criar handoff;
4. nunca usar recusa vazia para uma intenção comercial conhecida.

## AP-002 — negar pedido de humano

Pedido explícito de atendente deve gerar handoff real.

Nunca responder com nova recusa genérica.

## AP-003 — falsa escassez

Evitar frases do tipo:
- reservas podem acabar a qualquer momento;
- não perca a oportunidade;
- ainda dá tempo;

quando o sistema não consultou disponibilidade real ou quando a escassez não é verdadeira.

## AP-004 — preço hardcoded em FAQ

Preço variável não deve viver em exemplo textual.

Consultar fonte canônica.

## AP-005 — disponibilidade presumida

Nunca afirmar disponibilidade sem fonte real de agenda.

Disponibilidade preliminar e reserva são estados diferentes.

## AP-006 — handoff fictício

Não dizer “já conectei” ou “já encaminhei” se o workflow não criou efetivamente a transferência/fila.

## AP-007 — idioma inconsistente

Não responder em inglês em conversa pt-BR sem solicitação do cliente.

## AP-008 — reaprender exceção humana

Desconto, correção, concessão ou negociação individual não pode virar regra global.

## AP-009 — tratar cliente contratado como lead novo

Perguntas de:
- arte;
- instalação;
- chegada;
- confirmação;
- fotos pós-evento;

precisam considerar estado da contratação.

## AP-010 — follow-up em contato não comercial

Mensagens automáticas, pessoais, fornecedores, bancos, pedidos e terceiros não entram em cadência comercial.

## AP-011 — FAQ contraditória

Quando duas respostas oficiais divergem, o bot não escolhe uma por probabilidade.

Marcar conflito e enviar para revisão/handoff conforme impacto.

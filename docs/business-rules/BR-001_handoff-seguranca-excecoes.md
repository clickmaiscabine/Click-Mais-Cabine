# BR-001 — Handoff, segurança e exceções

- ID: BR-001
- Status: review
- Data: 2026-10-02
- Escopo: atendimento automatizado Click Mais Cabine
- Fonte da decisão: base de preços/localidades revisada em 02/10/2026 + análise histórica de leads + regras de segurança já documentadas.

## 1. Objetivo

Definir quando o chatbot pode continuar sozinho, quando deve interromper a automação e transferir a conversa para atendimento humano e quais informações precisam acompanhar essa transferência.

Handoff não é falha do sistema. É uma transição de estado controlada quando a decisão ultrapassa o limite autorizado da automação.

## 2. Princípio de autoridade

O chatbot só pode agir com base em informação homologada.

Ordem operacional:

1. regra de negócio homologada;
2. base canônica de preço/localidade/serviço vigente;
3. estado atual da sessão;
4. contexto já confirmado pelo cliente;
5. encaminhamento humano quando faltar autoridade ou informação.

O histórico de WhatsApp nunca substitui a base oficial.

## 3. Estados mínimos do handoff

Fluxo recomendado:

```
bot_active
   ↓ motivo obrigatório de handoff
handoff_pending
   ↓ atendente assume
human_active
   ↓ decisão humana
bot_resume | closed | waiting_customer
```

O bot não deve continuar enviando mensagens comerciais enquanto a sessão estiver em `handoff_pending` ou `human_active`, salvo mensagem transacional explicitamente autorizada pelo fluxo.

## 4. Handoff humano obrigatório

### HND-LOCALITY-NOT-FOUND — localidade ausente

Condição:
- cidade, bairro, distrito ou região não encontrada na base operacional.

Ação:
- não calcular por aproximação;
- não usar Google Maps durante o atendimento automático;
- não afirmar que a empresa não atende;
- registrar a localidade informada;
- transferir para humano.

### HND-LOCALITY-REVIEW — localidade cadastrada mas não aprovada

Condição:
- localidade com status de revisão, ambiguidade ou rota incompatível.

Caso conhecido:
- Raposo Tavares permanece em revisão até validação da rota/localidade correta.

Ação:
- não usar a faixa calculada automaticamente;
- transferir para humano.

### HND-PRICE-NOT-AUTHORIZED — preço inexistente ou não homologado

Condição:
- preço de serviço, adicional ou condição comercial não está presente na fonte operacional aprovada.

Ação:
- não inferir;
- não reutilizar preço de conversa antiga;
- não interpolar por distância;
- transferir para humano.

### HND-NEGOTIATION — barganha ou desconto extra

Condição:
- cliente pede desconto além das regras vigentes;
- cliente propõe um valor;
- cliente pede condição especial não cadastrada.

Ação:
- não negociar autonomamente;
- registrar a solicitação;
- transferir para humano.

Uma concessão humana vale somente para a oportunidade/conversa em que foi aprovada, salvo decisão explícita de alterar a regra canônica.

### HND-COMPLAINT — reclamação ou insatisfação

Condição:
- reclamação sobre evento, equipe, fotos, entrega, cobrança, qualidade ou experiência.

Ação:
- reconhecer a mensagem sem discutir culpa;
- não prometer ressarcimento;
- preservar contexto;
- transferir para humano.

### HND-CONTRACT-EXCEPTION — exceção contratual

Condição:
- alteração contratual fora do padrão;
- mudança relevante de data, local, escopo ou responsável;
- pedido que afete obrigação já assumida.

Ação:
- não confirmar a alteração como concluída;
- transferir para humano.

### HND-FINANCIAL — problema financeiro

Condição:
- divergência de pagamento;
- pagamento não identificado;
- estorno;
- cobrança contestada;
- negociação de dívida;
- dado bancário sensível.

Ação:
- não solicitar nem reproduzir credenciais bancárias;
- transferir para humano.

### HND-LEGAL — dúvida jurídica

Condição:
- contestação contratual;
- ameaça jurídica;
- solicitação de interpretação legal;
- pedido de responsabilidade/indenização.

Ação:
- não interpretar juridicamente;
- transferir para humano.

### HND-SPECIAL-OPERATION — operação especial

Condição:
- evento de porte ou logística fora do padrão;
- necessidade técnica especial;
- múltiplos pontos/equipes;
- requisito não coberto pelos serviços cadastrados.

Ação:
- registrar escopo conhecido;
- transferir para humano.

### HND-KNOWLEDGE-GAP — dúvida sem resposta segura

Condição:
- a informação necessária não existe na base;
- fontes canônicas entram em conflito;
- a IA não consegue determinar a regra aplicável com segurança.

Ação:
- não completar a lacuna por inferência;
- transferir para humano.

## 5. Situações que NÃO devem virar handoff comercial

Este WhatsApp também recebe mensagens não comerciais.

Classificar e retirar do funil quando houver:
- familiares, amigos e contatos pessoais;
- equipe interna;
- fornecedores e profissionais de frete;
- bancos e instituições financeiras;
- códigos, senhas e notificações automáticas;
- promoções de terceiros;
- grupos/comunidades sem intenção de contratação;
- mensagens automáticas sem intenção comercial.

Ação:
- não iniciar qualificação;
- não pedir data/local do evento;
- não enviar orçamento;
- não ensinar a persona a partir dessas mensagens.

Quando houver roteamento interno disponível, usar um motivo `NON_COMMERCIAL` em vez de `HND-*`.

## 6. Regras de preço que afetam o handoff

A automação pode apresentar preço somente quando existir correspondência segura entre:

```
localidade homologada
+ serviço homologado
+ regra comercial vigente
+ preço canônico
```

### Pode automatizar

- localidade aprovada e mapeada para uma regra/preço vigente;
- serviços principais cadastrados;
- combo quando a regra vigente estiver satisfeita;
- cálculo de cartão quando a fórmula estiver homologada;
- promoção automática quando a condição e a regra estiverem homologadas.

### Não pode automatizar

- preço deduzido apenas por distância quando a faixa ainda estiver marcada como provisória;
- preço de adicional não cadastrado;
- desconto fora da política;
- preço proposto pelo cliente;
- reaproveitamento de preços históricos;
- aproximação entre cidades/bairros;
- criação de nova faixa.

### Regras internas

- códigos internos de faixa não devem ser apresentados ao cliente;
- fórmulas logísticas e critérios internos não devem ser explicados;
- a fonte canônica de preço tem precedência sobre conversas antigas;
- preço e disponibilidade são conceitos separados.

## 7. Localidade e logística

A base de localidades pode conter:

- exceção comercial fixa;
- equivalência aprovada;
- faixa homologada;
- faixa provisória;
- status de revisão.

A IA deve usar apenas registros autorizados para atendimento automático.

Se houver conflito entre distância calculada e exceção comercial homologada, prevalece a regra homologada.

Se o registro estiver ausente, ambíguo ou em revisão, executar handoff.

## 8. Disponibilidade e reserva

Consultar sempre a fonte real de agenda quando ela existir.

O chatbot nunca deve transformar uma consulta positiva de agenda em promessa definitiva de reserva.

Regra operacional:

```
disponibilidade consultada
≠
reserva confirmada
```

A reserva só pode ser comunicada como confirmada após as condições comerciais/contratuais vigentes terem sido cumpridas.

Quando o cliente quiser fechar e o fluxo padrão estiver disponível:
- encaminhar para o microsite/processo oficial;
- explicar os próximos passos aprovados;
- não inventar exceções.

## 9. Follow-up e janela do WhatsApp

O follow-up deve obedecer simultaneamente:
- a política comercial homologada;
- a janela de atendimento vigente do WhatsApp;
- os mecanismos/templates permitidos pela Meta;
- o estado atual da conversa;
- opt-out ou recusa do cliente.

Regras:
- mensagem enviada pela empresa não deve ser tratada como reabertura automática da janela;
- fora da janela permitida, usar somente mecanismo/template autorizado;
- se não houver mecanismo autorizado, não improvisar mensagem livre;
- resposta, recusa ou opt-out devem cancelar follow-ups incompatíveis;
- não usar escassez fictícia;
- não insistir excessivamente.

Cadências encontradas na pesquisa de leads continuam como hipótese até homologação explícita.

## 10. Mensagem ao cliente no handoff

Mensagem padrão sugerida:

> Essa situação precisa de uma confirmação da nossa equipe para eu não te passar uma informação incorreta. Vou encaminhar seu atendimento com o contexto do que já conversamos 😊

Usar essa mensagem somente quando o workflow realmente criar o handoff.

Não afirmar que alguém “já está atendendo” antes de haver atribuição real.

## 11. Contexto mínimo entregue ao humano

O handoff deve transportar um resumo estruturado, não obrigar o atendente a reler toda a conversa.

Campos recomendados:

```json
{
  "handoff_reason_code": "HND-...",
  "session_id": "...",
  "current_state": "...",
  "detected_intent": "...",
  "customer_request_summary": "...",
  "last_customer_message": "...",
  "service": ["..."],
  "event_date": "...",
  "event_locality": "...",
  "locality_status": "...",
  "quote_reference": "...",
  "commercial_exception_requested": "...",
  "followup_stage": "...",
  "created_at": "..."
}
```

Dados pessoais sensíveis devem ser minimizados. Não copiar documentos, senhas, credenciais ou dados bancários para o resumo de handoff.

## 12. Retomada do bot após atendimento humano

O bot só deve retomar quando houver sinal explícito do workflow/atendente.

Ao retomar:
- registrar a decisão humana;
- atualizar o estado;
- registrar apenas a exceção daquela conversa;
- não alterar automaticamente preço, desconto, política ou persona globais.

Se uma decisão humana revelar uma nova regra reutilizável, ela deve seguir o processo:

```
decisão humana
→ revisão
→ business rule / knowledge
→ homologação
→ implementação
```

## 13. Proteção contra aprendizado incorreto

Nunca aprender regra geral a partir de:
- desconto individual;
- proposta feita por um cliente;
- conversa pessoal;
- mensagem bancária/automática;
- preço antigo;
- erro humano isolado;
- exceção logística;
- decisão de um atendente sem homologação.

## 14. Proibições

- nunca inventar preço;
- nunca inventar serviço;
- nunca inventar disponibilidade;
- nunca inventar prazo;
- nunca expor códigos internos de faixa;
- nunca explicar lógica logística interna ao cliente;
- nunca usar Maps para decidir atendimento automaticamente;
- nunca prometer reserva definitiva apenas porque a data parece disponível;
- nunca reproduzir CPF, RG, senha, token ou dados bancários;
- nunca afirmar que uma região não é atendida sem consultar base ou executar handoff;
- nunca continuar bot comercial durante atendimento humano ativo;
- nunca promover exceção individual para regra global.

## 15. Casos mínimos de teste

| Caso | Resultado esperado |
|---|---|
| Localidade aprovada + preço vigente | continuar automação |
| Localidade ausente | `HND-LOCALITY-NOT-FOUND` |
| Localidade em revisão | `HND-LOCALITY-REVIEW` |
| Raposo Tavares | `HND-LOCALITY-REVIEW` |
| Preço/adicional sem cadastro | `HND-PRICE-NOT-AUTHORIZED` |
| Cliente pede desconto extra | `HND-NEGOTIATION` |
| Cliente propõe preço | `HND-NEGOTIATION` |
| Reclamação | `HND-COMPLAINT` |
| Alteração contratual fora do padrão | `HND-CONTRACT-EXCEPTION` |
| Problema de pagamento | `HND-FINANCIAL` |
| Dúvida jurídica | `HND-LEGAL` |
| Evento especial | `HND-SPECIAL-OPERATION` |
| Base insuficiente/conflitante | `HND-KNOWLEDGE-GAP` |
| Mensagem pessoal/automática | `NON_COMMERCIAL` |
| Cliente quer fechar no fluxo padrão | continuar para microsite/contrato |
| Atendimento humano ativo | bot comercial pausado |

## 16. Componentes afetados

- roteador de intenção/estado;
- workflows n8n;
- Supabase `core.sessions`;
- Supabase `core.events`;
- Supabase `core.state_transitions`;
- auditoria de workflow;
- CRM/fila humana;
- prompts;
- base de preços;
- base de localidades;
- políticas de atendimento.

## 17. Critério de homologação

Este documento só passa de `review` para `homologated` quando:
- os códigos de handoff forem aprovados;
- a fonte operacional de preço estiver definida;
- a fonte de agenda estiver definida;
- as regras de follow-up vigentes estiverem aprovadas;
- houver testes no n8n para os casos mínimos acima.

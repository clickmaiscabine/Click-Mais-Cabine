# Relatório curado — auditoria do treinamento Meta AI

Status: review  
Data: 2026-10-02

## 1. Resumo executivo

O pacote analisado é útil, mas não pode ser usado como base automática sem curadoria.

Ele contém boa quantidade de conhecimento comercial, porém mistura:
- FAQs válidas;
- duplicações;
- regras antigas;
- respostas autorreguladas pela própria Meta AI;
- conversas não comerciais;
- operação pós-venda;
- recusas inadequadas;
- exemplos com preço/data fixos;
- contradições sobre entrega e privacidade de fotos.

A decisão desta auditoria é:

**preservar padrões e regras úteis; eliminar exemplos pessoais, identificáveis, contraditórios ou dependentes de contexto antigo.**

## 2. Escopo

Foram analisados:
- 52 arquivos de conversa;
- 73 entradas de FAQ/configuração;
- regras comerciais configuradas no arquivo de settings;
- exemplos reais de atendimento, pré-evento, evento e pós-evento.

O conteúdo bruto não foi enviado ao GitHub.

## 3. Recusas inadequadas

Foi encontrada exatamente a resposta genérica:

`Não consigo ajudar com isso. Posso ajudar em mais alguma coisa?`

**9 vezes em 6 conversas.**

Nos casos observados, o contexto era comercial e havia caminho melhor disponível. Exemplos de intenção envolvida, sem reproduzir dados de clientes:
- escolha de arte/borda;
- pedido de exemplo de como ficam as fotos;
- continuação de orçamento após o cliente informar dados;
- interesse em produto;
- escolha entre serviços;
- envio de foto para personalização;
- pedido explícito para falar com humano.

Conclusão: essa frase não deve ser usada como fallback comercial padrão.

## 4. Pedido explícito de humano

Em pelo menos dois casos, o cliente pediu atendimento humano e a IA respondeu novamente com recusa genérica antes de um humano entrar.

Regra candidata:
- pedido explícito de humano deve ter prioridade sobre o fluxo comercial;
- o sistema deve criar um handoff real;
- só então responder que o atendimento foi encaminhado.

Isso foi incorporado como extensão do BR-001.

## 5. Mistura de jornadas

As conversas mostram pelo menos cinco contextos diferentes que não devem usar a mesma lógica:

1. novo lead/orçamento;
2. negociação/fechamento;
3. cliente contratado em preparação do evento;
4. evento em andamento/logística em tempo real;
5. pós-evento/entrega de fotos;
6. conteúdo não comercial.

A Meta AI frequentemente tratava tudo como “lead novo”, criando respostas inadequadas.

Exemplo estrutural:
- cliente de evento já contratado pergunta sobre chegada da equipe;
- cliente pós-evento pede link de fotos;
- cliente envia material para arte;
- mensagem automática de terceiro entra no mesmo histórico.

Esses contextos precisam ser roteados por estado, não só por palavras-chave.

## 6. Regras antigas conflitantes

Foi encontrada uma instrução antiga embutida em uma FAQ que determinava:
- usar urgência em toda proposta;
- dizer que reservas são limitadas e podem acabar;
- fazer follow-up em 23 horas;
- não declarar data indisponível durante o fechamento;
- consultar uma base de preços interna e apresentar proposta fixa;
- reforçar escassez como técnica de fechamento.

Isso conflita com a base operacional mais recente, que determina:
- escassez somente quando verdadeira;
- follow-up em cadência própria e dependente da janela da Meta;
- disponibilidade separada de reserva;
- preços vindos da fonte canônica atual;
- exceções comerciais controladas.

Conclusão:
- a instrução antiga deve ser considerada **deprecated**;
- ela não pode ser usada para treinar o novo chatbot.

## 7. Preços fixos em FAQ

Foram encontrados exemplos de FAQ contendo valores associados a:
- localidade específica;
- data específica;
- promoção específica;
- combo específico.

Esses exemplos são perigosos porque parecem “verdade permanente”.

Regra:
- FAQ não deve carregar valor comercial mutável;
- preço deve ser consultado na fonte operacional;
- exemplos históricos podem existir apenas em pesquisa, nunca como regra de atendimento.

## 8. Contradição sobre entrega das fotos

O treinamento contém respostas incompatíveis entre si:
- uma versão diz que há álbum no Facebook + link de download;
- outra diz que as fotos não ficam públicas;
- outra diz que podem ser removidas do Facebook mediante solicitação.

Não há base suficiente nesse pacote para escolher qual versão é a política atual.

Status: **requer homologação humana** antes de atualizar FAQ/políticas.

## 9. Conhecimento útil encontrado

Candidatos para reaproveitamento, após validação:
- processo de escolha/aprovação de artes;
- envio de referência pelo catálogo;
- necessidade de cores/tema/texto para personalização;
- diferenças entre Cabine, Totem, Set e Plataforma 360;
- infraestrutura mínima dos equipamentos;
- duração e montagem;
- dados necessários para contrato;
- diferença entre local do evento e endereço de cobrança;
- regras de combo;
- formas de pagamento;
- fluxo microsite → contrato → sinal;
- tratamento de barganha/reclamação/exceção contratual;
- orçamento inicial sem endereço completo, quando a localidade é suficiente;
- necessidade de bairro/região quando a cidade é grande;
- pós-evento como jornada distinta;
- atendimento humano para logística em tempo real.

Nenhum desses itens foi promovido automaticamente para `knowledge/`.

## 10. Idioma e consistência

Foram identificadas respostas de handoff em inglês dentro de conversas em português.

Regra candidata:
- o canal pt-BR deve responder em português por padrão;
- troca de idioma só ocorre quando o cliente iniciar/solicitar outro idioma.

## 11. Material não comercial

O export contém conteúdo que claramente não deveria participar do aprendizado comercial:
- conversas pessoais/familiares;
- recados cotidianos;
- notificações/entregas;
- mensagens de terceiros;
- alimentação/pedidos;
- felicitações;
- automações externas;
- conteúdo vazio ou unsupported.

Esses registros foram excluídos da camada curada.

## 12. Impacto no projeto

Este relatório afeta:
- `knowledge/persona-click.md`;
- `knowledge/faq.md`;
- `docs/business-rules/BR-001_handoff-seguranca-excecoes.md`;
- roteador de estado;
- intents;
- workflows n8n;
- follow-up;
- pós-venda;
- regras de fallback.

## 13. Próxima etapa

Homologar:
1. política atual de entrega/privacidade das fotos;
2. especificações físicas/técnicas dos serviços;
3. política de arte/aprovação;
4. estados da jornada;
5. intents novas;
6. fallback comercial;
7. handoff explícito;
8. operação evento/pós-evento.

Depois disso, promover apenas os itens aprovados para `knowledge/` e `docs/business-rules/`.

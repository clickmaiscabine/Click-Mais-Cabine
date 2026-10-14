# Regras de qualificação e ficha única do orçamento

- Status: homologated
- Data: 2026-10-14
- Decisão vinculada: DEC-017
- Escopo: coleta progressiva de dados antes da consulta de disponibilidade e da geração do orçamento.

## Princípio

Manter uma única ficha de atendimento por contato/evento. A cada nova mensagem, o sistema revisa o contexto da conversa e acrescenta os fatos identificados à ficha. Não pergunta novamente uma informação já registrada. Se houver conflito entre informações, preserva a evidência e pede confirmação em vez de escolher por conta própria.

O JEV pode identificar e extrair informações semânticas da conversa para campos autorizados. O estado é persistido no Supabase; o n8n coordena o fluxo; as regras determinísticas validam completude, disponibilidade e preço. O JEV não inventa dados nem calcula valores.

## Campos da ficha

| Campo | Como preencher | Necessário para liberar cálculo? |
|---|---|---|
| Serviço desejado | Cabine de Fotos, Totem, Plataforma 360 ou combinação | Sim |
| Finalidade/tipo do evento | Casamento, aniversário, evento empresarial ou outro declarado | Sim |
| Data do evento | Data interpretada sem ambiguidade | Sim |
| Local do evento | Cidade/localidade confirmada; endereço completo quando informado ou exigido pela regra oficial de deslocamento | Sim |
| Nome da pessoa | Somente quando apresentado ou fornecido | Não |
| Relação com o evento | Somente quando declarada, como mãe/pai/parente da noiva ou debutante, homenageada, assessora ou responsável da empresa | Não |
| Origem do contato | Registrar o sinal disponível; usar “não identificada” quando não houver evidência | Não |

Nome e relação da pessoa melhoram o atendimento, mas não bloqueiam o cálculo do orçamento. Origem também é informativa e não substitui os quatro dados necessários para a cotação.

## Ordem das perguntas

Quando faltarem dados, perguntar somente o primeiro campo ausente nesta ordem:

1. Serviço desejado.
2. Finalidade do evento.
3. Data do evento.
4. Localidade/cidade e, quando necessário, endereço do evento.

Essa ordem define a próxima pergunta, não a ordem em que os dados precisam chegar. Se uma mensagem informar serviço, finalidade e data de uma vez, a ficha recebe os três e o bot pergunta apenas a localidade. Se todos os dados já aparecerem na primeira mensagem, não faz questionário: segue para a checagem.

Quando nenhum serviço for identificado, apresentar brevemente a Click Mais e seus produtos e então perguntar qual serviço a pessoa deseja orçar. Quando o texto indicar mais de um produto, registrar todos e aplicar a regra homologada de combo; não perguntar novamente um produto já reconhecido.

## Representação estruturada

Este exemplo mostra a semântica dos campos; os nomes finais devem ser alinhados ao schema de dados vigente antes da implementação.

~~~json
{
  "quote_intake": {
    "contact_name": null,
    "relationship_to_event": null,
    "acquisition_source": "unknown",
    "source_evidence": null,
    "event": {
      "services": [],
      "purpose": null,
      "date": null,
      "city": null,
      "venue_address": null
    },
    "missing_required": [
      "service",
      "purpose",
      "event_date",
      "event_location"
    ],
    "ready_for_quote_checks": false
  }
}
~~~

O registro deve manter a origem/evidência de cada informação conforme o schema vigente. “Não identificado” é um estado válido e preferível a uma inferência sem evidência.

## Gate para orçamento

O sistema pode iniciar as verificações de orçamento quando os quatro campos abaixo estiverem preenchidos:

- serviço;
- finalidade;
- data;
- localidade do evento.

Antes de enviar valor ao cliente, o fluxo ainda deve:

1. consultar a disponibilidade da data;
2. consultar a localidade na base oficial;
3. aplicar somente preços, combos, deslocamentos e condições homologados;
4. encaminhar a um humano quando a regra comercial exigir ou a informação não estiver coberta.

Com as verificações aprovadas, enviar a mensagem de orçamento aprovada, os itens inclusos no serviço e a mensagem de prova social definida. Catálogo, fotos e outras mensagens complementares ficam para definição posterior.

## Exemplos

| Mensagem/contexto | Ficha resultante | Próxima ação |
|---|---|---|
| “Bom dia. Tenho um casamento em Santa Isabel dia 23/08 e gostaria de orçamento.” | Finalidade, local e data preenchidos; serviço ausente | Perguntar serviço |
| “Quero cabine de fotos.” | Serviço preenchido; finalidade, data e local ausentes | Perguntar finalidade |
| “É um aniversário, dia 24/01/2027.” | Atualizar finalidade e data na mesma ficha | Perguntar local |
| “Quero cabine e plataforma para um casamento em Mogi no dia 10/05.” | Registrar os dois serviços, finalidade, cidade e data | Aplicar regra de combo e checar disponibilidade/preço |
| “Não quero totem; quero só cabine.” | Registrar apenas cabine | Não tratar totem como interesse |

## Origem e perfil

Possíveis origens incluem botão de landing page, Facebook/Instagram, Google Maps, indicação e contato encontrado em fotos entregues. Registre a origem individual somente quando houver sinal verificável. Uma frase de CTA pode indicar produto ou página configurada; não prova por si só que Google Ads, Maps, Facebook ou outro canal causou o contato.

Os perfis mais comuns — familiares da noiva ou da debutante/aniversariante, homenageada, assessora de eventos e pessoa responsável por orçamento empresarial — podem ser registrados quando declarados. O perfil não é requisito para orçamento.

Para avaliação de aquisição, comparar semanalmente dados agregados do Google Ads, cliques do Wix e contatos recebidos no WhatsApp. Tratar a relação como acompanhamento aproximado, sem atribuição individual exata quando a origem não estiver comprovada.

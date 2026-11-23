# Jornada comercial, conversão e tempo de retorno

Status: review  
Versão: 1.0.0 — 23/11/2026  
Decisão humana: DEC-019, complementa DEC-018. Especificação analítica de leitura; não altera motores comerciais ou financeiros.

## Resultado pedido

Unir aquisição, contato, orçamento, contrato e primeiro recebimento para medir quantos avançam, quanto tempo levam e qual receita está vinculada à verba. O relatório semanal passa a incluir uma linha do tempo por oportunidade, conversão por grupos de entrada e curvas comparáveis. Hermes coordena a integração e distribui; Codex coleta/analisa e devolve o pacote privado. Sem novo job.

## Fontes confirmadas

- Quadro CONTROLE DE ORÇAMENTOS: https://trello.com/b/18fnAEhK/controle-de-or%C3%A7amentos . Possui etapas de entrada, contato, orçamento, negociação e fechamento. O nome da lista ou um preço extraído não comprova orçamento efetivamente enviado nem data de chegada ao WhatsApp.
- Quadro 3.1 - LOGISTICA: https://trello.com/b/qlnahMOQ/31-logistica . A lista CONTRATOS EM ANDAMENTO é uma entrada para localizar contratos. CONCLUIDOS, cancelados, suspensos e arquivados devem ser considerados na recuperação histórica, sem movimentá-los. Contrato que saiu da lista não pode desaparecer da coorte.
- Livro/gerente Financeiro: fonte do primeiro pagamento efetivamente liquidado, valor líquido, taxas, estornos e demais recebimentos. Reutilizar conciliações válidas; não reabrir a homologação do departamento.
- WhatsApp/Atendimento: fonte da primeira mensagem comercial conhecida e do orçamento enviado, com cobertura temporal. A coleta local deve usar o mecanismo já existente e autorizado; não criar leitor/envios concorrentes.
- Google Ads, Wix e Perfil da Empresa: medição de origem e tráfego, com as definições/limites da OPERACAO-E-INGESTAO.md. Cliques de Perfil da Empresa podem se sobrepor à influência de anúncios.

## Ordem de execução para o gerente e Codex

1. Ler as fontes e suas regras, IDs estáveis, cobertura, fuso e última coleta. Confirmar o contexto real do executor. Reutilizar a matriz e integrações já existentes.
2. Ler o histórico necessário dos quadros, não apenas as listas atuais. Para a primeira entrega, organizar a base de oportunidades com entrada comercial conhecida desde 01/09/2026 até a coleta, buscando referências anteriores quando necessárias para detectar recorrentes/importações. Esse recorte inicial é uma escolha de implantação, não uma janela de atribuição. Fonte sem histórico suficiente fica parcial. Não usar a data da festa como filtro de data de aquisição.
3. Criar uma visão analítica de oportunidades sem escrever nos cartões. Preservar event_key/códigos existentes; formar o vínculo pelo ID canônico quando disponível. Usar telefone normalizado como ponte, com evento/contratante/data e fonte de confirmação para evitar fundir eventos distintos.
4. Reunir orçamento e contrato, excluindo do denominador novo contato os cartões de teste, modelo, instruções e importações de clientes já contratados. Duplicatas ficam agrupadas na visão, preservadas no Trello e contadas uma só vez. Separar cliente novo, recorrente e recuperação.
5. Recuperar os marcos reais e sua evidência conforme tabela abaixo. Registrar tempo do fato e tempo em que ele foi registrado. Não inventar data quando faltar. Paginar comentários/histórico/anexos até cobrir o período relevante.
6. Vincular valores de contrato e recebimentos confirmados pela fonte financeira, sem assumir que etiqueta numérica, vencimento ou SINAL OK informa data de liquidação. Reservar divergências para o gerente responsável, sem alterar financeiro/contratos nesta ordem.
7. Calcular indicadores somente para as populações e períodos elegíveis; mostrar cobertura, vínculos ambíguos, datas faltantes e tamanho da amostra. Gerar journey.json, relatório visual privado e resumo no pacote semanal.
8. Gravar na saída privada e exigir ack correspondente. Hermes mantém o histórico semanal e inclui síntese/alertas no Painel, acionando Codex quando houver providência dentro das regras. A nova especificação não comprova ponte GitHub implantada.

## Uma oportunidade por evento

Um telefone pode representar vários eventos, casal, assessor ou empresa; nomes podem divergir entre os quadros. Telefone igual gera candidato, não vínculo automático irrestrito. Não remover o nono dígito indiscriminadamente; preservar DDI/DDD, distinguir telefone de identificador WhatsApp @lid e utilizar o mapa de identidade existente para essa resolução.

Preferir ID de evento/contrato ou referência cruzada explícita. Sem ele, aceitar ponte exata por telefone + evento compatível quando não houver concorrentes e a documentação do contratante confirmar. Reagendamento deve preservar a oportunidade e o histórico, não gerar nova venda. Mesmo evento com mais de um serviço/combo é uma oportunidade/contrato conforme vínculo canônico, não várias aquisições. Um novo evento de cliente antigo é outra oportunidade, porém não outro cliente novo.

Registrar match_status confirmado, candidato, ambiguo ou sem_vinculo e match_basis. Identidades e telefones ficam privados; painel consolidado usa IDs opacos. Não publicar telefone nem seu hash simples em repositório público. Valores de contrato, comprovantes, nomes e links privados ficam fora do pacote público de software.

## Marcos e evidência

| Marco analítico | Fonte preferida | Distinção necessária |
|---|---|---|
| Exposição/clique | Ads ou origem identificada de primeira parte | Sem identificador de atribuição, é total agregado; data da primeira mensagem não revela data do clique |
| Primeiro contato comercial conhecido | Registro de mensagem WhatsApp/Atendimento | Se histórico não cobre a entrada original, é primeiro contato observado, não necessariamente primeiro contato real |
| Orçamento enviado | Mensagem/documento ou workflow com confirmação do envio | Preço extraído, cartão criado e orçamento gerado são outros fatos |
| Contrato gerado/enviado | Documento/ação correspondente | Não equivale a assinatura nem data de fechamento |
| Contrato assinado | Evento de assinatura/documento concluído | Criação/movimentação do cartão é apenas registro operacional |
| Venda confirmada | Critério vigente do Departamento Vendas com evidência | Preservar o gatilho comercial atual; não impor assinatura/sinal como nova condição por esta análise |
| Primeiro recebimento | Liquidação conciliada no Financeiro | Vencimento, agendamento e etiqueta de pagamento não são data bancária |
| Evento e demais recebimentos | Operação/Financeiro | Data da festa, receita contratada, receita recebida e lucro são medidas distintas |

Um marco pode ocorrer antes de outro por uma rotina legítima (sinal antes da assinatura, por exemplo). Preservar a sequência observada e não forçar assinatura → sinal como ordem obrigatória. Duração negativa causada por importação/data errada vira inconsistência, não tempo de venda negativo. Precisão de data é preservada: data sem hora não vira meia-noite factual e não permite duração em horas.

## Grupos comparáveis e tempo de maturação

Grupo principal: oportunidades pelo primeiro contato comercial conhecido na mesma semana de São Paulo. Quando só houver orçamento enviado comprovado, formar grupo separado por semana do orçamento, claramente identificado. Não misturar os dois eixos. Datas de criação no Trello ficam como dado de ingestão, não substitutas silenciosas.

Revisitar cada grupo nas semanas seguintes: uma venda fechada agora pode pertencer a uma entrada de meses atrás. Mostrar quantidade inicial, quantos receberam orçamento, quantos confirmaram venda/assinaram e quantos pagaram. Exibir coortes semanais e consolidado móvel de quatro semanas quando disponível; o baixo volume exige contagens e leitura prudente.

Para comparar conversão em 7/14/30/60/90 dias, usar apenas entradas que já tiveram aquele tempo de acompanhamento, exibindo o denominador elegível. Contatos em aberto não são automaticamente perdidos. Um grupo recente não pode parecer pior apenas porque ainda não teve tempo para fechar. Datas faltantes e casos ambíguos ficam visíveis, sem imputação.

Exibir mediana dos dias até orçamento, venda, assinatura e primeiro pagamento, com quantidade de casos completos e ainda abertos. Mediana apenas dos fechados pode parecer artificialmente rápida: rotular essa limitação. Por cliente, mostrar a linha real; no grupo, mostrar curvas acumuladas por dias desde a entrada e cortes de acompanhamento iguais.

## Indicadores e fórmulas

| Indicador | Regra |
|---|---|
| Conversão orçamento → venda | Oportunidades com orçamento enviado e venda confirmada vinculados, divididas por oportunidades únicas com orçamento enviado na mesma coorte e horizonte |
| Tempo até orçamento | quote_sent_at − first_contact_at, somente com marcos válidos |
| Tempo de venda | sale_confirmed_at − first_contact_at; assinatura pode ser mostrada separadamente |
| Tempo até primeiro recebimento | first_payment_settled_at − first_contact_at; também separar venda → recebimento quando houver datas |
| Custo de mídia por orçamento/contrato | Investimento atribuído ao universo dividido pelos orçamentos/contratos atribuídos do mesmo universo e janela |
| Aquisição de cliente novo | Separar clientes novos de novos contratos de recorrentes; custo apenas de anúncios é componente de mídia, não CAC total |
| Receita contratada atribuída / mídia | Indicador preliminar do valor de contratos confirmados atribuídos; sinalizar cancelamentos, revisões e valores não recebidos |
| Receita recebida atribuída / mídia | Relação de entradas efetivamente conciliadas e investimento correspondente; identificar regime de caixa e deduzir estornos segundo fonte |
| Retorno/lucro | Exige receitas e custos comprovados, incluindo serviço, frete, operador, taxas e mídia uma única vez. Sem custos, lucro/ROI fica null |
| Prazo de recuperação da mídia | Data em que a margem de contribuição acumulada comprovada da coorte cobre seu custo de aquisição; sem custos, mostrar apenas cobertura bruta por recebimentos, sem chamar isso de payback líquido |

Primeiro sinal recebido não comprova retorno completo do investimento nem lucro. Valor de combo/contrato não pode ser contado uma vez por serviço. Pagamento em parcelas/cartão deve distinguir sinal contratado, liquidação, taxas, prazo e crédito efetivo na conta.

Sem atribuição comprovada, mostrar razão global entre mídia e vendas da empresa como indicador agregado, sem chamar todas as vendas de vendas do Ads. Não dividir gasto de uma semana por contratos fechados naquela mesma semana se as oportunidades são de grupos diferentes. Não misturar caixa de contratos antigos com aquisição nova. Modelos de atribuição devem ser explícitos e estáveis; não inventar janela automática.

## Visualização pedida

1. **Linha horizontal por oportunidade:** primeiro contato conhecido, orçamento enviado, contrato enviado/assinado, venda confirmada e primeiro pagamento. Distância horizontal proporcional ao tempo; usar símbolos de precisão e evidência. Marcos ausentes aparecem como desconhecidos; no celular o gráfico rola dentro do contêiner.
2. **Funil comercial do mesmo grupo:** oportunidades únicas, orçamentos enviados, vendas confirmadas e pagamentos. Aquisição Ads/Maps e tráfego Wix entram como painel de contexto e rotas, sem fingir que todo clique se tornou uma sessão identificada.
3. **Curvas por tempo desde o contato:** orçamento, venda e primeiro pagamento acumulados, comparando coortes na mesma idade. Valores de dinheiro ficam em outro painel/escala; não misturar reais e pessoas em uma curva.
4. **Caixa por grupo:** custo de mídia, valor contratado e recebido acumulado da coorte; depois margem quando custos estiverem disponíveis. Linhas de contratado e recebido separadas. Não preencher com dados demonstrativos que pareçam resultados reais.
5. **Quadro de cobertura:** oportunidades resolvidas, candidatas/ambíguas, marcos ausentes, fontes atrasadas, importações e possíveis duplicatas. Links privados permitem conferir cada caso sem exibir telefone no gráfico.

Snapshot semanal conserva a definição, data de corte, cobertura e versão. Correções históricas recalculam e identificam a revisão, sem apagar o snapshot anterior. Repetir coleta não aumenta a contagem nem recria venda.

## Aceite finito desta extensão

Confirmar um vínculo real orçamento ↔ contrato por identidade/evento; um caso sem vínculo não é venda zero. Confirmar que importações tardias e duplicatas não entram como aquisição nova. Separar contrato enviado de assinado e data financeira relatada de liquidação primária. Validar um cálculo de duração possível e um bloqueado por data ausente, conservar o estado anterior dos cartões e emitir o arquivo analítico privado. Não reabrir homologações de Vendas/Financeiro/Operação, alterar contratos ou executar campanhas.

Dados desta primeira inspeção são evidência pontual da estrutura e de casos, não medição integral da empresa nem taxa de conversão já apurada. A execução recorrente deverá recuperar as fontes faltantes e declarar cobertura.

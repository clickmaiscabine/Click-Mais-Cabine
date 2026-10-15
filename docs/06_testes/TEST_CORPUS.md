# TEST CORPUS — Esteira de Orçamento, Flow 1 (provisório)

- **Status:** draft; armazenado para aferição; **nenhum teste executado**.
- **Data:** 2026-10-15.
- **Origem:** bateria apresentada pelo responsável da Click Mais Cabine, com mensagens simuladas e quatro casos descritos como regressões anonimizadas.
- **Objetivo:** testar entrada, classificação de intenção, coleta dos dados, decisão do próximo fluxo e transição na esteira de orçamento (Flows 1–7).
- **Arquitetura de referência:** CM-WF-000, CM-WF-010, CM-WF-020, CM-WF-040; PR #19 (ainda não mesclado).
- **Preservação:** entradas mantidas conforme enviadas; os resultados esperados são por grupo e critérios transversais, não logs de execução.

## Critérios comuns de aprovação

1. Analisar **a mensagem inteira**; extrair serviço, finalidade, data e localidade, inclusive juntos ou fora da ordem de perguntas.
2. Registrar nome da pessoa, nome do homenageado, relação com evento, salão e endereço somente quando informados; ausência de nome/relação não bloqueia cotação.
3. Consultar e atualizar **ficha única persistente por contato/evento no Supabase**, usando o contexto já guardado; nunca repetir pergunta respondida.
4. Se faltar campo, perguntar **somente o próximo ausente**, nesta ordem: serviço → finalidade → data → localidade. Apresentar Click/empresa uma vez no início quando apropriado.
5. Origem só com evidência: metadado de CTA/link configurado ou declaração explícita do cliente. Distinguir declaração do cliente de atribuição verificada. Uma frase genérica não prova canal/landing page.
6. Distinguir pedido de dois serviços de dúvida entre alternativas; respeitar negações e mensagens de outros assuntos.
7. Evitar duplicação em recebimentos repetidos, mensagens consecutivas e processamento atrasado; guardar histórico e resolver conflitos sem inventar.
8. Com os quatro campos válidos, liberar somente **checagem interna de disponibilidade/preços homologados**, não envio direto. Cidade cadastrada pode bastar, São Paulo sem bairro/região exige complemento conforme regra oficial.
9. JEV interpreta apenas dados semânticos autorizados. **Supabase persiste; n8n orquestra; código determinístico verifica regras comerciais.**
10. Nenhuma execução de WhatsApp real, alteração de Meta, produção ou banco está autorizada por este documento.

### Reutilização nos sete conjuntos

**Flow 1:** apresenta a assistente Click e a empresa; identifica principalmente o serviço, extrai todos os demais fatos disponíveis, e encaminha ao primeiro campo ainda ausente. **Flow 2:** finalidade. **Flow 3:** data. **Flow 4:** localidade. **Flow 5:** avisa que há dados suficientes. **Flow 6:** valida internamente disponibilidade/preço. **Flow 7:** envia orçamento aprovado, após Guards e checagens. Um cliente não percorre necessariamente todas as etapas.

## Índice

| Grupo | Tema | Casos |
|---|---|---:|
| A | Aberturas curtas e saudações | 20 |
| B | Pedidos de preço sem serviço identificado | 15 |
| C | Serviço mencionado, com dados incompletos | 15 |
| D | Aberturas que mencionam a origem | 20 |
| E | Papel na organização do evento | 25 |
| F | Múltiplos dados na mesma mensagem | 20 |
| G | Incompletas, ambíguas e exceções | 20 |
| R | Regressões de conversas anteriores (anonimizadas) | 4 |
| T | Roteiros para preenchimento progressivo | 10 |
| V | Linguagem informal, erros e áudio transcrito | 15 |
| **Total** | **10 grupos** | **164** |

## Bateria de casos
### A — Aberturas curtas e saudações

**Esperado:** Detectar saudação/início sem dados suficientes; iniciar coleta por serviço e não inventar outros dados.

| ID | Mensagem ou roteiro |
|---|---|
| A01 | Oi |
| A02 | Olá, tudo bem? |
| A03 | Bom dia! |
| A04 | Boa tarde 😊 |
| A05 | Boa noite |
| A06 | Oi, tudo bem? Gostaria de uma informação |
| A07 | Olá! Pode me ajudar? |
| A08 | Oi, achei o contato de vocês |
| A09 | Boa tarde, queria falar com alguém |
| A10 | Oi, queria saber mais sobre o trabalho de vocês |
| A11 | Olá! Estou organizando uma festa |
| A12 | Oi, estou começando a pesquisar fornecedores |
| A13 | Bom dia! Vocês estão atendendo? |
| A14 | Boa noite, posso tirar uma dúvida? |
| A15 | Oi! Vi o trabalho de vocês e gostei |
| A16 | Tudo bem? Queria conversar sobre um evento |
| A17 | Oi, vocês podem me passar umas informações? |
| A18 | Boa tarde! Queria entender como funciona |
| A19 | Oi, cheguei pelo WhatsApp de vocês |
| A20 | Olá, queria falar sobre uma comemoração |

### B — Pedidos de preço sem serviço identificado

**Esperado:** Reconhecer intenção comercial, sem presumir o serviço se o texto não o traz e não houver CTA conhecido com evidência.

| ID | Mensagem ou roteiro |
|---|---|
| B01 | Queria um orçamento, por favor |
| B02 | Quanto custa para contratar vocês? |
| B03 | Pode me passar os valores? |
| B04 | Quanto fica para uma festa? |
| B05 | Gostaria de saber os preços |
| B06 | Vocês podem fazer uma cotação para mim? |
| B07 | Preciso de um orçamento para um evento |
| B08 | Me manda uma proposta, por favor |
| B09 | Qual é o valor do serviço? |
| B10 | Estou pesquisando preços para uma comemoração |
| B11 | Vocês têm pacotes? |
| B12 | Queria ver as opções e os valores |
| B13 | Encontrei o botão “Quero um orçamento” e vim falar com vocês |
| B14 | Cliquei no botão de orçamento da página. Como funciona? |
| B15 | Quero fechar um orçamento, mas ainda não sei qual opção escolher |

### C — Serviço mencionado, com dados incompletos

**Esperado:** Registrar serviço mencionado e perguntar próximo campo ausente. Não confundir comparação entre alternativas com pedido de combo.

| ID | Mensagem ou roteiro |
|---|---|
| C01 | Quanto custa a cabine de fotos? |
| C02 | Queria um orçamento da cabine para uma festa |
| C03 | Vocês alugam cabine fotográfica? |
| C04 | Estou procurando uma cabine para meu evento |
| C05 | Queria saber como funciona a cabine de fotos |
| C06 | Vocês têm totem de fotos? |
| C07 | Quanto fica o totem para uma comemoração? |
| C08 | Tenho interesse na plataforma 360 |
| C09 | Queria contratar a plataforma 360 para uma festa |
| C10 | Vocês fazem vídeo na plataforma giratória? |
| C11 | Estou em dúvida entre cabine e plataforma 360 |
| C12 | Queria cabine e totem, vocês trabalham com os dois? |
| C13 | Me passaram o contato para contratar a cabine |
| C14 | Vi as fotos da plataforma 360 e queria saber o preço |
| C15 | Vocês trabalham com cabine? |

### D — Aberturas que mencionam a origem

**Esperado:** Registrar a origem declarada como relato e extrair os dados do evento presentes; não inferir origem apenas pelo estilo da frase.

| ID | Mensagem ou roteiro |
|---|---|
| D01 | Vi o anúncio de vocês no Facebook e queria informações |
| D02 | Encontrei vocês pelo Instagram. Quanto custa a cabine? |
| D03 | Apareceu o trabalho de vocês para mim nas redes sociais |
| D04 | Vi um post de vocês e queria pedir um orçamento |
| D05 | Encontrei o WhatsApp de vocês no Google Maps |
| D06 | Achei vocês pesquisando no Google |
| D07 | Vi as avaliações de vocês no Google e gostaria de saber os valores |
| D08 | Encontrei o perfil da empresa no Maps. Vocês atendem minha cidade? |
| D09 | Uma amiga que contratou vocês me passou o contato |
| D10 | A mãe de uma debutante me recomendou vocês |
| D11 | Meu primo fez uma festa com vocês e me indicou |
| D12 | A assessora do evento me passou este número |
| D13 | Recebi uma indicação e queria saber como funciona |
| D14 | Peguei o contato de vocês numa foto impressa que recebi |
| D15 | A gente recebeu as fotos da festa e veio o contato de vocês nelas |
| D16 | Vi o número de WhatsApp no verso da foto da minha filha |
| D17 | Peguei o cartão de vocês numa lembrança impressa do evento |
| D18 | Encontrei o contato no material que veio junto das fotos |
| D19 | Recebi uma foto impressa com o WhatsApp de vocês e queria contratar |
| D20 | Minha irmã guardou o contato de vocês das fotos da festa dela |

### E — Papel na organização do evento

**Esperado:** Classificar o papel quando declarado; registrar finalidade se reconhecida; nome e papel não bloqueiam orçamento.

| ID | Mensagem ou roteiro |
|---|---|
| E01 | Sou a noiva e estou organizando nosso casamento |
| E02 | Sou o noivo. Estamos vendo fornecedores para o casamento |
| E03 | Sou a mãe da noiva e estou pesquisando a cabine para ela |
| E04 | Sou o pai da noiva. Queria ver um orçamento |
| E05 | Sou irmã do noivo e estou ajudando nos preparativos |
| E06 | Sou tia da noiva e fiquei responsável por pesquisar atrações |
| E07 | Estou ajudando minha filha a organizar o casamento |
| E08 | Minha sobrinha vai casar e estou vendo opções para a festa |
| E09 | Sou a debutante e queria saber quanto custa |
| E10 | Sou a mãe da debutante e estou cuidando dos fornecedores |
| E11 | Sou o pai da aniversariante. Vocês podem fazer um orçamento? |
| E12 | Sou irmã da debutante e queria mostrar a plataforma para ela |
| E13 | Sou tia da aniversariante e estou ajudando a organizar a festa |
| E14 | Minha filha vai fazer 15 anos e estamos pesquisando cabine de fotos |
| E15 | É a minha festa de aniversário e queria uma cabine |
| E16 | Estou organizando uma festa surpresa para minha mãe |
| E17 | Sou a pessoa homenageada e quero saber como contratar |
| E18 | Sou assessora de eventos e estou cotando para uma cliente |
| E19 | Trabalho com cerimonial e gostaria de conhecer os serviços |
| E20 | Sou organizadora de eventos e preciso de uma proposta para um casamento |
| E21 | Sou responsável pelas cotações da empresa |
| E22 | Estou fazendo orçamento para a confraternização da firma |
| E23 | Cuido dos eventos internos da empresa e gostaria de uma cotação |
| E24 | Sou do RH e estou organizando a festa de fim de ano |
| E25 | Fiquei responsável por encontrar atrações para o evento corporativo |

### F — Múltiplos dados na mesma mensagem

**Esperado:** Extrair todos os campos presentes; pular perguntas redundantes; liberar checagem só com serviço, finalidade, data específica e localidade suficiente.

| ID | Mensagem ou roteiro |
|---|---|
| F01 | Bom dia! Quero cabine para meu casamento em Suzano no dia 20/11/2027 |
| F02 | Sou a mãe da noiva. O casamento será em Mogi das Cruzes, em 14 de março de 2027, e gostaríamos de cabine |
| F03 | Queria orçamento da plataforma 360 para um aniversário em Poá, dia 24/01/2027 |
| F04 | A festa de 15 anos da minha filha será em Santa Isabel, em 23/08/2027. Queremos cabine |
| F05 | É uma confraternização da empresa em Guarulhos, no dia 10/12/2026. Quero cotação para cabine |
| F06 | Somos assessoria do casamento de outubro, em Suzano, e queremos cotar cabine e plataforma 360 |
| F07 | A debutante sou eu. Minha festa será dia 18/07/2027, em Mogi. Quero saber da plataforma 360 |
| F08 | Quero cabine de fotos para o aniversário do meu pai, em Itaquaquecetuba, no dia 7 de maio de 2027 |
| F09 | Boa noite, sou a noiva. Nosso casamento será em Bertioga no dia 12/06/2027. Quanto fica a cabine? |
| F10 | Precisamos de cabine para uma festa da empresa em Santo André, dia 3 de dezembro de 2026 |
| F11 | Minha irmã vai fazer 15 anos em Ferraz de Vasconcelos em 21/11/2026. Gostaria de cotar o totem |
| F12 | É para uma festa de aniversário em Suzano, dia 24/01/2027. Temos interesse na cabine |
| F13 | Sou assessora: casamento em Mogi das Cruzes, 15/05/2027, cabine de fotos. Pode enviar a proposta? |
| F14 | Para nossa confraternização corporativa em Poá, dia 18/12/2026, estamos vendo plataforma 360 |
| F15 | O aniversário é da minha mãe, em Guarulhos, no dia 30/01/2027. Queremos cabine e plataforma |
| F16 | Casamento em Santos, 5 de junho de 2027, plataforma 360. Sou irmã da noiva e estou cotando |
| F17 | Minha filha faz 15 anos no dia 2 de abril de 2027, em Mogi. Queremos saber o preço da cabine |
| F18 | A festa da empresa será em Campinas, dia 10/10/2027. Queremos cotação para cabine de fotos |
| F19 | Sou o noivo. Casamento em Suzano, 23/08/2027. Queremos cabine e plataforma 360 |
| F20 | É um aniversário em São Bernardo do Campo, no dia 22/05/2027, e quero orçamento da plataforma 360 |

### G — Incompletas, ambíguas e exceções

**Esperado:** Nunca completar lacunas por suposição; pedir esclarecimento específico e preservar fatos conhecidos.

| ID | Mensagem ou roteiro |
|---|---|
| G01 | Quero cabine para meu casamento em Suzano |
| G02 | Quero cabine para um aniversário no dia 20 de novembro |
| G03 | A festa será em janeiro de 2027. Quanto custa a cabine? |
| G04 | Vai ser em São Paulo, quero uma plataforma 360 para casamento dia 15/05/2027 |
| G05 | Quero orçamento da cabine para uma festa no Alto Tietê |
| G06 | A festa é em Mogi, dia 24/01. Vocês têm cabine? |
| G07 | Queria cabine para o casamento da minha irmã, provavelmente no segundo semestre |
| G08 | Ainda não sabemos o local nem a data, mas é um aniversário |
| G09 | Gostaria de plataforma 360 para um evento, mas ainda estou vendo a data |
| G10 | Vocês atendem em Suzano? |
| G11 | Vocês fazem cabine para fotos de documentos? |
| G12 | Queria contratar vocês, mas ainda não sei qual serviço escolher |
| G13 | Minha festa é no mês que vem. Quanto fica? |
| G14 | Quero cabine para a festa do dia 12/08 |
| G15 | É para um evento em São Paulo |
| G16 | Quero orçamento da cabine para minha festa de casamento. Depois passo o restante |
| G17 | A festa é dia 23/08, em Santa Isabel. Quanto custa? |
| G18 | Quero saber o preço para festa de 15 anos |
| G19 | Fazem eventos empresariais? |
| G20 | Vocês têm cabine, totem e plataforma? Queria entender as diferenças |

### R — Regressões de conversas anteriores (anonimizadas)

**Esperado:** Distinguir novo lead, pergunta fora do escopo e atendimento operacional; exemplos apresentados pelo autor como trechos anteriores.

| ID | Mensagem ou roteiro |
|---|---|
| R01 | Olá |
| R02 | Boa tarde, vocês fazem fotos rápidas para documentos? |
| R03 | Oi, bom dia. Vocês já estão chegando? |
| R04 | Orçamento do frete da festa de domingo… destino: [endereço omitido] |

### T — Roteiros para preenchimento progressivo

**Esperado:** Manter a ficha única persistida; pular campos já recebidos, validar múltiplas mensagens e impedir repetição de perguntas e respostas.

| ID | Mensagem ou roteiro |
|---|---|
| T01 | Cliente: “Quero orçamento da cabine.” → JEV pergunta a finalidade. Cliente: “Casamento.” → JEV pergunta a data. Cliente: “14/03/2027.” → JEV pergunta a cidade. |
| T02 | Cliente: “Cabine para aniversário em Suzano.” → JEV pergunta a data, sem perguntar serviço nem finalidade novamente. |
| T03 | Cliente: “Sou a mãe da debutante. A festa é em Mogi, 21/11/2026, e queremos cabine.” → JEV reconhece os dados já completos; não pergunta o nome da mãe para liberar o orçamento. |
| T04 | Cliente: “Quero cabine para meu casamento em Santa Isabel no dia 23/08/2027.” → JEV reconhece serviço, finalidade, localidade e data na primeira mensagem; segue para as checagens do orçamento. |
| T05 | Cliente: “É para uma festa da empresa em Campinas.” → JEV reconhece finalidade e localidade; pergunta o serviço e, depois, a data, sem tratar “empresa” como nome do serviço. |
| T06 | Cliente: “Sou assessora de eventos. Quero cotar cabine e plataforma 360 para casamento em Suzano, dia 20/11/2027.” → JEV registra o papel, os dois serviços, finalidade, data e localidade; avalia a regra de orçamento para os serviços solicitados. |
| T07 | Cliente: “Oi.” → JEV pergunta qual serviço procura. Cliente: “Plataforma 360 para aniversário.” → JEV registra ambos e pergunta a data. Cliente: “Dia 18/07/2027, em Poá.” → JEV completa a localidade e segue para o cálculo. |
| T08 | Cliente: “Quero cabine para um casamento em São Paulo, dia 15/05/2027.” → JEV registra os dados. Como “São Paulo” pode exigir bairro/região conforme a regra cadastrada, pede somente essa precisão. |
| T09 | Cliente: “Quero cabine para minha festa em 23/08.” → JEV não inventa o ano; confirma o ano e preserva o serviço e a data parcial já recebidos. |
| T10 | Cliente: “Sou a noiva e quero plataforma 360 para nosso casamento em Santos, 05/06/2027.” → JEV registra o papel e os quatro dados do orçamento sem perguntar o nome da noiva. |

### V — Linguagem informal, erros e áudio transcrito

**Esperado:** Reconhecer variações e expressões implícitas sem inventar dados.

| ID | Mensagem ou roteiro |
|---|---|
| V01 | Oi, vcs fazem cabine de foto? |
| V02 | Queria um orçamento da cabine pfv |
| V03 | Boa noitee, tem plataforma 360? |
| V04 | Minha filha vai fazer 15 anos e queria ver os valores da cabine |
| V05 | O casamento vai ser em Suzano dia 20/11/27. Tem cabine? |
| V06 | A festa é em Mogi das Cruzes, 24 jan 2027, queria o totem |
| V07 | Oi, vim pelo face, queria saber da plataforma |
| V08 | Vi vcs no google, trabalham com cabine pra aniversário? |
| V09 | Minha amiga indicou vcs pra festa da minha sobrinha |
| V10 | O contato veio nas fotos da festa, queria cotar pra minha empresa |
| V11 | “Cabine casamento Suzano 23 de agosto de 2027” (transcrição de áudio) |
| V12 | “Queria ver aquela plataforma que grava o vídeo girando” |
| V13 | “Fotos na hora para os convidados levarem, como chama esse serviço?” |
| V14 | “A gente queria cabine e aquele 360 junto” |
| V15 | “É uma festa de firma, em Guarulhos, em dezembro. Como funciona?” |

## Pontos especiais de checagem (não são resultados medidos)

- **B13/B14:** CTA de landing page precisa estar comprovadamente mapeado para identificar a origem e o produto.
- **C11/C12/G20:** citar/considerar vários serviços não equivale sempre a solicitar combo.
- **F06:** o texto indica só o mês de outubro; falta data exata para checar disponibilidade.
- **G02/G06/G14/G17/T09:** não inventar ano.
- **G03/G07/G09/G13/V15:** datas parciais, relativas ou incertas não devem ser tratadas como definitivas.
- **G04/G15/T08:** São Paulo/capital requer complemento da região, bairro ou zona.
- **G05:** região Alto Tietê não deve ser automaticamente assumida como cidade tarifada.
- **G11/R02:** serviços de foto para documentos não devem acionar o fluxo de festa sem confirmação.
- **R03/R04:** preservar contexto de evento existente e direcionar a atendimento operacional, sem iniciar nova venda.
- **T01–T10:** aferição deve abranger vários turnos, estado persistido e proteção de idempotência.
- **R01–R04:** rotulados como regressão segundo o material recebido; nenhum histórico bruto foi anexado a este arquivo.

## Protocolo de aferição posterior

Para cada ID registrar: versão do workflow; payload e estado anterior; fatos extraídos e evidências; estado persistido; campo faltante; próxima rota/pergunta; duplicações/conflitos; saída observada; esperado vs. observado; PASS/FAIL; ID da execução simulada. **Ainda não há resultados.**

## Cobertura a ampliar

Inclui predominantemente cabine, totem e plataforma 360. Adicionar corpus específico para Set Fotográfico e Fotógrafo quando a esteira for ampliada; esta versão não declara cobertura total desses serviços.
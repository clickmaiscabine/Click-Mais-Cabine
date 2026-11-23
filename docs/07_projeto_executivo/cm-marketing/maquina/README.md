# Máquina de moldes semanais da Click Mais

Status: development — protótipo funcional, sem implantação no Hermes/Painel.

Propósito do departamento: **proteger os canais e melhorar seu resultado**. A máquina transforma uma ficha padronizada em um molde semanal versionado. O arquivo desses moldes alimenta curvas temporais e registra intervenções. Não depende de um prompt para reconstruir o histórico.

## Abrir e experimentar

Abra `dashboard-standalone.html` no navegador. Funciona sem rede, CDN, credenciais ou instalação. A versão pública abre oito semanas explicitamente fictícias. A opção Dados reais só mostra fichas reais importadas. Demonstração não compõe resultados reais.

1. Abra Ficha de ingestão, escolha a semana completa e preencha valores/fontes. Vazio significa desconhecido; zero observado é zero.
2. Clique Validar e inserir o molde. Alternativamente importe a ficha `.json`, um lote de fichas ou um arquivo histórico exportado.
3. Confira as curvas em Modelagem. Selecione pontos do percurso, filtre as semanas/mês e compare a evolução em base 100.
4. Em Arquivo de moldes, inspecione fonte/cobertura e crie nova revisão. A revisão maior substitui a medição no gráfico, preservando versões anteriores.
5. Exporte o histórico para transferir ou conservar os dados. O navegador pode guardar localmente quando permitido; isso não substitui o arquivo privado do gerente. HTML inicial aberto novamente com cache antigo mantém a maior revisão local.

## Peças entregues

- `core.js`: catálogo e regras, validação, montagem de contribuições, idempotência, revisões, séries com lacunas e agregação conservadora. Usa browser e Node.js sem dependências externas.
- `ficha.schema.json`: contrato da ficha completa. As regras temporais adicionais são verificadas pelo motor; schema sozinho não substitui `validate`.
- `ficha-vazia.json`: gabarito pronto, com null e fontes definidas, sem métricas reais.
- `contribuicoes-exemplo.json`: entrada fictícia/sintática para a função assemble; adaptar modo/fontes e dados na integração.
- `dashboard.html`, `ui.js`, `demo.js`: interface de ficha, arquivo e gráficos; o exemplo é fictício.
- `build.js`: monta HTML autônomo, podendo incorporar o arquivo privado para leitura sem rede.
- `ingest.js`: importador local para o gerente, sem criar cron. Lê todos os JSONs da pasta, valida antes de gravar e produz arquivo histórico, painel e recibo técnico.
- `test.js`: testes finitos dos caminhos de falha observados e regras desta máquina.

## Alimentação pelos coletores

Cada fonte entrega uma contribuição no período exato da ficha, com collected_at e medições já normalizadas. `assemble(period, contributions, meta)` une campos de fontes distintas e recusa valores conflitantes. Apenas a fonte indicada no catálogo pode preencher sua métrica. Não somar duas coletas do mesmo campo; decidir a fonte canônica no adaptador e deixar a conciliação em notas/evidências. Revisão de definição exige nova versão de contrato, não uma curva silenciosamente diferente.

As contribuições não são APIs nativas Ads/Wix/Trello. São saídas normalizadas dos coletores existentes. O adaptador deve confirmar unidade, definição e período: Ads fim inclusivo; Wix fim exclusivo; custo em BRL somente após conversão real; números semanais de CRM referem-se a oportunidades únicas/eventos, sem importar como novas as fichas de clientes já contratados. Fonte ausente fica null/blocked/unknown. Extrato de saldo tem seu retrato/data na evidência, não é subtração de recarga.

Semanas: segunda 00h até segunda seguinte exclusiva, America/Sao_Paulo, coletadas depois de encerradas. Semana corrente não vira molde fechado. Não repartir e-mail mensal Maps em semanas. O filtro Mês do visualizador seleciona o início das semanas e conserva pontos semanais; não é soma do mês civil. Visitantes únicos não são somados entre semanas, nem saldo de faturamento. Semanas ausentes viram lacunas. Sem cobertura completa/denominador positivo, razões ficam null. As curvas de fluxos semanais não são taxas de conversão das mesmas pessoas. A jornada vinculada/curvas por coorte continuam no `journey.json` da DEC-019; previsões não integram esta versão.

## Acoplar ao Hermes

Use o agendamento semanal já existente. Não criar um novo leitor de e-mail ou outro dispatcher. O gerente coordena contribuições Codex/coletores e fecha a ficha. Guarde inputs e estado em destino **privado fora do repositório público**.

Exemplo de execução Node, com caminhos escolhidos e provisionados pelo gerente:

```bash
node ingest.js --store /CAMINHO_PRIVADO/arquivo --inbox /CAMINHO_PRIVADO/entrada --out /CAMINHO_PRIVADO/saida
```

Esses caminhos são exemplos, não instalação existente. Entrada, arquivo e saída devem ser separados. O importador não apaga a entrada: repetição do mesmo conteúdo é ignorada; mesmo ID/revisão com conteúdo diferente é conflito, não soma nem sobrescrita. Outra revisão preserva o anterior. Um lote inválido não muda o arquivo. Exclusão/alteração de oportunidade no CRM não faz parte desta máquina.

`saida/dashboard.html` contém o arquivo real incorporado e deve continuar privado. `history.json` conserva revisões, `latest.json` fornece os moldes correntes. `ingestion-receipt.json` prova aceitação pelo motor, **não recebimento pelo Hermes**. O gerente registra seu próprio ack específico depois de conferir hash/artefatos. Se uma gravação de saída falhar após o arquivo histórico ter sido salvo, reexecutar é seguro: o histórico é idempotente e as saídas são reconstruídas. Escritas individuais são atômicas; o conjunto de arquivos não é uma transação de banco.

O lock impede dois processos simultâneos; queda do processo pode exigir recuperação do lock pelo gerente, depois de confirmar que não existe execução ativa. Não remover lock automaticamente com outro processo vivo.

## Acoplar ao Painel da Vida

O Hermes deve servir a saída em rota privada/local do painel e incorporar o HTML em uma aba/iframe de mesma origem, ou reutilizar o motor e o visualizador. Não ativar GitHub Pages nem servir conteúdo real publicamente. Este protótipo não altera o aplicativo existente nem configura rede/acesso.

A API da interface `window.ClickMaisDashboard.ingest(fichaOuArquivo)` valida e incorpora dados. `exportArchive()` retorna cópia do histórico real/local; `setMode('real')` seleciona a vista. Para iframe, usar a mesma origem e chamar a API depois do evento load. Não há receptor genérico postMessage, fetch automático, token embutido ou endpoint inventado. Uma integração de rota/arquivo real deve ser implementada pelo mantenedor do painel.

## Proteção e acompanhamento

Alertas no molde não substituem a vigilância diária; carregam ID, estado e responsável. Ausência em outra ficha não resolve automaticamente um alerta anterior. Resolução exige atualização explícita do mesmo ID. Cobertura desconhecida nunca significa canal saudável. Intervenções marcam data/descrição/responsável, sem tratar correlação como causalidade.

Somente código, contratos, gabaritos vazios e demonstrações fictícias entram no repositório público. Históricos reais, fichas preenchidas, recibos e HTMLs com métricas ficam privados. Publicar a máquina não autoriza publicar seus dados.

## Verificação e aceite de implantação

Rodar `node test.js`. Há validação de lacunas versus zero, períodos, revisão/conflito, lote atômico, fontes conflitantes, demonstração isolada, métricas não aditivas e importação por processo. O aceite local requer uma ficha real, a saída gerada e ack do gerente; a incorporação ao Painel exige conferir a rota real. Protótipo funcional não significa instalação concluída.

# Ordem de acoplamento da máquina de Marketing

Status: review

O dono autorizou a entrega deste protótipo e seu acoplamento posterior. Propósito do departamento: proteger os canais e melhorar seu resultado. A interface é o lugar de acompanhamento; o arquivo de moldes é o registro analítico persistente. Nenhum prompt deve substituir esse arquivo.

## O que já existe neste pacote

Ficha normalizada com 20 pontos de observação; montagem de contribuições; motor Node/browser sem dependências; importador de pasta; arquivo histórico com revisões; tela de gráficos com filtro, seleção de curvas e base 100; arquivo de moldes e formulário de ingestão. A demonstração de oito semanas é inteiramente fictícia. O pacote privado do dono pode incluir uma primeira ficha real parcial, identificada e separada.

## Executar usando o ambiente existente

1. Leia README.md desta pasta, core.js e os contratos. Preserve a implantação local e os aceites já registrados no PR25, inclusive os da DEC-019. Não reabrir os departamentos anteriores.
2. Configure três diretórios privados distintos: entrada de fichas/contribuições; arquivo durável; saída do visualizador. Use o mecanismo de autorização já existente. Não criar repositório público de dados nem GitHub Pages. Não presumir um caminho/credencial local porque a coleta cloud funcionou.
3. Faça o gerente reunir as contribuições do Codex e dos coletores existentes. O adaptador deve escrever ficha completa ou pacote weekly_contributions do exemplo, alterando o modo para real somente com dados/evidências reais. `core.assemble` une campos complementares e recusa conflitos; `core.validate` valida o molde. Sem fonte, null; não transformar falha em zero.
4. No MESMO job semanal existente, após a coleta e montagem, execute o importador: `node ingest.js --store DIRETORIO_PRIVADO_ARQUIVO --inbox DIRETORIO_PRIVADO_ENTRADA --out DIRETORIO_PRIVADO_SAIDA`. Não criar outro cron. A vigilância diária de e-mails/avaliações continua separada, reaproveitando o coletor e seus cursores.
5. Sirva `saida/dashboard.html` em rota privada/local do Painel da Vida ou incorpore o visualizador de mesma origem. Não alterar o restante do aplicativo. O dono acompanha a tela; o gerente mantém as fichas e o histórico. Se optar por `latest.json`/API da interface, preserve também history.json com revisões como fonte durável.
6. Confira a aceitação do motor e registre seu próprio ack com pacote, hash e caminho. `accepted_by_machine` não é recibo do Hermes. Verifique a incorporação na rota real antes de afirmar que está no Painel da Vida.

## Aceite finito

- Uma ficha real fecha a semana correta e conserva as ausências.
- Repeti-la não cria outra semana; mesma revisão alterada é recusada; revisão maior preserva a anterior e atualiza a curva.
- Uma nova semana acrescenta ponto; lacuna entre semanas não vira zero nem linha contínua inventada.
- O arquivo pode ser exportado/restaurado; demonstração e real ficam separados.
- A tela incorporada abre com os mesmos moldes do arquivo; recebido pelo gerente só com ack.

O motor passou nos testes de ingestão/histórico e na execução de pasta. A verificação visual por navegador foi bloqueada no ambiente desta entrega; confirme ficha, botões, importação e leitura de gráficos na rota local real durante o acoplamento, sem criar outra bateria de auditoria. Não há pedido ao dono para aprovar decisões técnicas de rotina.

## Limites preservados

Não mover cartões, alterar contratos/event_key, reintroduzir Processados, alterar campanhas/verba ou publicar conteúdo. Gráficos de fluxo semanal não são conversão das mesmas pessoas; journey.json continua responsável pelos vínculos individuais/coortes. Previsão/modelagem prospectiva fica para uma etapa futura.

# Atlas Operacional Click Mais — registro de governança

Status: homologated
Data: 2026-11-26
Artefato: `clickmaiscabine/atlas-operacional` (repositório privado)
Snapshot: `CM-ATLAS-812448a3834c` · versão 1.0.0 · edição documental de 21–24/11/2026

## O que é

Ferramenta local que consolida os dez blueprints de departamento da Click Mais em um mapa
navegável de exploração, análise e desenho do ecossistema: mapa da empresa, grafos internos por
área, componentes, fluxos, sistemas e fontes de dados, agenda de jobs, lacunas e pontos de
conciliação entre documentos, além de um Designer de cenários.

Roda como arquivo único no navegador: sem instalação, sem servidor, sem internet e sem consumo
de crédito de IA. É **retrato documental** da edição — não é monitoramento ao vivo e não aciona
sistema, mensagem, pagamento ou job.

## Onde estão os arquivos

Os artefatos (ferramenta HTML, base estruturada, manual, provas de homologação, registro de
entregas e os pacotes de trabalho de cada perfil) ficam no repositório privado
`clickmaiscabine/atlas-operacional`.

Este repositório público guarda apenas este registro de governança, com a finalidade de
rastreabilidade. **Não** versiona a base nem os pacotes: eles contêm valores financeiros
internos, lacunas operacionais e responsabilidades por setor.

## Fluxo de trabalho

1. O dono abre a ferramenta, ajusta cenários quando necessário.
2. Em **Base e entregas**, gera **Pacote JSON** e **Instrução .md** para o perfil destinatário
   (`cm-bi` ou `cm-co`).
3. O pacote é entregue ao perfil, que devolve um registro por foco com fonte, cobertura,
   resultado observado, prova, decisão, responsável e prazo.
4. Revisão aprovada entra por **Importar base JSON revisada**, preservando a edição e os IDs
   anteriores.

## Regras de uso

- Fonte tem autoridade por campo: contrato manda no total; livro com extrato manda no movimento;
  Operação manda no frete.
- Definição, configuração e prova são estágios distintos: job agendado não prova execução;
  conteúdo produzido não prova entrega, leitura, aceite ou conclusão.
- Ausência de fonte é desconhecida, nunca zero.
- Pacote de trabalho é de leitura e desenho: não autoriza alteração autônoma nem reprocessamento.
- Aprovação de cenário é decisão registrada, não implantação.

## Manutenção

- Atualizações da base entram somente por nova edição documental gerada pelo dono.
- Os arquivos do pacote não devem ser editados à mão.
- Mudança no formato do handoff exige nova versão de `schema` no pacote e atualização deste
  registro.

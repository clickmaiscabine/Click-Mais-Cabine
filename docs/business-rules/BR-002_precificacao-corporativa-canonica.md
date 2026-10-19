# BR-002 — Precificação corporativa Click Mais

**Status comercial:** homologated, aprovado pelo responsável em 18/10/2026.  
**Status de integração:** qualificação, disponibilidade, motor, apresentação e fila conectados exclusivamente em LAB / Meta TEST; saída real confirmada como `sent`. Entrada corporativa genuína e E2E completo ainda pendentes. Produção preservada. Ver [relatório atual](../06_testes/BR002_TURNOS_3_5_IMPLEMENTACAO.md) e [evidências históricas do Turno 2](../06_testes/BR002_TURNO2_IMPLEMENTACAO.md).
**Escopo:** eventos corporativos, sem alterar preços do fluxo social.  
**Documento oficial no Drive:** https://docs.google.com/document/d/1Z--hPmKF7uRZ79BB7z39GGU0FP3km3IyvqzfKzPvn1Y/edit  
**Fonte canônica da faixa:** [01_BASE_OFICIAL_LOCALIDADES_E_PRECOS_META_AI.txt](https://drive.google.com/file/d/1ZkoS54blFcWQxC66OTnHuI9ZBu_ErFmH/view?usp=drivesdk), arquivo Drive de ID `1ZkoS54blFcWQxC66OTnHuI9ZBu_ErFmH`.

**Versão exata conferida em 18/10/2026:** revisão Drive `0B6VWt3lEydcWUFVOSTYrS0RESm9NRERaUUpBNzNMUm9IcG4wPQ`, última modificação `2026-08-30T05:50:16.516Z`. As oito faixas desta BR-002 foram cotejadas com a coluna **Pix unitário** dessa revisão. A coluna **Cartão unitário** pertence à regra social e **não** é base do cálculo empresarial. Não utilizar anexos de auditoria antigos como fonte substituta.

**Governança da versão:** este registro identifica a revisão homologada usada na elaboração; o Quote Engine deverá usar a versão operacional vigente da base canônica e registrar a versão efetivamente consultada em cada orçamento. Se houver revisão posterior, não presumir que as faixas permaneceram iguais; revalidar tabela de correspondência e testes antes da integração.

## Entradas

- `dias_evento`: inteiro positivo.
- `periodos_por_dia`: 1, 2 ou 3 (4, 8 ou 12 horas por dia).
- `valor_base_1_periodo`: preço unitário Pix da faixa oficial, recuperado pelo lookup autorizado; jamais inventado.

## Multiplicadores e valores diários de referência

| Faixa | 1 período | 2 períodos | 3 períodos |
|---|---:|---:|---:|
| T1190 | R$ 1.190 | R$ 1.785 | R$ 2.380 |
| T1290 | R$ 1.290 | R$ 1.935 | R$ 2.580 |
| T1390 | R$ 1.390 | R$ 2.085 | R$ 2.780 |
| T1490 | R$ 1.490 | R$ 2.235 | R$ 2.980 |
| T1590 | R$ 1.590 | R$ 2.385 | R$ 3.180 |
| T1690 | R$ 1.690 | R$ 2.535 | R$ 3.380 |
| T1790 | R$ 1.790 | R$ 2.685 | R$ 3.580 |
| T1890 | R$ 1.890 | R$ 2.835 | R$ 3.780 |

A tabela é **derivada**, não substitui a fonte canônica de preços por localidade.

## Fórmula

- Multiplicador = 1,0 (4h) ou 1,5 (8h) ou 2,0 (12h).
- Valor de 1 dia = preço-base × multiplicador.
- Total do evento e preço no cartão = valor de 1 dia × dias.
- Preço à vista = total × 0,82.
- Sinal = 50% do valor à vista; saldo = valor à vista − sinal.
- Cálculo em centavos inteiros; nenhuma aproximação para dezenas/centenas. Para frações de centavo intermediárias (ex.: base de R$ 1,01 × 1,5), arredondar tecnicamente uma vez ao centavo por dia, com empate para cima (half-up), depois multiplicar pelos dias; aplicar 82% e sinal também com arredondamento técnico half-up. Este comportamento não altera os oito preços-base homologados.
- A aplicação de 18% da regra do cartão social **não** entra nesse cálculo. Não aplicar promoção social de antecedência automaticamente no corporativo sem uma decisão expressa de composição.

## Exemplos de aceite

| Caso | Dia | Cartão total | À vista | Sinal |
|---|---:|---:|---:|---:|
| 3 dias × 2 períodos × T1390 | R$ 2.085,00 | R$ 6.255,00 | R$ 5.129,10 | R$ 2.564,55 |
| 1 dia × 3 períodos × T1190 | R$ 2.380,00 | R$ 2.380,00 | R$ 1.951,60 | R$ 975,80 |
| 3 dias × 2 períodos × base hipotética R$ 1.200 | R$ 1.800,00 | R$ 5.400,00 | R$ 4.428,00 | R$ 2.214,00 |

O último caso testa apenas a matemática: R$ 1.200 não é faixa homologada. Não arredondar R$ 4.428 para R$ 4.400.

## Segurança e integração

- Pular as perguntas cujo dado já seja conhecido; pedir número de dias, quantidade de períodos, datas e localidade conforme necessário.
- Consultar e aplicar as regras de lotação para **todas** as datas envolvidas; não prometer reserva sem contrato e sinal.
- Qualquer localidade ausente/ambígua, >3 períodos ou operação especial deve ir ao humano; não emitir preço inventado.
- Bloquear Álbum de Assinaturas como brinde para GRUPO_CORPORATIVO.
- Capacidade de 500 pessoas, nota fiscal e inclusão de custos extraordinários só devem ser prometidos com respaldo da base de serviços em vigor.
- O módulo matemático `src/functions/corporate-pricing.cjs` não seleciona localidade nem autoriza campanha; exige entrada previamente validada no Quote Engine.
- Testes em `src/functions/corporate-pricing.test.cjs` usam o `node:test` nativo (44 casos após correções de revisão) e são executados automaticamente em `.github/workflows/validate.yml` para cada PR contra `main`. Valores positivos menores que R$ 0,01 ou com frações de centavo na entrada, assim como overflow monetário, são recusados com erro específico.

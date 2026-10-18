# BR-002 — Precificação corporativa Click Mais

**Status comercial:** homologated, aprovado pelo responsável em 18/10/2026.  
**Status de integração:** código preparado e testado localmente, NÃO implantado em n8n/WhatsApp/Supabase de produção.  
**Escopo:** eventos corporativos, sem alterar preços do fluxo social.  
**Documento oficial no Drive:** https://docs.google.com/document/d/1Z--hPmKF7uRZ79BB7z39GGU0FP3km3IyvqzfKzPvn1Y/edit  
**Fonte canônica da faixa:** `01_BASE_OFICIAL_LOCALIDADES_E_PRECOS_META_AI.txt`.

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
- Cálculo em centavos; nenhuma aproximação para centenas.
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
- Testes em `src/functions/corporate-pricing.test.cjs` usam o `node:test` nativo.

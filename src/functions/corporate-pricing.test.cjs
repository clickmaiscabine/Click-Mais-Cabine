'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularOrcamentoCorporativo: calcular } = require('./corporate-pricing.cjs');

const faixas = [1190,1290,1390,1490,1590,1690,1790,1890];
const esperados = [
  [1190, 1785, 2380], [1290, 1935, 2580], [1390, 2085, 2780],
  [1490, 2235, 2980], [1590, 2385, 3180], [1690, 2535, 3380],
  [1790, 2685, 3580], [1890, 2835, 3780]
];

for (let i = 0; i < faixas.length; i++) {
  for (let p = 1; p <= 3; p++) {
    test(`Tabela oficial: base ${faixas[i]}, ${p} períodos`, () => {
      const r = calcular({ dias_evento: 1, periodos_por_dia: p, valor_base_1_periodo: faixas[i] });
      assert.equal(r.valor_1_dia, esperados[i][p-1]);
      assert.equal(r.horas_por_dia, p * 4);
      assert.equal(r.valor_parcelado, r.valor_total);
      assert.equal(r.sinal_50 + r.saldo_no_evento, r.valor_avista);
    });
  }
}

test('Exemplo 1 — 3 dias × 2 períodos × T1390', () => {
  const r = calcular({ dias_evento: 3, periodos_por_dia: 2, valor_base_1_periodo: 1390 });
  assert.deepEqual([r.valor_1_dia, r.valor_total, r.valor_avista, r.sinal_50], [2085, 6255, 5129.10, 2564.55]);
});

test('Exemplo 2 — 1 dia × 3 períodos × T1190', () => {
  const r = calcular({ dias_evento: 1, periodos_por_dia: 3, valor_base_1_periodo: 1190 });
  assert.deepEqual([r.valor_1_dia, r.valor_total, r.valor_avista, r.sinal_50], [2380, 2380, 1951.60, 975.80]);
});

test('Exemplo 3 — base hipotética 1200, somente verificação matemática', () => {
  const r = calcular({ dias_evento: 3, periodos_por_dia: 2, valor_base_1_periodo: 1200 });
  assert.deepEqual([r.valor_1_dia, r.valor_total, r.valor_avista, r.sinal_50], [1800, 5400, 4428, 2214]);
  assert.notEqual(r.valor_avista, 4400);
});

test('Não muda a regra corporativa com muitos dias', () => {
  const r = calcular({ dias_evento: 12, periodos_por_dia: 2, valor_base_1_periodo: 1490 });
  assert.equal(r.valor_total, 26820);
  assert.equal(r.valor_avista, 21992.40);
});

for (const entradas of [
  {dias_evento:0,periodos_por_dia:1,valor_base_1_periodo:1190},
  {dias_evento:-1,periodos_por_dia:1,valor_base_1_periodo:1190},
  {dias_evento:1.5,periodos_por_dia:1,valor_base_1_periodo:1190},
  {dias_evento:1,periodos_por_dia:0,valor_base_1_periodo:1190},
  {dias_evento:1,periodos_por_dia:4,valor_base_1_periodo:1190},
  {dias_evento:1,periodos_por_dia:2,valor_base_1_periodo:-1},
  {dias_evento:1,periodos_por_dia:2,valor_base_1_periodo:1190.001},
  {dias_evento:1,periodos_por_dia:2,valor_base_1_periodo:NaN}
]) {
  test('Recusar entrada inválida '+JSON.stringify(entradas), () => assert.throws(() => calcular(entradas), RangeError));
}

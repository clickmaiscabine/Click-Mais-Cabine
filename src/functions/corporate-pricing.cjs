'use strict';

/**
 * BR-002 | Orçamento corporativo Click Mais | homologated 2026-10-18
 * CÁLCULO PURO. O chamador deve obter valor_base_1_periodo
 * exclusivamente do lookup canônico de localidades e preços.
 * Esta função não consulta banco, não altera estado e não envia mensagens.
 */

const MULTIPLICADORES_EM_METADES = Object.freeze({ 1: 2, 2: 3, 3: 4 });

function centavos(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new RangeError('valor_base_1_periodo deve ser positivo e finito');
  }
  const convertidos = Math.round(valor * 100);
  if (!Number.isSafeInteger(convertidos) || Math.abs(convertidos / 100 - valor) > 1e-8) {
    throw new RangeError('valor_base_1_periodo deve ter no máximo duas casas decimais');
  }
  return convertidos;
}

function calcularOrcamentoCorporativo({ dias_evento, periodos_por_dia, valor_base_1_periodo }) {
  if (!Number.isSafeInteger(dias_evento) || dias_evento < 1) {
    throw new RangeError('dias_evento deve ser inteiro positivo');
  }
  if (!Object.hasOwn(MULTIPLICADORES_EM_METADES, periodos_por_dia) ||
      !Number.isInteger(periodos_por_dia)) {
    throw new RangeError('periodos_por_dia deve ser 1, 2 ou 3');
  }

  const baseCentavos = centavos(valor_base_1_periodo);
  const diaCentavos = baseCentavos * MULTIPLICADORES_EM_METADES[periodos_por_dia] / 2;
  const totalCentavos = diaCentavos * dias_evento;
  if (!Number.isSafeInteger(diaCentavos) || !Number.isSafeInteger(totalCentavos)) {
    throw new RangeError('valor monetário excedeu o limite seguro');
  }

  // Percentual empresarial canônico: avista = 82% do preço total no cartão.
  // Arredondamento técnico ao centavo (não à dezena ou centena mais próxima).
  const avistaCentavos = Math.round(totalCentavos * 82 / 100);
  const sinalCentavos = Math.round(avistaCentavos / 2);
  const saldoCentavos = avistaCentavos - sinalCentavos;

  return Object.freeze({
    dias_evento,
    periodos_por_dia,
    horas_por_dia: periodos_por_dia * 4,
    multiplicador: MULTIPLICADORES_EM_METADES[periodos_por_dia] / 2,
    valor_1_dia: diaCentavos / 100,
    valor_total: totalCentavos / 100,
    valor_parcelado: totalCentavos / 100,
    valor_avista: avistaCentavos / 100,
    sinal_50: sinalCentavos / 100,
    saldo_no_evento: saldoCentavos / 100,
  });
}

module.exports = { calcularOrcamentoCorporativo };

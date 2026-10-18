'use strict';

/**
 * BR-002 | Cálculo corporativo puro, homologado em 2026-10-18.
 * Faixas e preços são obtidos externamente da fonte canônica; não inferir.
 * Valores monetários são expressos em reais com no máximo 2 casas.
 */
const MULTIPLICADORES_EM_METADES = Object.freeze({ 1: 2, 2: 3, 3: 4 });
const MAX_CENTAVOS = BigInt(Number.MAX_SAFE_INTEGER);

function centavos(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new RangeError('valor_base_1_periodo deve ser positivo e finito');
  }
  // Verificar o limite antes de converter para centavos.
  if (valor > Number.MAX_SAFE_INTEGER / 100) {
    throw new RangeError('valor_base_1_periodo excede o limite monetário seguro');
  }
  const scaled = valor * 100;
  const arredondado = Math.round(scaled);
  // Tolerar somente ruído de ponto flutuante (ex.: 0.1 + 0.2).
  const tolerancia = Math.min(1e-7, Math.max(1, Math.abs(scaled)) * Number.EPSILON * 4);
  if (Math.abs(scaled - arredondado) > tolerancia) {
    throw new RangeError('valor_base_1_periodo deve ter no máximo duas casas decimais');
  }
  if (arredondado < 1) {
    throw new RangeError('valor_base_1_periodo deve ser de pelo menos R$ 0,01');
  }
  if (!Number.isSafeInteger(arredondado)) {
    throw new RangeError('valor_base_1_periodo excede o limite monetário seguro');
  }
  return BigInt(arredondado);
}

function calcularOrcamentoCorporativo({ dias_evento, periodos_por_dia, valor_base_1_periodo }) {
  if (!Number.isSafeInteger(dias_evento) || dias_evento < 1) {
    throw new RangeError('dias_evento deve ser inteiro positivo');
  }
  if (!Number.isInteger(periodos_por_dia) ||
      !Object.hasOwn(MULTIPLICADORES_EM_METADES, periodos_por_dia)) {
    throw new RangeError('periodos_por_dia deve ser 1, 2 ou 3');
  }
  const base = centavos(valor_base_1_periodo);
  const multiplicadorMetades = BigInt(MULTIPLICADORES_EM_METADES[periodos_por_dia]);
  // Round half-up ao centavo se multiplicador de 1,5 cria fração de centavo.
  const dia = (base * multiplicadorMetades + 1n) / 2n;
  const total = dia * BigInt(dias_evento);
  if (dia > MAX_CENTAVOS || total > MAX_CENTAVOS) {
    throw new RangeError('valor monetário excedeu o limite seguro');
  }
  const avista = (total * 82n + 50n) / 100n;
  const sinal = (avista + 1n) / 2n;
  const saldo = avista - sinal;
  const reais = cents => Number(cents) / 100;
  return Object.freeze({
    dias_evento,
    periodos_por_dia,
    horas_por_dia: periodos_por_dia * 4,
    multiplicador: Number(multiplicadorMetades) / 2,
    valor_1_dia: reais(dia),
    valor_total: reais(total),
    valor_parcelado: reais(total),
    valor_avista: reais(avista),
    sinal_50: reais(sinal),
    saldo_no_evento: reais(saldo)
  });
}
module.exports = { calcularOrcamentoCorporativo };

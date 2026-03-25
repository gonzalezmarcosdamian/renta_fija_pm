/**
 * cer.js — Consumo del coeficiente CER desde BCRA.
 *
 * CER (Coeficiente de Estabilizacion de Referencia):
 *   - Mide inflacion (derivado del IPC con ~5 dias de rezago)
 *   - Publicado diariamente por BCRA
 *   - Base 1.0 = 2 de febrero 2002
 *   - Al 2026-03 esta en ~731 (acumulado desde 2002)
 *
 * FUENTE: BCRA Serie estadistica N° 30
 * ENDPOINT: https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/30
 *
 * NOTA SOBRE CER T-10:
 *   Para liquidacion de bonos CER, no se usa el CER del dia.
 *   Se usa el CER de 10 dias habiles antes de la fecha de liquidacion.
 *   Esto es porque el CER se publica con rezago y el mercado usa el
 *   ultimo valor "firme" disponible.
 *
 * COMO SE USA:
 *   coef_CER = CER_actual / CER_emision
 *   Cada bono CER tiene un CER_emision fijo (del dia que se emitio).
 *   El coef_CER te dice cuanto se multiplico el capital desde la emision.
 */

/**
 * Obtiene el CER mas reciente del BCRA.
 *
 * @returns {Promise<{valor: number, fecha: string}>}
 *
 * En produccion, cachear este valor (cambia 1 vez por dia).
 */
async function getCERActual() {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - 5); // pedir ultimos 5 dias por si hay feriados

  const url = `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/30`
    + `?desde=${formatBCRA(desde)}&hasta=${formatBCRA(hoy)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`BCRA CER error: ${res.status}`);
  const data = await res.json();

  // Estructura BCRA: { results: [{ idVariable: 30, detalle: [{fecha, valor}] }] }
  const detalle = data.results?.[0]?.detalle || [];
  if (detalle.length === 0) throw new Error('Sin datos de CER');

  // Tomar el ultimo disponible (detalle viene ordenado DESC, el primero es el mas reciente)
  const ultimo = detalle[0];
  return { valor: ultimo.valor, fecha: ultimo.fecha };
}

/**
 * Obtiene el CER T-10 (para calculo de bonos).
 *
 * T-10 = 10 dias habiles antes de la fecha de liquidacion (T+1).
 * En la practica se aproxima restando ~14 dias calendario.
 *
 * @param {Date} [fechaLiquidacion] - Default: T+1 desde hoy
 * @returns {Promise<{valor: number, fecha: string}>}
 */
async function getCERT10(fechaLiquidacion) {
  const liquidacion = fechaLiquidacion || new Date();
  const target = new Date(liquidacion);
  target.setDate(target.getDate() - 14); // ~10 habiles ≈ 14 corridos

  const desde = new Date(target);
  desde.setDate(desde.getDate() - 5); // margen

  const url = `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/30`
    + `?desde=${formatBCRA(desde)}&hasta=${formatBCRA(target)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`BCRA CER T-10 error: ${res.status}`);
  const data = await res.json();

  const detalle = data.results?.[0]?.detalle || [];
  if (detalle.length === 0) throw new Error('Sin datos de CER T-10');

  // detalle viene DESC, el primero es el mas reciente dentro del rango
  const ultimo = detalle[0];
  return { valor: ultimo.valor, fecha: ultimo.fecha };
}

/**
 * Calcula el coeficiente de ajuste CER para un bono.
 *
 * @param {number} cerActual  - CER del dia (o T-10)
 * @param {number} cerEmision - CER del dia de emision del bono
 * @returns {number} Coeficiente multiplicador (ej: 1.35 = capital crecio 35%)
 */
function coeficienteCER(cerActual, cerEmision) {
  if (!cerEmision || cerEmision <= 0) return 1;
  return cerActual / cerEmision;
}

function formatBCRA(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = { getCERActual, getCERT10, coeficienteCER };

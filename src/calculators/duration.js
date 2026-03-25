/**
 * duration.js — Calculo de Duration (Macaulay y Modificada).
 *
 * MACAULAY DURATION: promedio ponderado del tiempo hasta recibir cada flujo,
 * donde los pesos son el valor presente de cada flujo.
 *
 *   Duration = Σ [ t(i) * VP(flujo_i) ] / Σ [ VP(flujo_i) ]
 *
 *   donde VP(flujo_i) = monto(i) / (1 + TIR)^t(i)
 *
 * Se mide en anos. Indica cuanto tarda en promedio en "devolverte la plata".
 *
 * MODIFIED DURATION: sensibilidad del precio ante cambios en la tasa.
 *
 *   Modified Duration = Macaulay Duration / (1 + TIR)
 *
 *   Si ModDuration = 3.5, una suba de 1% en la tasa baja el precio ~3.5%.
 *
 * Para letras (pago unico): Duration = dias al vencimiento / 365.25
 *   (no tiene sentido calcular Macaulay, es trivial)
 */

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Macaulay Duration para bonos con multiples flujos.
 *
 * @param {{fecha: Date, monto: number}[]} flujos - Flujos futuros
 * @param {Date}   fechaLiquidacion - Settlement date
 * @param {number} tirPct           - TIR como porcentaje (resultado de calcYTM)
 * @returns {number} Duration en anos
 *
 * Aplica a: BONCER, BOTE, BONTAM, Soberanos USD, ONs
 *
 * Ejemplo:
 *   macaulayDuration(flujosTX26, settlement, 8.5)  →  ~1.8 anos
 */
function macaulayDuration(flujos, fechaLiquidacion, tirPct) {
  const r = tirPct / 100;
  let weightedTime = 0;
  let totalPV = 0;

  for (const f of flujos) {
    const t = (f.fecha - fechaLiquidacion) / MS_PER_YEAR;
    if (t <= 0) continue;

    const pv = f.monto / Math.pow(1 + r, t);
    weightedTime += t * pv;
    totalPV += pv;
  }

  return totalPV > 0 ? weightedTime / totalPV : 0;
}

/**
 * Modified Duration.
 *
 * @param {number} macaulay - Macaulay Duration en anos
 * @param {number} tirPct   - TIR como porcentaje
 * @returns {number} Modified Duration en anos
 */
function modifiedDuration(macaulay, tirPct) {
  return macaulay / (1 + tirPct / 100);
}

module.exports = { macaulayDuration, modifiedDuration };

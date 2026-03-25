/**
 * paridad.js — Calculo de Paridad y Valor Tecnico.
 *
 * PARIDAD: a que porcentaje de su "valor justo" cotiza un bono.
 *
 *   Paridad = Precio de mercado / Valor Tecnico * 100
 *
 *   - Paridad < 100% → el bono cotiza bajo la par (con descuento)
 *   - Paridad = 100% → cotiza a la par
 *   - Paridad > 100% → cotiza sobre la par (con premio)
 *
 * VALOR TECNICO: cuanto "vale" el bono segun sus condiciones de emision,
 * sin considerar la oferta y demanda del mercado.
 *
 *   VT = Valor Residual * Coeficiente de ajuste * 100
 *
 * VALOR RESIDUAL (VR): cuanto capital queda sin amortizar.
 *
 *   VR = 1 - Σ(amortizaciones pagadas)
 *
 *   Arranca en 1 (100%) y baja con cada pago de amortizacion.
 *   Una letra sin amortizar tiene VR = 1 hasta el vencimiento.
 */

// ─── VALOR RESIDUAL ───

/**
 * Calcula el Valor Residual actual de un bono.
 *
 * @param {{fecha: string, amortizacion: number}[]} flujos - Todos los flujos del bono
 * @param {Date} hoy - Fecha actual
 * @returns {number} VR entre 0 y 1 (ej: 0.8 = queda 80% del capital)
 *
 * Ejemplo para un bono que amortiza 20% por semestre:
 *   Emision:  VR = 1.00
 *   1er pago: VR = 0.80
 *   2do pago: VR = 0.60
 *   ...
 *   5to pago: VR = 0.00 (amortizo todo)
 */
function valorResidual(flujos, hoy) {
  let amortAcumulada = 0;
  for (const f of flujos) {
    const fecha = new Date(f.fecha);
    if (fecha <= hoy) {
      amortAcumulada += f.amortizacion || 0;
    }
  }
  return Math.max(0, 1 - amortAcumulada);
}

/**
 * Calcula el VR antes de cada flujo (necesario para calcular cupones de BONCER/BONTAM).
 *
 * @param {{amortizacion: number}[]} flujos - Todos los flujos en orden cronologico
 * @returns {{vr_antes: number}[]} Mismo array con vr_antes agregado
 */
function vrPorFlujo(flujos) {
  let amortAcum = 0;
  return flujos.map(f => {
    const vr_antes = 1 - amortAcum;
    amortAcum += f.amortizacion || 0;
    return { ...f, vr_antes };
  });
}

// ─── VALOR TECNICO ───

/**
 * Valor Tecnico para letras (pago unico, sin ajuste).
 *
 * Para LECAP/BONCAP:  VT = pago_final (es fijo)
 * Para LECER:         VT = pago_final * (CER_actual / CER_emision)
 * Para LELINK:        VT = pago_final * (TC_actual / TC_emision)
 * Para LETAM:         VT = pago_final * coef_TAMAR_acumulado
 *
 * @param {number} pagoFinal   - Pago al vencimiento por 100 VN
 * @param {number} [coefAjuste=1] - Coeficiente de ajuste (1 si no tiene)
 * @returns {number} Valor tecnico por 100 VN
 */
function valorTecnicoLetra(pagoFinal, coefAjuste = 1) {
  return pagoFinal * coefAjuste;
}

/**
 * Valor Tecnico para bonos con amortizacion y ajuste.
 *
 * VT = VR * coeficiente * 100
 *
 * @param {number} vr          - Valor Residual (0 a 1)
 * @param {number} [coefAjuste=1] - Coeficiente (CER, TAMAR acum, TC, o 1 para tasa fija)
 * @returns {number} Valor tecnico por 100 VN
 *
 * Ejemplos:
 *   BONCER TX26: valorTecnicoBono(0.60, cerActual/cerEmision)
 *   BOTE:        valorTecnicoBono(0.80, 1)  // sin ajuste
 *   BONTAM:      valorTecnicoBono(0.80, coefTamarAcumulado)
 */
function valorTecnicoBono(vr, coefAjuste = 1) {
  return vr * coefAjuste * 100;
}

// ─── PARIDAD ───

/**
 * Paridad = Precio / Valor Tecnico * 100
 *
 * @param {number} precio        - Precio de mercado (por 100 VN)
 * @param {number} valorTecnico  - Valor Tecnico (por 100 VN)
 * @returns {number} Paridad como porcentaje
 *
 * Ejemplo:
 *   paridad(89.50, 95.00) → 94.21%  (cotiza 5.79% bajo la par)
 *   paridad(102.00, 100.00) → 102%  (cotiza sobre la par)
 */
function paridad(precio, valorTecnico) {
  if (!valorTecnico || valorTecnico <= 0) return null;
  return (precio / valorTecnico) * 100;
}

module.exports = { valorResidual, vrPorFlujo, valorTecnicoLetra, valorTecnicoBono, paridad };

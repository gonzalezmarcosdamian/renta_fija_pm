/**
 * tna.js — Calculo de TNA (Tasa Nominal Anual).
 *
 * La TNA es interes simple anualizado. A diferencia de la TIR,
 * NO contempla capitalizacion (reinversion de intereses).
 *
 * Cuando usar TNA vs TIR:
 *
 *   TNA → Para comparar instrumentos de corto plazo entre si (LECAPs, plazos fijos).
 *         Es la metrica estandar del mercado de dinero.
 *
 *   TIR → Para evaluar el rendimiento real compuesto.
 *         Es lo que realmente ganas si reinvertis.
 *
 * Relacion entre ambas:
 *   TNA < TIR siempre (la capitalizacion amplifica el rendimiento)
 *   A mayor plazo, mayor la diferencia entre TNA y TIR.
 *
 * Para bonos con cupones (BONCER, BOTE, BONTAM) la TNA no aplica directamente.
 * Se usa Current Yield como aproximacion:
 *   Current Yield = cupon_anual / precio * 100
 */

// ─── TNA PARA LETRAS (pago unico al vencimiento) ───

/**
 * TNA = (ganancia - 1) * (365 / dias) * 100
 *
 * Es la forma lineal de anualizar el rendimiento.
 *
 * @param {number} precio    - Precio de compra (por 100 VN)
 * @param {number} pagoFinal - Pago al vencimiento (por 100 VN)
 * @param {number} dias      - Dias hasta vencimiento desde liquidacion
 * @returns {number|null} TNA como porcentaje
 *
 * Aplica a: LECAP, BONCAP, LECER (simple), LELINK (simple)
 *
 * Ejemplo:
 *   tnaLetra(108.40, 110.125, 27) → ~23.0%
 *   Comparar con tirDirecta que da ~25.6% (la diferencia es la capitalizacion)
 */
function tnaLetra(precio, pagoFinal, dias) {
  if (!precio || !pagoFinal || dias <= 0) return null;
  const ganancia = pagoFinal / precio;
  return (ganancia - 1) * (365 / dias) * 100;
}

// ─── TNA DESDE VCP (para FCIs) ───

/**
 * TNA calculada desde el cambio en el Valor de Cuotaparte (VCP) de un FCI.
 *
 * Formula:
 *   rendimiento_diario = (VCP_actual - VCP_anterior) / VCP_anterior / dias
 *   TNA = rendimiento_diario * 365 * 100
 *
 * @param {number} vcpActual   - VCP del dia mas reciente
 * @param {number} vcpAnterior - VCP del dia anterior (o N dias antes)
 * @param {number} dias        - Dias entre las dos mediciones
 * @returns {number|null} TNA como porcentaje
 *
 * Aplica a: FCIs (Money Market, Renta Fija, etc.)
 */
function tnaDesdeVCP(vcpActual, vcpAnterior, dias) {
  if (!vcpActual || !vcpAnterior || dias <= 0) return null;
  const dailyReturn = (vcpActual - vcpAnterior) / vcpAnterior / dias;
  return Math.round(dailyReturn * 365 * 100 * 100) / 100;
}

// ─── TNA DESDE TIR (conversion) ───

/**
 * Convierte TIR (compuesta) a TNA (simple) para un plazo dado.
 *
 * Formula:
 *   TNA = ((1 + TIR/100)^(dias/365) - 1) * (365/dias) * 100
 *
 * @param {number} tir  - TIR como porcentaje
 * @param {number} dias - Plazo en dias
 * @returns {number} TNA como porcentaje
 */
function tnaDeseTIR(tir, dias) {
  const tirDecimal = tir / 100;
  const ganancia = Math.pow(1 + tirDecimal, dias / 365);
  return (ganancia - 1) * (365 / dias) * 100;
}

module.exports = { tnaLetra, tnaDesdeVCP, tnaDeseTIR };

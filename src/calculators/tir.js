/**
 * tir.js — Calculo de TIR (Tasa Interna de Retorno) / YTM (Yield to Maturity).
 *
 * La TIR es la tasa de descuento que hace que el valor presente de todos
 * los flujos futuros sea igual al precio pagado.
 *
 * Matematicamente:
 *
 *   Precio = Σ [ Flujo(i) / (1 + r)^t(i) ]
 *
 *   donde:
 *     r    = TIR (lo que buscamos)
 *     t(i) = tiempo en anos desde liquidacion hasta el flujo i
 *
 * Para instrumentos con UN solo pago (LECAP, BONCAP, LECER simple):
 *   Se usa formula directa (mas rapido y exacto).
 *
 * Para instrumentos con MULTIPLES pagos (BONCER, BOTE, BONTAM, Soberanos):
 *   Se usa Newton-Raphson (metodo iterativo).
 */

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

// ─── TIR DIRECTA (un solo pago al vencimiento) ───

/**
 * TIR para letras y bonos con pago unico al vencimiento.
 *
 * Formula:
 *   ganancia = pago_final / precio
 *   TIR = (ganancia ^ (365/dias) - 1) * 100
 *
 * Es interes compuesto anualizado.
 *
 * @param {number} precio     - Precio de compra (por 100 VN)
 * @param {number} pagoFinal  - Lo que paga al vencimiento (por 100 VN)
 * @param {number} dias       - Dias desde liquidacion hasta vencimiento
 * @returns {number|null} TIR como porcentaje, o null si input invalido
 *
 * Aplica a: LECAP, BONCAP, LECER (simple), LELINK (simple)
 *
 * Ejemplo:
 *   tirDirecta(108.40, 110.125, 27)  →  ~25.6%
 *   Compras a 108.40, cobras 110.125 en 27 dias → 25.6% anualizado
 */
function tirDirecta(precio, pagoFinal, dias) {
  if (!precio || !pagoFinal || dias <= 0) return null;
  const ganancia = pagoFinal / precio;
  return (Math.pow(ganancia, 365 / dias) - 1) * 100;
}

// ─── TIR NEWTON-RAPHSON (multiples flujos) ───

/**
 * TIR para bonos con multiples flujos de fondos (cupones + amortizaciones).
 *
 * Usa el metodo de Newton-Raphson:
 *   1. Arranca con una tasa inicial (10%)
 *   2. Calcula el valor presente (PV) de todos los flujos a esa tasa
 *   3. Calcula la derivada del PV respecto a la tasa
 *   4. Ajusta la tasa: r = r - (PV - precio) / derivada
 *   5. Repite hasta que |PV - precio| < 0.0001
 *
 * Formula del valor presente:
 *   PV = Σ [ monto(i) / (1 + r) ^ t(i) ]
 *
 * Derivada:
 *   dPV/dr = Σ [ -t(i) * monto(i) / (1 + r)^(t(i) + 1) ]
 *
 * @param {number} precio            - Precio de compra (por 1 VN, NO por 100)
 * @param {{fecha: Date, monto: number}[]} flujos - Flujos futuros
 * @param {Date}   fechaLiquidacion  - Fecha de liquidacion (settlement)
 * @returns {number} TIR como porcentaje
 *
 * Aplica a: BONCER, BOTE, BONTAM (con flujos proyectados), Soberanos USD
 *
 * ATENCION: el precio se pasa normalizado (por 1 VN).
 *   Si el precio de mercado es 89.50 (por 100 VN), pasar 89.50 / 100 = 0.895
 */
function tirNewtonRaphson(precio, flujos, fechaLiquidacion) {
  let r = 0.10; // guess inicial: 10%

  for (let iter = 0; iter < 100; iter++) {
    let pv = 0;
    let dpv = 0;

    for (const f of flujos) {
      const t = (f.fecha - fechaLiquidacion) / MS_PER_YEAR;
      if (t <= 0) continue; // ignorar flujos pasados

      const disc = Math.pow(1 + r, t);
      pv += f.monto / disc;                       // valor presente
      dpv -= t * f.monto / (disc * (1 + r));      // derivada
    }

    const diff = pv - precio;
    if (Math.abs(diff) < 0.0001) break;   // convergio
    if (Math.abs(dpv) < 1e-12) break;     // derivada ~0, no puede ajustar

    r -= diff / dpv;                        // paso de Newton-Raphson
    r = Math.max(-0.5, Math.min(2, r));     // acotar entre -50% y 200%
  }

  return r * 100;
}

// ─── PRECIO DESDE TIR (inverso) ───

/**
 * Dado una TIR objetivo, calcula el precio teorico del bono.
 * Es la funcion inversa de tirNewtonRaphson.
 *
 * Util para: "a que precio tengo que comprar para lograr X% de TIR?"
 *
 * @param {number} tirObjetivo       - TIR deseada como porcentaje
 * @param {{fecha: Date, monto: number}[]} flujos
 * @param {Date}   fechaLiquidacion
 * @returns {number} Precio teorico (por 1 VN)
 */
function precioDesdeYTM(tirObjetivo, flujos, fechaLiquidacion) {
  const r = tirObjetivo / 100;
  let pv = 0;
  for (const f of flujos) {
    const t = (f.fecha - fechaLiquidacion) / MS_PER_YEAR;
    if (t <= 0) continue;
    pv += f.monto / Math.pow(1 + r, t);
  }
  return pv;
}

module.exports = { tirDirecta, tirNewtonRaphson, precioDesdeYTM };

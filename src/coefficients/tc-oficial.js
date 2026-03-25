/**
 * tc-oficial.js — Tipo de Cambio Oficial (A3500) desde BCRA.
 *
 * El TC Oficial es el tipo de cambio ARS/USD que publica el BCRA
 * en su comunicacion A3500 (promedio de bancos).
 *
 * Se usa para ajustar instrumentos DOLAR LINKED:
 *   coef_DL = TC_actual / TC_emision
 *
 * FUENTE: BCRA Serie estadistica N° 4
 * ENDPOINT: https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/4
 *
 * NOTA: El TC Oficial se publica solo en dias habiles.
 * Para fines de semana/feriados se usa el ultimo publicado.
 */

/**
 * Obtiene el TC Oficial mas reciente.
 *
 * @returns {Promise<{valor: number, fecha: string}>}
 */
async function getTCOficial() {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - 7);

  const url = `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/4`
    + `?desde=${formatBCRA(desde)}&hasta=${formatBCRA(hoy)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`BCRA TC Oficial error: ${res.status}`);
  const data = await res.json();

  // Estructura BCRA: { results: [{ idVariable: 4, detalle: [{fecha, valor}] }] }
  // detalle viene ordenado DESC (mas reciente primero)
  const detalle = data.results?.[0]?.detalle || [];
  if (detalle.length === 0) throw new Error('Sin datos de TC Oficial');

  const ultimo = detalle[0]; // mas reciente
  return { valor: ultimo.valor, fecha: ultimo.fecha };
}

/**
 * Calcula el coeficiente de ajuste Dolar Linked.
 *
 * @param {number} tcActual  - TC oficial del dia
 * @param {number} tcEmision - TC oficial del dia de emision del instrumento
 * @returns {number} Coeficiente multiplicador
 *
 * Ejemplo:
 *   Si TC emision = 900 y TC actual = 1100:
 *   coeficienteDL(1100, 900) → 1.2222 (el peso se devaluo 22%)
 */
function coeficienteDL(tcActual, tcEmision) {
  if (!tcEmision || tcEmision <= 0) return 1;
  return tcActual / tcEmision;
}

function formatBCRA(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = { getTCOficial, coeficienteDL };

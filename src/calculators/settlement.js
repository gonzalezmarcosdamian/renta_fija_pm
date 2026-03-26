/**
 * settlement.js — Calculo de fecha de liquidacion.
 *
 * En Argentina, la liquidacion de bonos y letras es T+1 (un dia habil).
 * Esto significa que si compras hoy, el titulo se liquida manana (si es habil).
 *
 * Los dias NO habiles en Argentina incluyen:
 * - Sabados y Domingos
 * - Feriados nacionales (lista simplificada abajo)
 *
 * IMPORTANTE: Para produccion, usar el calendario oficial de BYMA.
 */

/**
 * Feriados 2025-2026 (simplificado).
 * En produccion esto deberia venir de una fuente actualizada (BYMA/BCRA).
 */
const FERIADOS = new Set([
  // 2025
  '2025-01-01', '2025-03-03', '2025-03-04', '2025-03-24',
  '2025-04-02', '2025-04-18', '2025-05-01', '2025-05-25',
  '2025-06-16', '2025-06-20', '2025-07-09', '2025-08-17',
  '2025-10-12', '2025-11-24', '2025-12-08', '2025-12-25',
  // 2026
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-03-24',
  '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-25',
  '2026-06-15', '2026-06-20', '2026-07-09', '2026-08-17',
  '2026-10-12', '2026-11-23', '2026-12-08', '2026-12-25',
]);

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function esHabil(date) {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false; // fin de semana
  if (FERIADOS.has(formatDate(date))) return false;
  return true;
}

/**
 * Calcula la fecha de liquidacion T+n habiles.
 *
 * @param {Date} fecha - Fecha de operacion
 * @param {number} [diasHabiles=1] - Cantidad de dias habiles (default T+1)
 * @returns {Date} Fecha de liquidacion
 *
 * Ejemplo:
 *   getSettlementDate(new Date('2025-03-21'))  // Viernes
 *   → 2025-03-24 (Lunes, proximo habil)
 *
 *   getSettlementDate(new Date('2025-03-20'))  // Jueves
 *   → 2025-03-21 (Viernes)
 */
function getSettlementDate(fecha, diasHabiles = 1) {
  const result = new Date(fecha);
  let habilesSumados = 0;
  while (habilesSumados < diasHabiles) {
    result.setDate(result.getDate() + 1);
    if (esHabil(result)) habilesSumados++;
  }
  return result;
}

/**
 * Dias corridos entre dos fechas.
 *
 * Normaliza ambas fechas a medianoche UTC para evitar errores por
 * diferencia de horas (ej: settlement viene de Date local, vencimiento
 * viene de new Date('YYYY-MM-DD') que es UTC 00:00).
 *
 * @param {Date} desde
 * @param {Date} hasta
 * @returns {number}
 */
function diasEntre(desde, hasta) {
  const d1 = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const d2 = Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.max(1, (d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Parsea un string ISO (YYYY-MM-DD) como fecha local (medianoche local).
 *
 * new Date('2026-04-17') crea UTC midnight, que en zonas horarias
 * con offset negativo (ej: Argentina UTC-3) aparece como el dia anterior
 * (16 de abril a las 21:00 local). Esto corrompe el conteo de dias.
 *
 * Esta funcion extrae year/month/day y construye la fecha en hora local.
 *
 * @param {string} isoStr - Fecha en formato YYYY-MM-DD
 * @returns {Date} Fecha a medianoche local
 */
function parseFecha(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

module.exports = { getSettlementDate, diasEntre, esHabil, parseFecha, FERIADOS };

/**
 * tamar.js — Consumo y acumulacion del coeficiente TAMAR desde BCRA.
 *
 * TAMAR (Tasa de interes para plazos fijos mayoristas):
 *   - Tasa promedio ponderada de plazos fijos mayoristas (30-35 dias)
 *   - Publicada diariamente por BCRA como TNA (porcentaje nominal anual)
 *   - Refleja el costo de fondeo mayorista de los bancos
 *   - Al 2026-03: ~26.75% TNA
 *
 * SERIES BCRA DISPONIBLES:
 *   Serie 44  → TAMAR bancos privados (TNA)         ← LA QUE USAMOS
 *   Serie 45  → TAMAR bancos privados (TEA)
 *   Serie 135 → TAMAR publicos + privados (TNA)
 *   Serie 136 → TAMAR privados (TNA, duplicado de 44)
 *   Serie 137 → TAMAR privados (TEA, duplicado de 45)
 *
 * IMPORTANTE: La serie 27 que aparece en algunos repos NO contiene datos de TAMAR.
 *   Fue verificado el 2026-03-25: serie 27 devuelve detalle vacio.
 *   La serie correcta es la 44 (privados TNA) o 135 (todos TNA).
 *
 * ENDPOINT: https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/44
 *
 * COMO SE ACUMULA:
 *   A diferencia del CER (que BCRA publica como coeficiente acumulado),
 *   TAMAR se publica como TASA DIARIA (TNA).
 *   Nosotros tenemos que acumularla multiplicativamente:
 *
 *   coef_TAMAR = Π [ (1 + TAMAR_dia(i) / 100 / 365) ]
 *                para cada dia desde emision hasta hoy
 *
 *   Es como un plazo fijo que se renueva todos los dias a la tasa del dia.
 *
 * DIFERENCIA CON CER:
 *   - CER → BCRA publica el coeficiente acumulado directo. Solo dividis.
 *   - TAMAR → BCRA publica la tasa del dia. Vos tenes que acumular.
 *   Esto hace que TAMAR sea mas complejo de implementar.
 *
 * ESTRUCTURA RESPUESTA BCRA:
 *   { results: [{ idVariable: 44, detalle: [{fecha, valor}, ...] }] }
 *   - detalle viene ordenado DESC (mas reciente primero)
 *   - valor es porcentaje (ej: 26.75 = 26.75% TNA)
 */

const SERIE_TAMAR_PRIVADOS_TNA = 44;
const SERIE_TAMAR_TODOS_TNA = 135;

/**
 * Obtiene la serie de TAMAR diaria entre dos fechas.
 *
 * @param {Date} desde
 * @param {Date} hasta
 * @param {Object} [options]
 * @param {number} [options.serie=44] - 44 (privados) o 135 (publicos+privados)
 * @returns {Promise<{fecha: string, tasa: number}[]>} Array de {fecha, tasa_TNA_porcentaje}
 *   tasa viene como porcentaje: 26.75 = 26.75%
 */
async function getSerieTAMAR(desde, hasta, options = {}) {
  const serie = options.serie || SERIE_TAMAR_PRIVADOS_TNA;
  const url = `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/${serie}`
    + `?desde=${formatBCRA(desde)}&hasta=${formatBCRA(hasta)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`BCRA TAMAR error: ${res.status}`);
  const data = await res.json();

  const detalle = data.results?.[0]?.detalle || [];

  // detalle viene DESC, revertir a ASC (cronologico) para acumular
  return detalle
    .map(r => ({ fecha: r.fecha, tasa: r.valor }))
    .reverse();
}

/**
 * Obtiene la ultima TAMAR publicada.
 *
 * @param {Object} [options]
 * @param {number} [options.serie=44]
 * @returns {Promise<{fecha: string, tasa: number}>}
 *   tasa como porcentaje (ej: 26.75)
 */
async function getTAMARActual(options = {}) {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - 7);

  const serie = await getSerieTAMAR(desde, hoy, options);
  if (serie.length === 0) throw new Error('Sin datos de TAMAR');
  return serie[serie.length - 1]; // ultimo = mas reciente
}

/**
 * Acumula la tasa TAMAR diaria para calcular el coeficiente multiplicador.
 *
 * Formula:
 *   coef = Π [ (1 + tasa_dia(i) / 100 / 365) ]
 *
 * Ejemplo:
 *   Si TAMAR = 26.75% (TNA) durante 30 dias:
 *   coef = (1 + 26.75/100/365) ^ 30 ≈ 1.0221 (capital crecio 2.21%)
 *
 * @param {{fecha: string, tasa: number}[]} serieDiaria - Serie de TAMAR en orden ASC
 *   tasa como porcentaje (ej: 26.75)
 * @returns {number} Coeficiente acumulado multiplicador
 *
 * ATENCION: necesitas la serie COMPLETA desde la fecha de emision del bono.
 * Si faltan dias (feriados/fines de semana), se asume que la tasa del ultimo
 * dia habil aplica para los dias no habiles.
 */
function acumularTAMAR(serieDiaria) {
  if (!serieDiaria || serieDiaria.length === 0) return 1;

  let coef = 1;
  for (let i = 0; i < serieDiaria.length; i++) {
    const tasaPct = serieDiaria[i].tasa; // ya es porcentaje (ej: 26.75)
    const tasaDiaria = tasaPct / 100 / 365;

    // Calcular dias hasta el proximo dato (o 1 si es el ultimo)
    let diasVigentes = 1;
    if (i < serieDiaria.length - 1) {
      const actual = new Date(serieDiaria[i].fecha);
      const siguiente = new Date(serieDiaria[i + 1].fecha);
      diasVigentes = Math.round((siguiente - actual) / (1000 * 60 * 60 * 24));
    }

    // Acumular: cada dia multiplica por (1 + tasa_diaria)
    for (let d = 0; d < diasVigentes; d++) {
      coef *= (1 + tasaDiaria);
    }
  }

  return coef;
}

/**
 * Proyecta TAMAR futura asumiendo tasa constante.
 *
 * Como no sabemos la TAMAR futura, se asume que se mantiene igual a la actual.
 * Esto es una ESTIMACION — la TIR de BONTAM/LETAM es siempre estimada.
 *
 * @param {number} tamarActualPct - Ultima TAMAR TNA como porcentaje (ej: 26.75)
 * @param {number} dias           - Dias a proyectar
 * @returns {number} Coeficiente acumulado proyectado
 */
function proyectarTAMAR(tamarActualPct, dias) {
  return Math.pow(1 + tamarActualPct / 100 / 365, dias);
}

function formatBCRA(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = {
  getSerieTAMAR, getTAMARActual, acumularTAMAR, proyectarTAMAR,
  SERIE_TAMAR_PRIVADOS_TNA, SERIE_TAMAR_TODOS_TNA
};

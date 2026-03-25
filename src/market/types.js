/**
 * types.js — Contratos de datos para el proyecto.
 *
 * Este archivo define la FORMA de los datos que se usan en todo el proyecto.
 * En produccion, estos datos vienen del OMS. Aca los documentamos para que
 * los devs sepan que esperar.
 *
 * ORIGEN DE CADA DATO:
 *
 * ┌─────────────────────┬──────────────────────────────────────────────┐
 * │ Categoria           │ Origen                                       │
 * ├─────────────────────┼──────────────────────────────────────────────┤
 * │ Precios de mercado  │ OMS interno (precio, bid, ask, volumen)      │
 * │ Coeficientes        │ BCRA API (CER, TAMAR, TC Oficial)           │
 * │ Condiciones emision │ Ministerio Economia / CNV (flujos, fechas)  │
 * │ Calculos            │ Nosotros (TIR, TNA, Paridad, Duration)      │
 * └─────────────────────┴──────────────────────────────────────────────┘
 */

// ─── Datos de mercado (vienen del OMS) ───

/**
 * @typedef {Object} MarketPrice
 * @property {string}  ticker   - Ticker del instrumento (ej: "S17A6", "TX26")
 * @property {number}  price    - Ultimo precio operado (por cada 100 VN)
 * @property {number}  bid      - Mejor punta compradora
 * @property {number}  ask      - Mejor punta vendedora
 * @property {number}  volume   - Volumen nominal operado
 * @property {string}  datetime - Timestamp ISO del ultimo precio
 *
 * NOTA: En produccion esto viene del OMS.
 * Para testing usamos mock-prices.js con datos de ejemplo.
 */

// ─── Coeficientes de ajuste (vienen del BCRA) ───

/**
 * @typedef {Object} CERData
 * @property {number} valor    - Coeficiente CER del dia
 * @property {string} fecha    - Fecha ISO del dato
 *
 * Fuente: BCRA Serie 30
 * Endpoint: api.bcra.gob.ar/estadisticas/v4.0/Monetarias/30
 * Frecuencia: diaria (publicado con ~1 dia de rezago)
 */

/**
 * @typedef {Object} TAMARData
 * @property {number} tasa     - TAMAR del dia como TNA (ej: 0.35 = 35%)
 * @property {string} fecha    - Fecha ISO del dato
 *
 * Fuente: BCRA Serie 44 (privados TNA) o 135 (todos TNA)
 * Endpoint: api.bcra.gob.ar/estadisticas/v4.0/Monetarias/44
 * Frecuencia: diaria
 * Definicion: Tasa promedio de plazos fijos mayoristas (>$1.000M, 30-35 dias)
 */

/**
 * @typedef {Object} TCOficialData
 * @property {number} valor    - Tipo de cambio ARS/USD
 * @property {string} fecha    - Fecha ISO del dato
 *
 * Fuente: BCRA Comunicacion A3500
 * Endpoint: api.bcra.gob.ar/estadisticas/v4.0/Monetarias/4
 * Frecuencia: diaria (dias habiles)
 */

// ─── Condiciones de emision (estaticas, del Ministerio / CNV) ───

/**
 * @typedef {Object} FlujoBono
 * @property {string} fecha        - Fecha ISO del pago
 * @property {number} amortizacion - Porcion de capital que se devuelve (0 a 1)
 * @property {number} tasa_interes - Tasa de cupon del periodo
 * @property {number} base         - Fraccion del ano (0.5 = semestral)
 *
 * Usado por: BONCER, BONTAM, BOTE
 * El monto real del flujo se calcula: (VR * tasa * base + amort) * coeficiente
 */

/**
 * @typedef {Object} FlujoSimple
 * @property {string} fecha - Fecha ISO del pago
 * @property {number} monto - Monto fijo por cada 100 VN (cupon + amort)
 *
 * Usado por: Soberanos USD, ONs, BOTE (formato alternativo)
 */

/**
 * @typedef {Object} InstrumentoLetra
 * @property {string} ticker           - Ej: "S17A6"
 * @property {string} tipo             - "lecap" | "lecer" | "letam" | "lelink"
 * @property {string} fecha_vencimiento - ISO date
 * @property {number} pago_final       - Monto al vencimiento por cada 100 VN
 * @property {number} [cer_emision]    - Solo LECER: CER del dia de emision
 * @property {number} [tc_emision]     - Solo LELINK: TC oficial del dia de emision
 *
 * Las letras no tienen cupones intermedios. Solo pagan al vencimiento.
 */

/**
 * @typedef {Object} InstrumentoBono
 * @property {string}      ticker      - Ej: "TX26", "TZX27"
 * @property {string}      tipo        - "boncer" | "bontam" | "bote" | "boncap"
 * @property {string}      vencimiento - ISO date
 * @property {FlujoBono[]} flujos      - Cronograma de pagos
 * @property {number}      [cer_emision]   - Solo BONCER: CER del dia de emision
 * @property {number}      [spread_tamar]  - Solo BONTAM: spread sobre TAMAR (ej: 0.02 = +2%)
 */

module.exports = {};

/**
 * BONCER / LECER — Bonos y Letras ajustados por CER
 *
 * El capital se ajusta por inflacion (CER). Los cupones y amortizaciones
 * se multiplican por el coeficiente CER.
 *
 * Datos necesarios:
 *   DE MERCADO (OMS):   precio (en ARS por 100 VN)
 *   ESTATICOS (CNV):    flujos (amortizacion, tasa, base), cer_emision
 *   COEFICIENTES (BCRA): CER actual (serie 30)
 *
 * Se calculan: TIR real, Paridad, Duration
 * La TIR de un BONCER es REAL (por encima de inflacion).
 *
 * Correr: node src/examples/boncer.js
 */

const { tirNewtonRaphson } = require('../calculators/tir');
const { paridad, valorResidual, vrPorFlujo, valorTecnicoBono } = require('../calculators/paridad');
const { macaulayDuration, modifiedDuration } = require('../calculators/duration');
const { coeficienteCER } = require('../coefficients/cer');
const { getSettlementDate } = require('../calculators/settlement');
const { getPrice } = require('../market/mock-prices');
const instrumentos = require('../../data/instrumentos.json');

console.log('═══════════════════════════════════════');
console.log(' BONCER — Bonos ajustados por CER (inflacion)');
console.log('═══════════════════════════════════════\n');

// Simulamos un CER actual (en produccion viene de BCRA API)
const CER_ACTUAL = 23.50;
console.log(`CER actual (simulado): ${CER_ACTUAL}`);
console.log(`Fuente real: BCRA api.bcra.gob.ar/estadisticas/v4.0/Monetarias/30\n`);

const hoy = new Date();
const settlement = getSettlementDate(hoy);

for (const [ticker, bono] of Object.entries(instrumentos.boncers)) {
  if (ticker.startsWith('_')) continue;

  const market = getPrice(ticker);
  if (!market) continue;

  console.log(`─── ${ticker} (${bono.nombre}) ───`);
  console.log(`Precio mercado:  $${market.price} (por 100 VN) ← OMS`);
  console.log(`CER emision:     ${bono.cer_emision} ← condiciones de emision`);

  // 1. Coeficiente CER
  const coefCER = coeficienteCER(CER_ACTUAL, bono.cer_emision);
  console.log(`Coef CER:        ${coefCER.toFixed(4)} (= ${CER_ACTUAL} / ${bono.cer_emision})`);

  // 2. Valor Residual
  const vr = valorResidual(bono.flujos, hoy);
  console.log(`Valor Residual:  ${(vr * 100).toFixed(1)}%`);

  // 3. Valor Tecnico y Paridad
  const vt = valorTecnicoBono(vr, coefCER);
  const par = paridad(market.price, vt);
  console.log(`Valor Tecnico:   $${vt.toFixed(2)}`);
  console.log(`Paridad:         ${par.toFixed(1)}%`);

  // 4. Flujos ajustados por CER (solo futuros)
  const flujosConVR = vrPorFlujo(bono.flujos);
  const flujosAjustados = flujosConVR
    .map(f => {
      const fecha = new Date(f.fecha);
      if (fecha <= hoy) return null;
      const interes = f.vr_antes * f.tasa_interes * f.base;
      const flujoNominal = interes + f.amortizacion;
      const flujoAjustado = flujoNominal * coefCER;
      return { fecha, monto: flujoAjustado };
    })
    .filter(f => f !== null);

  console.log(`\nFlujos futuros ajustados por CER:`);
  console.log(`  Fecha       | Nominal | Ajustado (x CER)`);
  const flujosConVR2 = vrPorFlujo(bono.flujos);
  for (const f of flujosConVR2) {
    const fecha = new Date(f.fecha);
    if (fecha <= hoy) continue;
    const interes = f.vr_antes * f.tasa_interes * f.base;
    const nominal = interes + f.amortizacion;
    const ajustado = nominal * coefCER;
    console.log(`  ${fecha.toISOString().slice(0, 10)} |  ${nominal.toFixed(4)} |  ${ajustado.toFixed(4)}`);
  }

  // 5. TIR (Newton-Raphson sobre flujos ajustados)
  const precioNorm = market.price / 100; // normalizar a por-1-VN
  const tir = tirNewtonRaphson(precioNorm, flujosAjustados, settlement);
  console.log(`\nTIR real:        ${tir.toFixed(2)}% (por encima de inflacion)`);

  // 6. Duration
  const dur = macaulayDuration(flujosAjustados, settlement, tir);
  const modDur = modifiedDuration(dur, tir);
  console.log(`Duration Mac:    ${dur.toFixed(2)} anos`);
  console.log(`Duration Mod:    ${modDur.toFixed(2)} anos`);
  console.log('');
}

console.log(`
NOTAS:
- La TIR de un BONCER es REAL (por encima de inflacion)
- Si TIR = 5%, ganas 5% + lo que suba el CER (inflacion)
- El CER_emision es fijo por bono (condicion de emision)
- Paridad < 100% = compras capital ajustado con descuento
- Para LECER es mas simple: no tiene cupones, solo pago al vencimiento * coef_CER
`);

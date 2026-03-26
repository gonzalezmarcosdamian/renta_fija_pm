/**
 * BONTAM — Bonos ajustados por TAMAR
 *
 * El mas complejo de todos. Combina:
 *   - Cupones periodicos (TAMAR acumulada del periodo + spread)
 *   - Amortizacion de capital
 *   - Tasa variable (TAMAR cambia todos los dias)
 *
 * Datos necesarios:
 *   DE MERCADO (OMS):   precio
 *   ESTATICOS (CNV):    flujos (amortizacion, base), spread, fecha_emision
 *   COEFICIENTES (BCRA): Serie TAMAR diaria (serie 44) COMPLETA desde emision
 *
 * La TIR es ESTIMADA (asumiendo TAMAR constante hacia adelante).
 *
 * Correr: node src/examples/bontam.js
 */

const { tirNewtonRaphson } = require('../calculators/tir');
const { paridad, vrPorFlujo, valorTecnicoBono } = require('../calculators/paridad');
const { macaulayDuration } = require('../calculators/duration');
const { proyectarTAMAR } = require('../coefficients/tamar');
const { getSettlementDate, diasEntre, parseFecha } = require('../calculators/settlement');
const { getPrice } = require('../market/mock-prices');
const instrumentos = require('../../data/instrumentos.json');

console.log('═══════════════════════════════════════');
console.log(' BONTAM — Bonos ajustados por TAMAR');
console.log('═══════════════════════════════════════\n');

const TAMAR_ACTUAL_TNA = 0.32;
console.log(`TAMAR actual (simulada): ${(TAMAR_ACTUAL_TNA * 100).toFixed(1)}% TNA`);
console.log(`Fuente real: BCRA serie 44\n`);

const hoy = new Date();
const settlement = getSettlementDate(hoy);

for (const [ticker, bono] of Object.entries(instrumentos.bontams)) {
  if (ticker.startsWith('_')) continue;

  const market = getPrice(ticker);
  if (!market) continue;

  console.log(`─── ${ticker} (${bono.nombre}) ───`);
  console.log(`Precio mercado:  $${market.price} (por 100 VN) ← OMS`);
  console.log(`Spread:          +${(bono.spread_tamar * 100).toFixed(1)}% sobre TAMAR`);
  console.log(`Emision:         ${bono.fecha_emision}`);

  // 1. Calcular VR antes de cada flujo
  const flujosConVR = vrPorFlujo(bono.flujos);

  // 2. Proyectar flujos futuros (asumiendo TAMAR constante)
  //    Cada cupon = VR_antes * (TAMAR_acum_periodo + spread) * base
  //    Simplificacion: TAMAR_acum_periodo ≈ TAMAR_TNA * base
  const tasaEfectivaPeriodo = TAMAR_ACTUAL_TNA + bono.spread_tamar;

  console.log(`\nFlujos estimados (TAMAR constante ${(TAMAR_ACTUAL_TNA*100).toFixed(0)}% + spread ${(bono.spread_tamar*100).toFixed(0)}%):`);
  console.log(`  Fecha       | VR antes | Cupon est | Amort  | Total`);

  const flujosEstimados = [];
  for (const f of flujosConVR) {
    const fecha = new Date(f.fecha);
    if (fecha <= hoy) continue;

    // Cupon estimado: VR * tasa_efectiva * base
    const cupon = f.vr_antes * tasaEfectivaPeriodo * f.base;
    const total = cupon + f.amortizacion;

    flujosEstimados.push({ fecha, monto: total });

    console.log(
      `  ${fecha.toISOString().slice(0, 10)} |   ${f.vr_antes.toFixed(2)}   |  ${cupon.toFixed(4)}  | ${f.amortizacion.toFixed(2)}  | ${total.toFixed(4)}`
    );
  }

  // 3. TIR estimada (Newton-Raphson sobre flujos proyectados)
  const precioNorm = market.price / 100;
  const tir = tirNewtonRaphson(precioNorm, flujosEstimados, settlement);

  // 4. Duration
  const dur = macaulayDuration(flujosEstimados, settlement, tir);

  // 5. Paridad
  //    VT de BONTAM = VR * coef_TAMAR_acumulado * 100
  //    Simplificacion: usamos la proyeccion desde emision hasta hoy
  const diasDesdeEmision = diasEntre(parseFecha(bono.fecha_emision), hoy);
  const coefTamarHoy = proyectarTAMAR(TAMAR_ACTUAL_TNA, diasDesdeEmision);
  const vr = flujosConVR.filter(f => new Date(f.fecha) > hoy)[0]?.vr_antes || 1;
  const vt = valorTecnicoBono(vr, coefTamarHoy);
  const par = paridad(market.price, vt);

  console.log(`\nResultados:`);
  console.log(`  TIR estimada:  ${tir.toFixed(2)}% (asume TAMAR constante!)`);
  console.log(`  Duration:      ${dur.toFixed(2)} anos`);
  console.log(`  VR actual:     ${(vr * 100).toFixed(1)}%`);
  console.log(`  Coef TAMAR:    ${coefTamarHoy.toFixed(4)}`);
  console.log(`  VT:            $${vt.toFixed(2)}`);
  console.log(`  Paridad:       ${par ? par.toFixed(1) : 'N/A'}%`);
  console.log('');
}

console.log(`
NOTAS:
- BONTAM es el instrumento mas complejo porque:
  1. Hay que acumular TAMAR diaria desde emision (no viene acumulado como CER)
  2. Los flujos futuros dependen de una tasa desconocida
  3. El cupon incluye spread fijo + TAMAR variable
- La TIR es siempre una ESTIMACION
- Para produccion necesitas la serie COMPLETA de TAMAR desde la emision
- Comparar TIR BONTAM vs TIR BONCAP indica si el mercado espera suba/baja de TAMAR
`);

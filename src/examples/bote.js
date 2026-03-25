/**
 * BOTE — Bono a Tasa Fija con Cupon
 *
 * El bono mas "clasico". Paga cupon fijo periodico y amortiza capital.
 * No tiene ningun ajuste. Todos los flujos son conocidos de antemano.
 *
 * Datos necesarios:
 *   DE MERCADO (OMS):   precio
 *   ESTATICOS (CNV):    flujos (fecha, monto)
 *   COEFICIENTES:       ninguno
 *
 * Se calculan: TIR, Duration, Paridad
 * Es el caso mas limpio de Newton-Raphson.
 *
 * Correr: node src/examples/bote.js
 */

const { tirNewtonRaphson } = require('../calculators/tir');
const { paridad, valorResidual, valorTecnicoBono } = require('../calculators/paridad');
const { macaulayDuration, modifiedDuration } = require('../calculators/duration');
const { getSettlementDate } = require('../calculators/settlement');
const { getPrice } = require('../market/mock-prices');
const instrumentos = require('../../data/instrumentos.json');

console.log('═══════════════════════════════════════');
console.log(' BOTE — Bonos a Tasa Fija');
console.log('═══════════════════════════════════════\n');

const hoy = new Date();
const settlement = getSettlementDate(hoy);

for (const [ticker, bono] of Object.entries(instrumentos.botes)) {
  if (ticker.startsWith('_')) continue;

  const market = getPrice(ticker);
  if (!market) continue;

  console.log(`─── ${ticker} (${bono.nombre}) ───`);
  console.log(`Precio mercado:  $${market.price} (por 100 VN) ← OMS`);
  console.log(`Vencimiento:     ${bono.vencimiento}`);

  // 1. Filtrar flujos futuros
  const flujosFuturos = bono.flujos
    .map(f => ({ fecha: new Date(f.fecha), monto: f.monto }))
    .filter(f => f.fecha > hoy);

  console.log(`\nFlujos futuros (todos conocidos de antemano):`);
  console.log(`  Fecha       | Monto`);
  for (const f of flujosFuturos) {
    console.log(`  ${f.fecha.toISOString().slice(0, 10)} | $${f.monto.toFixed(2)}`);
  }

  // 2. TIR (Newton-Raphson)
  const precioNorm = market.price / 100;
  const tir = tirNewtonRaphson(precioNorm, flujosFuturos, settlement);
  console.log(`\nTIR: ${tir.toFixed(2)}%`);

  // 3. Duration
  const dur = macaulayDuration(flujosFuturos, settlement, tir);
  const modDur = modifiedDuration(dur, tir);
  console.log(`Duration Macaulay:  ${dur.toFixed(2)} anos`);
  console.log(`Duration Modificada: ${modDur.toFixed(2)} anos`);
  console.log(`  → Si la tasa sube 1%, el precio baja ~${modDur.toFixed(1)}%`);

  // 4. Paridad (BOTE no ajusta, VR es simplemente 1 - amort acumuladas)
  //    Para BOTE con flujos simples, calculamos VR desde los montos
  //    El ultimo flujo incluye amortizacion (monto > cupon normal)
  const cuponNormal = bono.flujos[0].monto;
  let amortPagada = 0;
  for (const f of bono.flujos) {
    const fecha = new Date(f.fecha);
    if (fecha <= hoy && f.monto > cuponNormal) {
      amortPagada += (f.monto - cuponNormal) / 100;
    }
  }
  const vr = 1 - amortPagada;
  const vt = valorTecnicoBono(vr, 1); // sin ajuste
  const par = paridad(market.price, vt);
  console.log(`Valor Residual: ${(vr * 100).toFixed(1)}%`);
  console.log(`Paridad:        ${par.toFixed(1)}%`);
  console.log('');
}

console.log(`
NOTAS:
- BOTE es el bono mas simple: todos los flujos son fijos y conocidos
- No depende de ningun coeficiente (CER, TAMAR, TC)
- Newton-Raphson converge rapido porque no hay incertidumbre en los flujos
- La Duration indica sensibilidad al cambio de tasas del mercado
- Buena herramienta didactica para entender TIR antes de pasar a CER/TAMAR
`);

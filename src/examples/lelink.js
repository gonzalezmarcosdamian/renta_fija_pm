/**
 * LELINK — Letras Dolar Linked
 *
 * El capital se ajusta por el tipo de cambio oficial (A3500).
 * Sirve para cubrirse de una devaluacion del peso.
 *
 * Datos necesarios:
 *   DE MERCADO (OMS):   precio (en ARS por 100 VN)
 *   ESTATICOS (CNV):    fecha_vencimiento, tc_emision
 *   COEFICIENTES (BCRA): TC Oficial actual (serie 4 / A3500)
 *
 * La TIR es en pesos. Para ver rendimiento en USD,
 * comparar contra la devaluacion esperada del mercado.
 *
 * Correr: node src/examples/lelink.js
 */

const { tirDirecta } = require('../calculators/tir');
const { tnaLetra } = require('../calculators/tna');
const { paridad, valorTecnicoLetra } = require('../calculators/paridad');
const { coeficienteDL } = require('../coefficients/tc-oficial');
const { getSettlementDate, diasEntre } = require('../calculators/settlement');
const { getPrice } = require('../market/mock-prices');
const instrumentos = require('../../data/instrumentos.json');

console.log('═══════════════════════════════════════');
console.log(' LELINK — Letras Dolar Linked');
console.log('═══════════════════════════════════════\n');

// Simulamos TC Oficial (en produccion viene de BCRA serie 4)
const TC_ACTUAL = 1070.00;
console.log(`TC Oficial actual (simulado): $${TC_ACTUAL}`);
console.log(`Fuente real: BCRA api.bcra.gob.ar/estadisticas/v4.0/Monetarias/4\n`);

const hoy = new Date();
const settlement = getSettlementDate(hoy);

for (const [ticker, inst] of Object.entries(instrumentos.lelinks)) {
  if (ticker.startsWith('_')) continue;

  const market = getPrice(ticker);
  if (!market) continue;

  console.log(`─── ${ticker} (${inst.nombre}) ───`);
  console.log(`Precio mercado:  $${market.price} (por 100 VN, en ARS) ← OMS`);
  console.log(`TC emision:      $${inst.tc_emision} ← condiciones de emision`);
  console.log(`TC actual:       $${TC_ACTUAL} ← BCRA`);

  const vto = new Date(inst.fecha_vencimiento);
  const dias = diasEntre(settlement, vto);

  // 1. Coeficiente Dolar Linked
  const coefDL = coeficienteDL(TC_ACTUAL, inst.tc_emision);
  console.log(`\nCoef DL:  ${coefDL.toFixed(4)} (= ${TC_ACTUAL} / ${inst.tc_emision})`);
  console.log(`El peso se devaluo ${((coefDL - 1) * 100).toFixed(1)}% desde la emision`);

  // 2. Pago ajustado al vencimiento
  const pagoAjustado = inst.pago_final * coefDL;
  console.log(`\nPago al vto (nominal):  $${inst.pago_final.toFixed(2)}`);
  console.log(`Pago al vto (ajustado): $${pagoAjustado.toFixed(2)} (= ${inst.pago_final} * ${coefDL.toFixed(4)})`);

  // 3. Pero al vencimiento se ajustara por el TC de ESE dia (desconocido)
  //    Para estimar, asumimos que el TC sigue al ritmo del crawling peg
  const crawlingMensual = 0.01; // 1% mensual (ejemplo)
  const mesesAlVto = dias / 30;
  const tcEstimadoVto = TC_ACTUAL * Math.pow(1 + crawlingMensual, mesesAlVto);
  const coefDLEstimado = coeficienteDL(tcEstimadoVto, inst.tc_emision);
  const pagoEstimado = inst.pago_final * coefDLEstimado;

  console.log(`\nEstimacion con crawling peg ${(crawlingMensual * 100).toFixed(0)}% mensual:`);
  console.log(`  TC estimado al vto: $${tcEstimadoVto.toFixed(0)}`);
  console.log(`  Pago estimado:      $${pagoEstimado.toFixed(2)}`);

  // 4. TIR y TNA (sobre pago estimado)
  const tir = tirDirecta(market.price, pagoEstimado, dias);
  const tna = tnaLetra(market.price, pagoEstimado, dias);

  // 5. Paridad (sobre valor tecnico HOY)
  const vtHoy = valorTecnicoLetra(inst.pago_final, coefDL);
  const par = paridad(market.price, vtHoy);

  console.log(`\nResultados:`);
  console.log(`  TIR estimada (ARS): ${tir ? tir.toFixed(2) : 'N/A'}%`);
  console.log(`  TNA estimada (ARS): ${tna ? tna.toFixed(2) : 'N/A'}%`);
  console.log(`  VT actual:          $${vtHoy.toFixed(2)}`);
  console.log(`  Paridad:            ${par ? par.toFixed(1) : 'N/A'}%`);
  console.log('');
}

console.log(`
NOTAS:
- La TIR de LELINK es en PESOS (incluye devaluacion)
- Si paridad < 100% → le estas sacando rendimiento en USD ademas de la devaluacion
- Si paridad > 100% → estas pagando premio por la cobertura
- Para saber el rendimiento en USD: TIR_USD ≈ TIR_ARS - tasa de devaluacion
- El mercado "pricea" su expectativa de devaluacion en el precio
- Comparar TIR LELINK vs TIR LECAP muestra la devaluacion implicita del mercado
`);

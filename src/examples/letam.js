/**
 * LETAM / BONTAM — Letras y Bonos ajustados por TAMAR
 *
 * El capital se ajusta por la tasa TAMAR acumulada diariamente.
 * Es como un plazo fijo que se renueva todos los dias a la tasa mayorista.
 *
 * Datos necesarios:
 *   DE MERCADO (OMS):   precio
 *   ESTATICOS (CNV):    fecha_emision, fecha_vencimiento, spread (BONTAM)
 *   COEFICIENTES (BCRA): Serie TAMAR diaria (serie 44) desde emision hasta hoy
 *
 * DIFERENCIA CLAVE CON CER:
 *   CER  → BCRA publica el coeficiente acumulado. Solo dividis.
 *   TAMAR → BCRA publica la tasa del dia. VOS tenes que acumular.
 *
 * Se calculan: TIR estimada, Paridad
 * La TIR es ESTIMADA porque depende de la TAMAR futura (desconocida).
 *
 * Correr: node src/examples/letam.js
 */

const { tirDirecta } = require('../calculators/tir');
const { tnaLetra } = require('../calculators/tna');
const { paridad, valorTecnicoLetra } = require('../calculators/paridad');
const { acumularTAMAR, proyectarTAMAR } = require('../coefficients/tamar');
const { getSettlementDate, diasEntre, parseFecha } = require('../calculators/settlement');
const { getPrice } = require('../market/mock-prices');
const instrumentos = require('../../data/instrumentos.json');

console.log('═══════════════════════════════════════');
console.log(' LETAM — Letras ajustadas por TAMAR');
console.log('═══════════════════════════════════════\n');

// Simulamos datos de TAMAR (en produccion vienen de BCRA serie 44)
const TAMAR_ACTUAL_TNA = 0.32; // 32% TNA

// Simulamos serie historica de TAMAR (simplificada: misma tasa todos los dias)
// En produccion: llamar getSerieTAMAR(desde_emision, hoy) y acumularTAMAR(serie)
const DIAS_DESDE_EMISION = 40; // ejemplo

console.log(`TAMAR actual (simulada): ${(TAMAR_ACTUAL_TNA * 100).toFixed(1)}% TNA`);
console.log(`Fuente real: BCRA api.bcra.gob.ar/estadisticas/v4.0/Monetarias/44`);
console.log(`\nIMPORTANTE: TAMAR se publica como tasa diaria (TNA).`);
console.log(`Hay que acumularla multiplicativamente desde la emision.\n`);

const hoy = new Date();
const settlement = getSettlementDate(hoy);

for (const [ticker, inst] of Object.entries(instrumentos.letams)) {
  if (ticker.startsWith('_')) continue;

  const market = getPrice(ticker);
  if (!market) continue;

  console.log(`─── ${ticker} (${inst.nombre}) ───`);
  console.log(`Precio mercado:  $${market.price} (por 100 VN) ← OMS`);

  const vto = parseFecha(inst.fecha_vencimiento);
  const diasAlVto = diasEntre(settlement, vto);

  // 1. Coeficiente TAMAR acumulado desde emision hasta hoy
  //    En produccion: getSerieTAMAR(fecha_emision, hoy) → acumularTAMAR(serie)
  const coefTamarHistorico = proyectarTAMAR(TAMAR_ACTUAL_TNA, DIAS_DESDE_EMISION);
  console.log(`\nPaso 1: Acumular TAMAR desde emision hasta hoy`);
  console.log(`  TAMAR diaria = ${TAMAR_ACTUAL_TNA} / 365 = ${(TAMAR_ACTUAL_TNA / 365).toFixed(6)}`);
  console.log(`  Coef acumulado (${DIAS_DESDE_EMISION} dias) = ${coefTamarHistorico.toFixed(6)}`);
  console.log(`  Formula: Π (1 + TAMAR_dia/365) para cada dia`);

  // 2. Proyectar TAMAR futura (asumiendo constante)
  const diasFuturos = diasAlVto;
  const coefTamarProyectado = proyectarTAMAR(TAMAR_ACTUAL_TNA, diasFuturos);
  console.log(`\nPaso 2: Proyectar TAMAR futura (${diasFuturos} dias, asumiendo ${(TAMAR_ACTUAL_TNA*100).toFixed(0)}% constante)`);
  console.log(`  Coef proyectado = ${coefTamarProyectado.toFixed(6)}`);

  // 3. Coeficiente total (historico * proyectado)
  const coefTotal = coefTamarHistorico * coefTamarProyectado;
  console.log(`\nPaso 3: Coef total = historico * proyectado`);
  console.log(`  ${coefTamarHistorico.toFixed(6)} * ${coefTamarProyectado.toFixed(6)} = ${coefTotal.toFixed(6)}`);

  // 4. Pago estimado al vencimiento
  const pagoEstimado = inst.pago_final * coefTotal;
  console.log(`\nPaso 4: Pago estimado al vencimiento`);
  console.log(`  ${inst.pago_final} * ${coefTotal.toFixed(4)} = $${pagoEstimado.toFixed(2)}`);

  // 5. TIR y TNA estimadas
  const tir = tirDirecta(market.price, pagoEstimado, diasAlVto);
  const tna = tnaLetra(market.price, pagoEstimado, diasAlVto);

  // 6. Paridad
  const vtActual = inst.pago_final * coefTamarHistorico;
  const par = paridad(market.price, vtActual);

  console.log(`\nResultados:`);
  console.log(`  TIR estimada:  ${tir ? tir.toFixed(2) : 'N/A'}% (asume TAMAR constante!)`);
  console.log(`  TNA estimada:  ${tna ? tna.toFixed(2) : 'N/A'}%`);
  console.log(`  VT actual:     $${vtActual.toFixed(2)}`);
  console.log(`  Paridad:       ${par ? par.toFixed(1) : 'N/A'}%`);
  console.log('');
}

console.log(`
NOTAS:
- La TIR de LETAM/BONTAM es siempre ESTIMADA (depende de TAMAR futura)
- Si TAMAR baja, el rendimiento real sera menor al estimado
- Si TAMAR sube, el rendimiento sera mayor
- Para comparar LETAM vs LECAP: la diferencia de TIR es la "apuesta" a que TAMAR se mantiene
- BONTAM es igual pero con cupones periodicos (hay que acumular TAMAR por periodo)
- El spread de BONTAM (ej: +2%) se suma a la TAMAR de cada periodo
`);

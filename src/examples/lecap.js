/**
 * LECAP — Letra Capitalizable
 *
 * El instrumento mas simple de renta fija argentina.
 * Compras a un precio, cobras un monto fijo al vencimiento. Sin cupones intermedios.
 *
 * Datos necesarios:
 *   DE MERCADO (OMS):  precio
 *   ESTATICOS (CNV):   pago_final, fecha_vencimiento
 *   COEFICIENTES:      ninguno (tasa fija, no ajusta)
 *
 * Se calculan: TNA, TIR, Paridad
 *
 * Correr: node src/examples/lecap.js
 */

const { tirDirecta } = require('../calculators/tir');
const { tnaLetra } = require('../calculators/tna');
const { paridad, valorDevengadoLetra } = require('../calculators/paridad');
const { getSettlementDate, diasEntre, parseFecha } = require('../calculators/settlement');
const { getPrice } = require('../market/mock-prices');
const instrumentos = require('../../data/instrumentos.json');

console.log('═══════════════════════════════════════');
console.log(' LECAP / BONCAP — Letras y Bonos Capitalizables');
console.log('═══════════════════════════════════════\n');

const hoy = new Date();
const settlement = getSettlementDate(hoy);
console.log(`Fecha:        ${hoy.toISOString().slice(0, 10)}`);
console.log(`Liquidacion:  ${settlement.toISOString().slice(0, 10)} (T+1)\n`);

// Procesar LECAPs y BONCAPs juntos (misma logica)
const todos = { ...instrumentos.lecaps, ...instrumentos.boncaps };

console.log('Ticker   | Precio  | VT Deveng. | Dias | TNA     | TIR     | Paridad');
console.log('---------|---------|------------|------|---------|---------|--------');

for (const [ticker, inst] of Object.entries(todos)) {
  if (ticker.startsWith('_')) continue;

  // 1. Precio de mercado (del OMS)
  const market = getPrice(ticker);
  if (!market) continue;
  const precio = market.price;

  // 2. Datos estaticos (de la emision)
  const pagoFinal = inst.pago_final;
  const emision = parseFecha(inst.fecha_emision);
  const vto = parseFecha(inst.fecha_vencimiento);
  const dias = diasEntre(settlement, vto);

  // 3. Calculos
  const tna = tnaLetra(precio, pagoFinal, dias);
  const tir = tirDirecta(precio, pagoFinal, dias);

  // Paridad: precio vs valor devengado a settlement (NO vs pago_final)
  const diasDesdeEmision = diasEntre(emision, settlement);
  const diasTotales = diasEntre(emision, vto);
  const vt = valorDevengadoLetra(pagoFinal, diasDesdeEmision, diasTotales);
  const par = paridad(precio, vt);

  console.log(
    `${ticker.padEnd(8)} | ${precio.toFixed(2).padStart(7)} | ${vt.toFixed(3).padStart(10)} | ${String(dias).padStart(4)} | ${tna.toFixed(2).padStart(6)}% | ${tir.toFixed(2).padStart(6)}% | ${par.toFixed(1).padStart(5)}%`
  );
}

console.log(`
NOTAS:
- TNA < TIR siempre (TNA es simple, TIR es compuesta)
- A mayor plazo, mayor la diferencia TNA vs TIR
- Paridad = precio / VT devengado a settlement
- VT Devengado = interes capitalizado desde emision hasta hoy (no pago_final al vto)
- Paridad < 100% = descuento, > 100% = premio vs el devengado
- Precio viene del OMS (aca usamos mock)
`);

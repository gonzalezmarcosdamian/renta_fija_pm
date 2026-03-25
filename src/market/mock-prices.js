/**
 * mock-prices.js — Precios de ejemplo para testing y demos.
 *
 * EN PRODUCCION: estos datos vienen del OMS interno.
 * Aca ponemos datos realistas para que los devs puedan correr los ejemplos
 * sin necesitar acceso al OMS.
 *
 * Ultima actualizacion: 2025-03-21 (datos aproximados de mercado)
 */

const mockPrices = {
  // ─── LECAP (Letras capitalizables) ───
  S30M5: { ticker: 'S30M5', price: 103.20, bid: 103.15, ask: 103.25, volume: 1500000 },
  S18J5: { ticker: 'S18J5', price: 106.80, bid: 106.75, ask: 106.85, volume: 2000000 },
  S29A5: { ticker: 'S29A5', price: 108.40, bid: 108.35, ask: 108.45, volume: 1200000 },

  // ─── BONCAP (Bonos capitalizables) ───
  T15E7: { ticker: 'T15E7', price: 125.50, bid: 125.40, ask: 125.60, volume: 800000 },
  T30J6: { ticker: 'T30J6', price: 115.30, bid: 115.20, ask: 115.40, volume: 950000 },

  // ─── BONCER (Bonos ajustados por CER) ───
  TX26:  { ticker: 'TX26',  price: 89.50,  bid: 89.40,  ask: 89.60,  volume: 3000000 },
  TX28:  { ticker: 'TX28',  price: 78.20,  bid: 78.10,  ask: 78.30,  volume: 2500000 },
  DICP:  { ticker: 'DICP',  price: 1850.00, bid: 1848.00, ask: 1852.00, volume: 500000 },

  // ─── LECER (Letras ajustadas por CER) ───
  X18J5: { ticker: 'X18J5', price: 102.50, bid: 102.40, ask: 102.60, volume: 1800000 },
  X16Y5: { ticker: 'X16Y5', price: 104.80, bid: 104.70, ask: 104.90, volume: 1300000 },

  // ─── LETAM (Letras ajustadas por TAMAR) ───
  TM26F6: { ticker: 'TM26F6', price: 101.80, bid: 101.70, ask: 101.90, volume: 900000 },
  TM26M6: { ticker: 'TM26M6', price: 103.50, bid: 103.40, ask: 103.60, volume: 700000 },

  // ─── LELINK (Letras Dolar Linked) ───
  DL30J5: { ticker: 'DL30J5', price: 99.50, bid: 99.40, ask: 99.60, volume: 600000 },

  // ─── BONTAM (Bonos ajustados por TAMAR) ───
  BT2Y7: { ticker: 'BT2Y7', price: 98.50, bid: 98.40, ask: 98.60, volume: 400000 },

  // ─── BOTE (Bonos a tasa fija con cupon) ───
  TTE26: { ticker: 'TTE26', price: 95.80, bid: 95.70, ask: 95.90, volume: 350000 },
};

/**
 * Simula consulta al OMS.
 * En produccion reemplazar por llamada real al OMS.
 *
 * @param {string} ticker
 * @returns {MarketPrice|null}
 */
function getPrice(ticker) {
  return mockPrices[ticker] || null;
}

/**
 * Simula consulta bulk al OMS.
 * @param {string[]} tickers
 * @returns {Object.<string, MarketPrice>}
 */
function getPrices(tickers) {
  const result = {};
  for (const t of tickers) {
    if (mockPrices[t]) result[t] = mockPrices[t];
  }
  return result;
}

module.exports = { mockPrices, getPrice, getPrices };

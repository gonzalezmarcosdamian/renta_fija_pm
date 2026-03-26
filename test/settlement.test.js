const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getSettlementDate, diasEntre, parseFecha } = require('../src/calculators/settlement');

describe('getSettlementDate', () => {
  it('T+1 dia habil (jueves → viernes)', () => {
    const fecha = new Date(2025, 2, 20); // jueves 20 marzo local
    const settlement = getSettlementDate(fecha);
    assert.equal(settlement.getDate(), 21); // viernes
  });

  it('T+1 saltea fin de semana y feriados', () => {
    // viernes 21 marzo → lunes 24 es feriado (Dia de la Memoria) → martes 25
    const fecha = new Date(2025, 2, 21); // viernes 21 marzo local
    const settlement = getSettlementDate(fecha);
    assert.equal(settlement.getDate(), 25); // martes (lunes 24 es feriado)
  });
});

describe('diasEntre', () => {
  it('dias corridos entre dos fechas (parseFecha)', () => {
    // Usar parseFecha como en el codigo real
    const desde = parseFecha('2026-03-27');
    const hasta = parseFecha('2026-04-17');
    assert.equal(diasEntre(desde, hasta), 21);
  });

  it('funciona con settlement (Date local con hora) y parseFecha', () => {
    // Simula el caso real: settlement viene de getSettlementDate (hora local)
    // vencimiento viene de parseFecha (medianoche local)
    const settlement = new Date(2026, 2, 27, 15, 30, 0); // Mar 27 15:30 local
    const vto = parseFecha('2026-04-17'); // Apr 17 medianoche local
    assert.equal(diasEntre(settlement, vto), 21);
  });

  it('minimo 1 dia', () => {
    const d = parseFecha('2026-03-27');
    assert.equal(diasEntre(d, d), 1);
  });

  it('caso extremo: mismo dia con horas distintas da 1', () => {
    const d1 = new Date(2026, 2, 27, 0, 0, 0);
    const d2 = new Date(2026, 2, 27, 23, 59, 59);
    assert.equal(diasEntre(d1, d2), 1);
  });
});

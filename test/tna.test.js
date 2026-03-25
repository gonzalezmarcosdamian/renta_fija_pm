const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { tnaLetra, tnaDesdeVCP, tnaDeseTIR } = require('../src/calculators/tna');

describe('tnaLetra', () => {
  it('calcula TNA simple anualizada', () => {
    // Ganancia 10% en 180 dias → TNA = 0.10 * 365/180 * 100 = 20.27%
    const tna = tnaLetra(100, 110, 180);
    assert.ok(Math.abs(tna - 20.28) < 0.1, `TNA ${tna} deberia ser ~20.28`);
  });

  it('TNA = 0 sin ganancia', () => {
    const tna = tnaLetra(100, 100, 30);
    assert.ok(Math.abs(tna) < 0.01);
  });

  it('TNA negativa con perdida', () => {
    const tna = tnaLetra(105, 100, 30);
    assert.ok(tna < 0);
  });

  it('retorna null con inputs invalidos', () => {
    assert.equal(tnaLetra(0, 100, 30), null);
    assert.equal(tnaLetra(100, null, 30), null);
    assert.equal(tnaLetra(100, 110, 0), null);
  });
});

describe('tnaDesdeVCP', () => {
  it('calcula TNA desde cambio en cuotaparte', () => {
    // VCP subio 0.1% en 1 dia → TNA = 0.001 * 365 * 100 = 36.5%
    const tna = tnaDesdeVCP(100.1, 100, 1);
    assert.equal(tna, 36.5);
  });

  it('redondea a 2 decimales', () => {
    const tna = tnaDesdeVCP(100.033, 100, 1);
    const decimals = tna.toString().split('.')[1]?.length || 0;
    assert.ok(decimals <= 2);
  });

  it('TNA negativa si VCP baja', () => {
    const tna = tnaDesdeVCP(99.9, 100, 1);
    assert.ok(tna < 0);
  });
});

describe('tnaDeseTIR', () => {
  it('TNA < TIR para mismo plazo', () => {
    const tir = 30; // 30% TIR
    const tna = tnaDeseTIR(tir, 180);
    assert.ok(tna < tir, `TNA ${tna} debe ser menor que TIR ${tir}`);
  });

  it('TNA ≈ TIR para plazos muy cortos', () => {
    const tir = 30;
    const tna = tnaDeseTIR(tir, 1);
    assert.ok(Math.abs(tna - tir) < 0.5, 'Para 1 dia, TNA ≈ TIR');
  });
});

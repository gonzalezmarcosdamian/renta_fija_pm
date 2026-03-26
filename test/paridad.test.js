const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { valorResidual, vrPorFlujo, valorTecnicoLetra, valorDevengadoLetra, valorTecnicoBono, paridad } = require('../src/calculators/paridad');

describe('valorResidual', () => {
  it('VR = 1 antes de cualquier amortizacion', () => {
    const flujos = [
      { fecha: '2026-06-01', amortizacion: 0.5 },
      { fecha: '2026-12-01', amortizacion: 0.5 },
    ];
    const vr = valorResidual(flujos, new Date('2025-01-01'));
    assert.equal(vr, 1);
  });

  it('VR baja con amortizaciones pagadas', () => {
    const flujos = [
      { fecha: '2024-06-01', amortizacion: 0.2 },
      { fecha: '2024-12-01', amortizacion: 0.2 },
      { fecha: '2025-06-01', amortizacion: 0.3 },
      { fecha: '2025-12-01', amortizacion: 0.3 },
    ];
    const vr = valorResidual(flujos, new Date('2025-03-01'));
    assert.ok(Math.abs(vr - 0.6) < 0.001, `VR ${vr} deberia ser 0.6`);
  });

  it('VR = 0 cuando amortizo todo', () => {
    const flujos = [
      { fecha: '2024-01-01', amortizacion: 0.5 },
      { fecha: '2024-06-01', amortizacion: 0.5 },
    ];
    const vr = valorResidual(flujos, new Date('2025-01-01'));
    assert.equal(vr, 0);
  });
});

describe('vrPorFlujo', () => {
  it('calcula VR antes de cada flujo correctamente', () => {
    const flujos = [
      { amortizacion: 0.0 },
      { amortizacion: 0.25 },
      { amortizacion: 0.25 },
      { amortizacion: 0.50 },
    ];
    const result = vrPorFlujo(flujos);
    assert.equal(result[0].vr_antes, 1.00);
    assert.equal(result[1].vr_antes, 1.00);
    assert.equal(result[2].vr_antes, 0.75);
    assert.equal(result[3].vr_antes, 0.50);
  });
});

describe('paridad', () => {
  it('bajo la par', () => {
    const par = paridad(90, 100);
    assert.equal(par, 90);
  });

  it('sobre la par', () => {
    const par = paridad(105, 100);
    assert.equal(par, 105);
  });

  it('a la par', () => {
    const par = paridad(100, 100);
    assert.equal(par, 100);
  });

  it('retorna null si VT es 0', () => {
    assert.equal(paridad(100, 0), null);
  });
});

describe('valorDevengadoLetra', () => {
  it('al inicio (dia 0) devuelve 100', () => {
    const vt = valorDevengadoLetra(110.125, 0, 120);
    assert.ok(Math.abs(vt - 100) < 0.01, `VT ${vt} deberia ser 100`);
  });

  it('al vencimiento (dia total) devuelve pago_final', () => {
    const vt = valorDevengadoLetra(110.125, 120, 120);
    assert.ok(Math.abs(vt - 110.125) < 0.01, `VT ${vt} deberia ser 110.125`);
  });

  it('a mitad de plazo devuelve valor intermedio capitalizado', () => {
    // pago_final 110.125, mitad de plazo (60 de 120 dias)
    // VT = 100 * (1.10125)^0.5 ≈ 104.94
    const vt = valorDevengadoLetra(110.125, 60, 120);
    assert.ok(vt > 100 && vt < 110.125, `VT ${vt} deberia estar entre 100 y 110.125`);
    assert.ok(Math.abs(vt - 104.94) < 0.1, `VT ${vt} deberia ser ~104.94`);
  });

  it('capitalizacion es exponencial, no lineal', () => {
    // A 3/4 del plazo, el devengado exponencial es distinto del lineal
    const vt = valorDevengadoLetra(110.125, 90, 120);
    const vtLineal = 100 + (110.125 - 100) * (90 / 120); // 107.59 (lineal)
    // El exponencial deberia ser ligeramente distinto al lineal
    assert.notEqual(Math.round(vt * 100), Math.round(vtLineal * 100));
  });
});

describe('valorTecnicoBono', () => {
  it('sin ajuste: VT = VR * 100', () => {
    assert.equal(valorTecnicoBono(0.8, 1), 80);
    assert.equal(valorTecnicoBono(1, 1), 100);
  });

  it('con CER: VT = VR * coefCER * 100', () => {
    const vt = valorTecnicoBono(0.6, 1.05); // VR 60%, CER subio 5%
    assert.ok(Math.abs(vt - 63) < 0.01, `VT ${vt} deberia ser 63`);
  });
});

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { tirDirecta, tirNewtonRaphson, precioDesdeYTM } = require('../src/calculators/tir');

describe('tirDirecta (LECAP/BONCAP)', () => {
  it('calcula TIR para LECAP tipica', () => {
    // Compro a 108.40, cobro 110.125 en 27 dias
    const tir = tirDirecta(108.40, 110.125, 27);
    assert.ok(tir > 20 && tir < 30, `TIR ${tir} deberia estar entre 20-30%`);
  });

  it('TIR es mayor que TNA para mismo instrumento', () => {
    const tir = tirDirecta(100, 110, 180);
    // TNA = (110/100 - 1) * 365/180 * 100 = 20.27%
    const tna = (110 / 100 - 1) * (365 / 180) * 100;
    assert.ok(tir > tna, 'TIR compuesta debe ser mayor que TNA simple');
  });

  it('TIR = 0 cuando precio = pago final', () => {
    const tir = tirDirecta(100, 100, 30);
    assert.ok(Math.abs(tir) < 0.01, 'Sin ganancia, TIR debe ser ~0');
  });

  it('TIR negativa cuando precio > pago final', () => {
    const tir = tirDirecta(105, 100, 30);
    assert.ok(tir < 0, 'Perdida debe dar TIR negativa');
  });

  it('retorna null con inputs invalidos', () => {
    assert.equal(tirDirecta(0, 100, 30), null);
    assert.equal(tirDirecta(100, 0, 30), null);
    assert.equal(tirDirecta(100, 110, 0), null);
    assert.equal(tirDirecta(100, 110, -5), null);
  });
});

describe('tirNewtonRaphson (bonos con flujos)', () => {
  it('converge para bono con flujos conocidos', () => {
    const hoy = new Date('2025-03-21');
    const flujos = [
      { fecha: new Date('2025-09-21'), monto: 0.05 },  // cupon 5%
      { fecha: new Date('2026-03-21'), monto: 0.05 },  // cupon 5%
      { fecha: new Date('2026-09-21'), monto: 1.05 },  // cupon + capital
    ];
    const precio = 0.95; // por 1 VN
    const tir = tirNewtonRaphson(precio, flujos, hoy);
    assert.ok(tir > 0, 'Bono bajo la par debe tener TIR positiva');
    assert.ok(tir < 50, `TIR ${tir} parece demasiado alta`);
  });

  it('TIR = ~cupon cuando precio = 100', () => {
    const hoy = new Date('2025-01-01');
    const flujos = [
      { fecha: new Date('2025-07-01'), monto: 0.04 },
      { fecha: new Date('2026-01-01'), monto: 1.04 },
    ];
    const tir = tirNewtonRaphson(1.0, flujos, hoy);
    // Bono a la par con cupon 8% anual deberia dar ~8%
    assert.ok(Math.abs(tir - 8) < 1, `TIR ${tir} deberia estar cerca de 8%`);
  });

  it('ignora flujos pasados', () => {
    const hoy = new Date('2025-06-01');
    const flujos = [
      { fecha: new Date('2025-01-01'), monto: 0.04 }, // pasado, ignorar
      { fecha: new Date('2025-12-01'), monto: 1.04 }, // futuro
    ];
    const tir = tirNewtonRaphson(1.0, flujos, hoy);
    assert.ok(tir > 0, 'Debe calcular solo con flujos futuros');
  });
});

describe('precioDesdeYTM (inverso)', () => {
  it('precio desde TIR es consistente con tirNewtonRaphson', () => {
    const hoy = new Date('2025-03-21');
    const flujos = [
      { fecha: new Date('2025-09-21'), monto: 0.05 },
      { fecha: new Date('2026-03-21'), monto: 1.05 },
    ];
    const precioOriginal = 0.98;
    const tir = tirNewtonRaphson(precioOriginal, flujos, hoy);
    const precioRecalculado = precioDesdeYTM(tir, flujos, hoy);
    assert.ok(
      Math.abs(precioOriginal - precioRecalculado) < 0.001,
      `Precio ${precioRecalculado} deberia ser ~${precioOriginal}`
    );
  });
});

# Add Instrument — Agregar nuevo instrumento

Guia paso a paso para agregar un instrumento de renta fija al sistema.

## Cuando usar
- Despues de una licitacion del Tesoro
- Cuando se lista un ticker nuevo en el OMS
- Para completar datos de prospecto de un instrumento existente

## Proceso segun tipo

### LECAP / BONCAP (3 datos)
1. Obtener del resultado de licitacion: ticker, fecha_vencimiento, pago_final
2. Agregar a data/instrumentos.json en la seccion correspondiente
3. Formato:
```json
{
  "ticker": "S__X_",
  "ticker_d912": "S__X_",
  "tipo": "lecap",
  "nombre": "LECAP [Mes] [Ano]",
  "fecha_vencimiento": "YYYY-MM-DD",
  "pago_final": 000.000
}
```

### LECER (4 datos)
1. Igual que LECAP + obtener CER del dia de emision de BCRA serie 30
2. pago_final es siempre 100.00 (se ajusta por CER)
3. Agregar cer_emision

### LETAM (4 datos)
1. Igual que LECAP + fecha_emision (para acumular TAMAR desde ese dia)
2. pago_final es siempre 100.00 (se ajusta por TAMAR)

### LELINK (4 datos)
1. Igual que LECAP + TC oficial del dia de emision (BCRA serie 4)
2. pago_final es siempre 100.00 (se ajusta por TC)

### BONCER (prospecto completo)
1. Obtener cer_emision de BCRA serie 30 del dia de emision
2. Obtener cronograma de flujos del prospecto: para cada pago futuro necesitas fecha, amortizacion (0 a 1), tasa_interes, base (0.5 = semestral)
3. Las amortizaciones de todo el bono deben sumar 1.0

### BONTAM (prospecto completo)
1. Obtener fecha_emision y spread_tamar del prospecto
2. Cronograma: fecha, amortizacion, base. Sin tasa (la tasa es TAMAR)
3. Las amortizaciones deben sumar 1.0

### BOTE (prospecto completo)
1. Cronograma de flujos con monto fijo (cupon + amort) por cada fecha de pago
2. El ultimo flujo incluye devolucion de capital

### Soberanos (prospecto completo)
1. Flujos en USD por 100 VN: fecha + monto (cupon + amort)
2. ley: "local" (AL/AE) o "NY" (GD)
3. par: ticker del equivalente en otra ley

## Despues de agregar
1. Actualizar data/tickers-oms.json si viene del OMS
2. Correr /validate-formulas para verificar
3. Verificar que la landing calcula bien con el nuevo instrumento

## Checklist
- [ ] Datos de prospecto verificados contra fuente oficial
- [ ] Amortizaciones suman 1.0 (para bonos con flujos)
- [ ] Fecha de vencimiento coincide con ultimo flujo
- [ ] Ticker existe en data912 (para precio live)
- [ ] Formula validada con /validate-formulas

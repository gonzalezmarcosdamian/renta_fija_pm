# Validate Formulas — Validacion de calculos financieros

Verifica que todas las formulas del proyecto calculan correctamente.

## Cuando usar
- Antes de compartir con negocio
- Despues de cambiar cualquier formula en calculators/ o en la landing
- Despues de agregar un nuevo instrumento
- Periodicamente como sanity check

## Que validar

### 1. Consistencia TNA vs TIR
Para LECAP/BONCAP con los mismos inputs:
- TNA DEBE ser menor que TIR (siempre)
- Ambas deben ser positivas si pago_final > precio
- Ambas deben ser negativas si pago_final < precio
- Si dias = 1, TNA ≈ TIR (diferencia < 0.1%)

### 2. Newton-Raphson converge
Para cada instrumento con flujos (BONCER, BOTE, BONTAM, Soberanos):
- Debe converger en < 100 iteraciones
- |PV - precio| < 0.0001 al terminar
- TIR debe estar en rango razonable (-50% a 200%)
- Bono a la par (precio ≈ suma flujos): TIR ≈ tasa cupon

### 3. Paridad coherente
- Paridad > 0 siempre
- Paridad < 100% = bajo la par (descuento)
- Paridad > 100% = sobre la par (premio)
- Si precio = VT, paridad = 100% exacto

### 4. Duration coherente
- Duration > 0 siempre
- Duration < anos al vencimiento (siempre)
- Para zero coupon: Duration ≈ anos al vencimiento
- Duration BOTE corto < Duration BOTE largo

### 5. Coeficientes CER/TAMAR/TC
- coef_CER > 1 si CER_actual > CER_emision (siempre para bonos viejos)
- coef_TAMAR acumulado > 1 (siempre crece)
- coef_DL: verificar que TC_actual / TC_emision es razonable

### 6. Precio inverso
- precioDesdeYTM(TIR, flujos) debe devolver el precio original (± 0.001)

## Proceso
1. Leer data/instrumentos.json
2. Para cada instrumento, correr el calculo con precio mock
3. Verificar cada regla de arriba
4. Reportar: PASS / FAIL con detalle

## Output
Tabla con:
| Ticker | Tipo | Test | Resultado | Detalle |

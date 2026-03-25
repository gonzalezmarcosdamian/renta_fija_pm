# Cross-Check — Cruzar datos contra fuentes externas

Compara los datos del proyecto contra las fuentes reales para detectar inconsistencias.

## Cuando usar
- Periodicamente (1 vez por semana)
- Antes de presentar a negocio
- Despues de agregar instrumentos nuevos
- Cuando se sospecha que un dato esta desactualizado

## Que cruzar

### 1. Precios (data912 vs instrumentos.json)
Para cada ticker en instrumentos.json:
- Verificar que el ticker existe en data912
- Si el instrumento vencio (fecha_vto < hoy), marcar como vencido
- Si data912 no tiene precio (vol = 0), marcar como sin liquidez

### 2. CER emision (BCRA vs instrumentos.json)
Para cada BONCER/LECER:
- El CER de emision debe coincidir con BCRA serie 30 de la fecha de emision
- Si no se tiene la fecha de emision exacta, verificar que el CER es razonable para la epoca

### 3. Pago final (licitacion vs instrumentos.json)
Para cada LECAP/BONCAP:
- Verificar que pago_final coincide con el resultado de licitacion publicado
- Si el instrumento vencio, marcarlo como inactivo

### 4. Tickers OMS (tickers-oms.json vs instrumentos.json)
- Tickers en OMS que no estan en instrumentos.json → faltan datos de prospecto
- Tickers en instrumentos.json que no estan en OMS → son ejemplos (ok) o se deslistaron

### 5. Flujos (coherencia interna)
Para cada bono con flujos:
- Amortizaciones deben sumar 1.0 (± 0.001)
- Fechas deben estar en orden cronologico
- No debe haber flujos duplicados (misma fecha)
- Ultimo flujo debe coincidir con fecha de vencimiento (± 5 dias)

### 6. BCRA APIs (disponibilidad)
- Serie 30 (CER): verificar que devuelve datos recientes (< 3 dias)
- Serie 44 (TAMAR): verificar que devuelve datos recientes
- Serie 4 (TC): verificar que devuelve datos recientes

## Proceso
1. Fetch data912 (arg_bonds + arg_notes)
2. Fetch BCRA series 30, 44, 4
3. Leer data/instrumentos.json
4. Leer data/tickers-oms.json
5. Ejecutar cada cruce
6. Reportar hallazgos

## Output
Tabla con:
| # | Tipo | Ticker | Hallazgo | Accion sugerida |

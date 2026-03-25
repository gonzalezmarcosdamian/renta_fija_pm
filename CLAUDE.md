# CLAUDE.md

## Proyecto

uala-abc-data — Proyecto educativo y de referencia para el equipo de desarrollo.
Explica como calcular TNA, TIR, Paridad y Duration para todos los instrumentos
de renta fija en pesos del mercado argentino.

No es una app productiva. Es una libreria de calculos + ejemplos ejecutables
que los devs pueden correr, leer y entender.

## Stack

- **Runtime**: Node.js (>= 18, usa node:test nativo)
- **Dependencias**: Cero. Todo vanilla.
- **Datos de mercado**: Abstraidos via interfaz. En produccion vienen del OMS interno.
  Para ejemplos y tests se usan datos hardcodeados o APIs publicas (BCRA, ArgentinaDatos).
- **Coeficientes**: BCRA API (CER serie 30, TAMAR serie 44, TC Oficial serie 4)

## Estructura

```
src/
  calculators/       # Funciones puras de calculo (TNA, TIR, Paridad, Duration)
    tir.js           # Newton-Raphson para TIR/YTM
    tna.js           # TNA segun tipo de instrumento
    paridad.js       # Paridad y Valor Tecnico
    duration.js      # Macaulay Duration
    settlement.js    # Fecha de liquidacion T+1

  coefficients/      # Consumo de coeficientes de ajuste (BCRA)
    cer.js           # CER - Coef. Estabilizacion de Referencia
    tamar.js         # TAMAR - Tasa mayorista plazos fijos
    tc-oficial.js    # Tipo de cambio oficial A3500

  market/            # Interfaz de datos de mercado
    types.js         # Tipos/contratos de datos (JSDoc)
    mock-prices.js   # Precios mock para testing y ejemplos

  examples/          # Ejemplos ejecutables (node src/examples/lecap.js)
    lecap.js
    boncer.js
    letam.js
    lelink.js
    bote.js
    bontam.js

data/
  instrumentos.json  # Condiciones de emision de cada instrumento

test/
  tir.test.js
  tna.test.js
  paridad.test.js
```

## Reglas

- Cero dependencias externas. Todo con Node.js nativo.
- Cada funcion tiene un bloque de documentacion con la formula matematica.
- Los ejemplos deben ser ejecutables standalone: `node src/examples/lecap.js`
- Separar SIEMPRE: dato de mercado (OMS) vs coeficiente (BCRA) vs calculo puro.
- Los calculators son funciones puras: reciben numeros, devuelven numeros. Sin I/O.
- Los coefficients hacen fetch a BCRA y devuelven el dato limpio.
- No usar frameworks, no usar TypeScript, no usar build tools.

## Convenciones

- Precios siempre por cada 100 VN (valor nominal), salvo que se indique.
- Fechas como Date objects en los calculators, strings ISO en JSON.
- TIR y TNA se devuelven como porcentaje (ej: 35.5 = 35.5%).
- Flujos: array de {fecha: Date, monto: number}.
- Settlement: T+1 habil (dias habiles argentinos).

## Prompts para agentes

### Agregar nuevo instrumento

```
Agrega un nuevo instrumento en data/instrumentos.json.
Seguir el formato existente para su tipo (lecap, boncer, etc).
Si es un tipo nuevo, crear el ejemplo correspondiente en src/examples/.
Datos de emision se sacan del Ministerio de Economia o CNV.
```

### Verificar formulas

```
Lee src/calculators/ y verifica que las formulas coincidan con
el documento contexto-renta-fija-argentina.md del proyecto padre.
Correr npm test para validar.
```

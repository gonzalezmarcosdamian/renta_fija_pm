# Documento Funcional — uala-abc-data

## Objetivo

Proyecto educativo y de referencia para el equipo de desarrollo.
Explica como calcular TNA, TIR, Paridad y Duration para todos los instrumentos
de renta fija en pesos del mercado argentino.

---

## Universo de instrumentos

### Letras (corto plazo, tipicamente < 1 ano)

| Ticker patrón | Tipo | Ajuste | Ejemplo |
|---|---|---|---|
| S + fecha | **LECAP** — Letra capitalizable | Ninguno (tasa fija) | S29A5 |
| X + fecha | **LECER** — Letra ajustada por CER | CER (inflacion) | X18J5 |
| TM + fecha | **LETAM** — Letra ajustada por TAMAR | TAMAR (tasa variable) | TM26F6 |
| DL + fecha | **LELINK** — Letra dolar linked | TC Oficial (devaluacion) | DL30J5 |

### Bonos (mediano/largo plazo)

| Ticker patrón | Tipo | Ajuste | Cupón | Ejemplo |
|---|---|---|---|---|
| T + fecha | **BONCAP** — Bono capitalizable | Ninguno | No (capitaliza) | T30J6 |
| TX/TC + fecha | **BONCER** — Bono ajustado por CER | CER | Si, periodico | TX26 |
| BT + fecha | **BONTAM** — Bono ajustado por TAMAR | TAMAR + spread | Si, periodico | BT2Y7 |
| TT + fecha | **BOTE** — Bono tasa fija | Ninguno | Si, fijo | TTE26 |

---

## Datos necesarios por instrumento

### Clasificacion de datos por origen

```
┌─────────────────────────────────────────────────────────────┐
│                     ORIGEN DE DATOS                          │
├──────────────────┬──────────────────┬───────────────────────┤
│   OMS (mercado)  │   BCRA (coef.)   │  CNV/MEcon (emision)  │
│   Tiempo real    │   Diario         │  Fijo (nunca cambia)  │
├──────────────────┼──────────────────┼───────────────────────┤
│ • Precio         │ • CER (serie 30) │ • Ticker              │
│ • Bid / Ask      │ • TAMAR (serie 44│ • Fecha vencimiento   │
│ • Volumen        │   o 135)         │ • Pago final          │
│ • Timestamp      │ • TC Oficial     │ • CER de emision      │
│                  │   (serie 4)      │ • TC de emision       │
│                  │                  │ • Fecha emision       │
│                  │                  │ • Spread TAMAR        │
│                  │                  │ • Tasa cupon          │
│                  │                  │ • Cronograma flujos   │
└──────────────────┴──────────────────┴───────────────────────┘
```

### Detalle por instrumento — datos del prospecto (CNV)

#### LECAP / BONCAP
```json
{
  "ticker": "S29A5",
  "tipo": "lecap",
  "fecha_vencimiento": "2025-08-29",
  "pago_final": 114.20
}
```
Solo 3 campos. El mas simple.

#### LECER
```json
{
  "ticker": "X18J5",
  "tipo": "lecer",
  "fecha_vencimiento": "2025-07-18",
  "pago_final": 100.00,
  "cer_emision": 22.100
}
```
Agrega `cer_emision` — el CER del dia de emision (fijo, nunca cambia).

#### LETAM
```json
{
  "ticker": "TM26F6",
  "tipo": "letam",
  "fecha_vencimiento": "2026-02-26",
  "pago_final": 100.00,
  "fecha_emision": "2025-02-15"
}
```
Agrega `fecha_emision` — desde cuando se acumula TAMAR.

#### LELINK
```json
{
  "ticker": "DL30J5",
  "tipo": "lelink",
  "fecha_vencimiento": "2025-06-30",
  "pago_final": 100.00,
  "tc_emision": 1050.00
}
```
Agrega `tc_emision` — TC oficial del dia de emision.

#### BONCER (el mas pesado en datos)
```json
{
  "ticker": "TX26",
  "tipo": "boncer",
  "vencimiento": "2026-11-09",
  "cer_emision": 22.544,
  "flujos": [
    { "fecha": "2025-11-10", "amortizacion": 0.20, "tasa_interes": 0.02, "base": 0.5 },
    { "fecha": "2026-05-11", "amortizacion": 0.20, "tasa_interes": 0.02, "base": 0.5 },
    { "fecha": "2026-11-09", "amortizacion": 0.20, "tasa_interes": 0.02, "base": 0.5 }
  ]
}
```
Cada flujo: `fecha` + `amortizacion` (0 a 1) + `tasa_interes` + `base` (0.5 = semestral).

#### BONTAM
```json
{
  "ticker": "BT2Y7",
  "tipo": "bontam",
  "vencimiento": "2027-03-15",
  "fecha_emision": "2025-03-15",
  "spread_tamar": 0.02,
  "flujos": [
    { "fecha": "2025-09-15", "amortizacion": 0.00, "base": 0.5 },
    { "fecha": "2026-03-15", "amortizacion": 0.25, "base": 0.5 },
    { "fecha": "2026-09-15", "amortizacion": 0.25, "base": 0.5 },
    { "fecha": "2027-03-15", "amortizacion": 0.50, "base": 0.5 }
  ]
}
```
Sin `tasa_interes` porque la tasa ES la TAMAR del periodo + spread.

#### BOTE
```json
{
  "ticker": "TTE26",
  "tipo": "bote",
  "vencimiento": "2026-10-15",
  "flujos": [
    { "fecha": "2025-04-15", "monto": 8.50 },
    { "fecha": "2025-10-15", "monto": 8.50 },
    { "fecha": "2026-04-15", "monto": 8.50 },
    { "fecha": "2026-10-15", "monto": 108.50 }
  ]
}
```
Los flujos son montos fijos (cupon + amortizacion). Todo conocido de antemano.

---

## Precios de mercado — Fuente para la demo

En produccion los precios vienen del **OMS interno**. Para esta demo educativa
usamos **data912.com** como fuente publica gratuita.

### Endpoints data912

| Endpoint | Que tiene | Instrumentos |
|---|---|---|
| `data912.com/live/arg_notes` | Letras (LECAPs, LECERs, LETAMs, LELINKs) | S*, X*, M*, D* |
| `data912.com/live/arg_bonds` | Bonos (BONCERs, BONCAPs, BOTEs, BONTAMs) | TX*, T*, TT*, TMF* |

### Estructura respuesta data912
```json
[
  { "symbol": "S17A6", "c": 108.479, "px_bid": 108.46, "px_ask": 108.48, "v": 135713547712 },
  ...
]
```
- `c` = ultimo precio operado
- `px_bid` / `px_ask` = puntas
- `v` = volumen nominal

### Atencion con las unidades de precio
| Instrumento | data912 devuelve | Para calcular usar |
|---|---|---|
| LECAP, BONCAP, LECER, LETAM | Precio por 100 VN | Directo |
| BONCER TX26 | Precio por 10 VN (~1299) | Dividir por 10 |
| LELINK D30A6 | Precio en miles (~137220) | Dividir por 1000 |
| BOTE TTS26 | Precio por 100 VN | Directo |
| BONTAM TMF27 | Precio por 100 VN | Directo |

---

## APIs BCRA — Endpoints verificados

Base URL: `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/{serie}`

### Series confirmadas (verificado 2026-03-25)

| Dato | Serie | Unidad | Valor actual | Frecuencia |
|---|---|---|---|---|
| **CER** | **30** | Coeficiente acumulado | 731.25 | Diaria |
| **TAMAR privados** | **44** | % TNA (ej: 26.75) | 26.75% | Diaria |
| **TAMAR publicos+privados** | **135** | % TNA | 26.13% | Diaria |
| **TC Oficial A3500** | **4** | ARS/USD | $1,402.60 | Diaria (habiles) |

### Estructura de respuesta

```json
{
  "status": 200,
  "results": [
    {
      "idVariable": 30,
      "detalle": [
        { "fecha": "2026-03-25", "valor": 731.25036737988 },
        { "fecha": "2026-03-24", "valor": 730.08451234567 }
      ]
    }
  ]
}
```

- `detalle` viene ordenado **DESC** (mas reciente primero)
- Para CER: `valor` es el coeficiente acumulado (dividir por CER_emision)
- Para TAMAR: `valor` es porcentaje TNA (ej: 26.75 = 26.75%)
- Para TC: `valor` es ARS por 1 USD

### Como se identificaron las series — proceso de rastreo

El BCRA no documenta de forma clara que serie corresponde a que dato.
Este es el proceso que se siguio para identificar las series correctas:

**Paso 1 — Punto de partida:**
El repo open-source rendimientos-ar usaba:
- CER → serie 30
- TAMAR → serie 27
- TC Oficial → serie 4

**Paso 2 — Verificacion con fetch real (2026-03-25):**
```
GET /Monetarias/30?desde=2026-03-18&hasta=2026-03-25
→ ✅ detalle: [{fecha: "2026-03-25", valor: 731.25}]  (CER funciona)

GET /Monetarias/27?desde=2026-03-18&hasta=2026-03-25
→ ❌ detalle: []  (VACIO — serie 27 NO contiene datos de TAMAR)

GET /Monetarias/4?desde=2026-03-18&hasta=2026-03-25
→ ✅ detalle: [{fecha: "2026-03-25", valor: 1402.60}]  (TC funciona)
```

**Paso 3 — Consulta al catalogo completo de series:**
```
GET /Monetarias  (sin parametros)
→ devuelve lista de TODAS las series disponibles con id, nombre, unidad
```

Filtrado por "TAMAR" se encontraron 5 series:

| Serie | Descripcion | Unidad | Desde |
|---|---|---|---|
| **44** | Tasa de interes TAMAR de bancos privados | % nominal anual | 2024-10-01 |
| 45 | Tasa de interes TAMAR de bancos privados | % efectivo anual | 2024-10-01 |
| **135** | Tasa de interes TAMAR de bancos publicos y privados | % nominal anual | 2024-10-01 |
| 136 | Tasa de interes TAMAR de bancos privados | % nominal anual | 2024-10-01 |
| 137 | Tasa de interes TAMAR de bancos privados | % efectivo anual | 2024-10-01 |

Series 136/137 son duplicados de 44/45.

**Paso 4 — Verificacion de las candidatas:**
```
GET /Monetarias/44?desde=2026-03-18&hasta=2026-03-25
→ ✅ detalle: [
    {fecha: "2026-03-20", valor: 26.75},
    {fecha: "2026-03-19", valor: 26.5625},
    {fecha: "2026-03-18", valor: 27.1875}
  ]

GET /Monetarias/135?desde=2026-03-18&hasta=2026-03-25
→ ✅ detalle: [
    {fecha: "2026-03-20", valor: 26.125},
    {fecha: "2026-03-19", valor: 26.5625},
    {fecha: "2026-03-18", valor: 26.5625}
  ]
```

**Paso 5 — Decision:**
Se eligio **serie 44** (bancos privados, TNA) porque:
- Es la mas referenciada en el mercado para liquidar instrumentos TAMAR
- La diferencia con serie 135 (publicos+privados) es menor (~0.6%)
- TNA (nominal anual) es la unidad que se necesita para acumular diariamente

**Pendiente de validacion:** confirmar con el area de operaciones si los instrumentos
LETAM/BONTAM se liquidan con serie 44 (privados) o serie 135 (todos).

### Serie 27 — NO es TAMAR

La serie 27 que aparece en el repo rendimientos-ar y otros repositorios open-source
devuelve `detalle: []` (vacio) al consultar. No contiene datos de TAMAR.
Fue verificado el 2026-03-25 con multiples rangos de fechas. No usar.

---

## Formulas de calculo

### 1. TNA (Tasa Nominal Anual) — Interes simple

```
ganancia = pago_final / precio
TNA = (ganancia - 1) × (365 / dias) × 100
```

**Aplica a:** LECAP, BONCAP, LECER (simple), LELINK (simple)
**No aplica a:** BONCER, BONTAM (no tiene sentido TNA nominal para ajustables)

### 2. TIR (Tasa Interna de Retorno) — Interes compuesto

#### Para pago unico (LECAP, BONCAP, LECER, LETAM, LELINK):
```
TIR = (ganancia ^ (365 / dias) - 1) × 100
```

#### Para multiples flujos (BONCER, BOTE, BONTAM, Soberanos):
```
Newton-Raphson: encontrar r tal que
  precio/100 = Σ [ flujo(i) / (1 + r) ^ t(i) ]

Iteracion:
  r_nuevo = r - (PV - precio) / dPV
  donde dPV = Σ [ -t(i) × flujo(i) / (1+r)^(t(i)+1) ]
  Converge cuando |PV - precio| < 0.0001
  Bounds: -50% ≤ r ≤ 200%
```

### 3. Paridad

```
Valor Tecnico = VR × coeficiente × 100
Paridad = precio / Valor_Tecnico × 100
```

- **VR** (Valor Residual) = 1 - Σ amortizaciones pagadas
- **Coeficiente**: CER, TAMAR acumulado, TC, o 1 (sin ajuste)
- Paridad < 100% = descuento, > 100% = premio

### 4. Duration (Macaulay)

```
Duration = Σ [ t(i) × VP(flujo_i) ] / Σ [ VP(flujo_i) ]
donde VP(flujo_i) = flujo(i) / (1 + TIR)^t(i)
```
Medida en anos. Indica sensibilidad del precio ante cambios de tasa.

---

## Coeficientes de ajuste — como se calculan

### CER (para LECER, BONCER)
```
coef_CER = CER_actual / CER_emision
flujo_ajustado = flujo_nominal × coef_CER
```
BCRA publica el acumulado. Solo hay que dividir.

### TAMAR (para LETAM, BONTAM)
```
BCRA publica tasa diaria como % TNA
tasa_diaria = TAMAR_dia / 100 / 365
coef_TAMAR = Π [ (1 + tasa_diaria(i)) ] para cada dia desde emision
```
Hay que acumular la serie completa dia por dia. Si faltan dias (feriados),
se repite la tasa del ultimo habil.

Para flujos futuros: se proyecta asumiendo TAMAR constante (estimacion).

### TC Oficial (para LELINK)
```
coef_DL = TC_actual / TC_emision
pago_ajustado = pago_final × coef_DL
```
Similar a CER pero con tipo de cambio.

---

## Que calcular para cada instrumento — Resumen

| Instrumento | TNA | TIR | Paridad | Metodo TIR | Coeficiente | BCRA |
|---|---|---|---|---|---|---|
| LECAP | Si | Si | Si | Formula directa | — | — |
| BONCAP | Si | Si | Si | Formula directa | — | — |
| LECER | — | Si (real) | Si | Directa + CER | CER | Serie 30 |
| BONCER | — | Si (real) | Si | Newton-Raphson + CER | CER | Serie 30 |
| BOTE | Si | Si | Si | Newton-Raphson | — | — |
| LELINK | Si (ARS) | Si (ARS) | Si | Directa + TC | TC Oficial | Serie 4 |
| LETAM | — | Estimada | Si | Directa + TAMAR proy | TAMAR | Serie 44 |
| BONTAM | — | Estimada | Si | N-R + TAMAR proy | TAMAR | Serie 44 |

---

## Arquitectura del proyecto

```
uala-abc-data/
├── CLAUDE.md              ← Contexto para IA
├── FUNCIONAL.md           ← Este documento
├── CHANGELOG.md           ← Bitacora de cambios
├── .impeccable.md         ← Design context
├── package.json           ← Zero dependencias
│
├── public/
│   └── index.html         ← Landing interactiva (BCRA live)
│
├── src/
│   ├── calculators/       ← Funciones puras (sin I/O)
│   │   ├── tir.js         ← tirDirecta() + tirNewtonRaphson() + precioDesdeYTM()
│   │   ├── tna.js         ← tnaLetra() + tnaDesdeVCP() + tnaDeseTIR()
│   │   ├── paridad.js     ← valorResidual() + valorTecnico() + paridad()
│   │   ├── duration.js    ← macaulayDuration() + modifiedDuration()
│   │   └── settlement.js  ← getSettlementDate() + diasEntre()
│   │
│   ├── coefficients/      ← Consumo de APIs BCRA
│   │   ├── cer.js         ← getCERActual() + getCERT10() + coeficienteCER()
│   │   ├── tamar.js       ← getSerieTAMAR() + acumularTAMAR() + proyectarTAMAR()
│   │   └── tc-oficial.js  ← getTCOficial() + coeficienteDL()
│   │
│   ├── market/            ← Interfaz a datos de mercado
│   │   ├── types.js       ← JSDoc de todos los tipos de datos
│   │   └── mock-prices.js ← Precios mock (OMS en prod)
│   │
│   └── examples/          ← Ejecutables: node src/examples/lecap.js
│       ├── lecap.js
│       ├── boncer.js
│       ├── bote.js
│       ├── lelink.js
│       ├── letam.js
│       └── bontam.js
│
├── data/
│   └── instrumentos.json  ← Condiciones de emision (fijo)
│
├── test/
│   ├── tir.test.js
│   ├── tna.test.js
│   └── paridad.test.js
│
└── .agents/skills/
    └── ui-ux/SKILL.md     ← Skill de UI/UX para la landing
```

### Separacion de responsabilidades

| Capa | Que hace | I/O? | Donde |
|---|---|---|---|
| **Calculators** | Funciones puras de matematica | No | src/calculators/ |
| **Coefficients** | Fetch a BCRA, devuelve dato limpio | Si (fetch) | src/coefficients/ |
| **Market** | Interfaz al OMS (mock en dev) | Si (OMS) | src/market/ |
| **Data** | Condiciones de emision (inmutables) | No | data/ |
| **Landing** | UI interactiva con BCRA live | Si (fetch) | public/ |
| **Examples** | Demos ejecutables por consola | Si (requiere Node) | src/examples/ |

---

## Flujo de datos en produccion

```
                ┌─────────┐
                │   OMS   │ precio, bid, ask, volumen
                └────┬────┘
                     │
                ┌────▼────┐
                │  BCRA   │ CER (30), TAMAR (44), TC (4)
                └────┬────┘
                     │
┌──────────┐    ┌────▼────────────┐    ┌──────────────┐
│ CNV/MEcon│───▶│  CALCULATORS    │───▶│  Resultados   │
│ (flujos) │    │  TIR, TNA,      │    │  por pantalla │
└──────────┘    │  Paridad, Dur   │    └──────────────┘
                └─────────────────┘
```

Los precios de mercado son el unico dato que HOY esta mockeado.
En produccion se reemplaza `mock-prices.js` por el cliente del OMS.

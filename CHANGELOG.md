# Bitacora de cambios — uala-abc-data

## 2026-03-25 (noche 2) — Mobile-first responsive

### Responsive design
- Breakpoint 768px: layout mobile completo
- Breakpoint 420px: ajustes para pantallas chicas (iPhone SE, etc)
- Origin strips apilan vertical en mobile
- Calculator inputs full-width, font 16px (previene zoom en iOS)
- Results grid 2x2 en mobile (era auto-fit)
- Steps hacen wrap: formula arriba, resultado abajo (no se superponen)
- Tablas (comparison, flow) con overflow-x scroll horizontal
- Formulas y codigo legibles a 12-13px
- Cards, notas, badges con padding/font reducido
- Hero compacto (24px titulo en 768px, 20px en 420px)

---

## 2026-03-25 (noche) — Inventario OMS, soberanos ARS, rastreo series BCRA

### Inventario OMS
- Parseado CSV del OMS: 306 tickers totales, 91 de renta fija, 215 CEDEARs/acciones
- Guardado en `data/tickers-oms.json` clasificado por tipo
- Cada seccion de la landing muestra cantidad de tickers listados en OMS

### Inventario por tipo
| Tipo | Qty OMS | Status landing |
|---|---|---|
| LECAP | 40 | ● listados, ejemplo S17A6 |
| BONCAP | 17 | ● listados, ejemplo T30J6 |
| BONCER | 11 | ● listados, ejemplo TX26 |
| BOTE | 4 | ● listados, ejemplo TTS26 |
| LETAM | 4 | ● listados, ejemplo M31G6 |
| BONAR | 5 | ● listados, ejemplo AL30 (nuevo) |
| GLOBAL | 6 | ● listados (nuevo) |
| LECER | 0 | ○ preparado, ejemplo X15Y6 |
| LELINK | 0 | ○ preparado, ejemplo D30A6 |
| BONTAM | 0 | ○ preparado, ejemplo TMF27 |

### Soberanos ARS (nuevo)
- Agregada seccion BONAR/GLOBAL operados en ARS
- Ejemplo con AL30: precio live de data912 (en miles ARS, /1000)
- Flujos en USD del prospecto, Newton-Raphson para TIR
- 11 tickers en OMS: AL29, AL30, AL35, AL41, AE38, GD29, GD30, GD35, GD38, GD41, GD46

### Rastreo de series BCRA (documentado en FUNCIONAL.md)
- Documentado el proceso completo de como se identificaron las series
- Serie 27 (TAMAR en repos open-source) → verificada VACIA el 2026-03-25
- Catalogo completo consultado via GET /Monetarias (sin params)
- 5 series TAMAR encontradas: 44, 45, 135, 136, 137
- Elegida serie 44 (privados TNA) — pendiente confirmar con operaciones si usar 44 o 135
- Proceso documentado paso a paso para reproducibilidad

### Notas negocio simplificadas
- Todas las "nota negocio" reescritas para validar SOLO formulas y calculos
- Eliminadas preguntas operacionales/de proceso
- Settlement T+1 declarado como constante global

---

## 2026-03-25 (tarde) — Datos reales + precios live data912

### Precios de mercado en vivo
- Conectada fuente de precios **data912.com** (`/live/arg_bonds` + `/live/arg_notes`)
- Fetch en paralelo con BCRA al cargar la landing
- Banner actualizado muestra cantidad de precios cargados
- **NOTA**: En produccion los precios vienen del OMS. data912 es para la demo educativa.

### Instrumentos reales con datos de prospectos verificados
Reemplazados todos los instrumentos de ejemplo por datos reales:

| Tipo | Ticker | Nombre | Fuente prospecto |
|---|---|---|---|
| LECAP | S17A6 | LECAP Abril 2026, pago_final=110.125 | rendimientos-ar / licitacion |
| LECAP | S30A6 | LECAP Abril 30, pago_final=127.486 | rendimientos-ar |
| LECAP | S29Y6 | LECAP Mayo, pago_final=132.044 | rendimientos-ar |
| LECAP | S30N6 | LECAP Nov, pago_final=129.888 | rendimientos-ar |
| BONCAP | T30J6 | BONCAP Jun 2026, pago_final=144.896 | rendimientos-ar |
| BONCAP | T15E7 | BONCAP Ene 2027, pago_final=161.104 | rendimientos-ar |
| LECER | X15Y6 | LECER Mayo, cer_emision=701.614 | rendimientos-ar |
| LECER | X29Y6 | LECER Mayo 29, cer_emision=651.8981 | rendimientos-ar |
| LECER | X30N6 | LECER Nov, cer_emision=659.6789 | rendimientos-ar |
| LETAM | M31G6 | LETAM Ago 2026 | data912 (unica LETAM con liquidez) |
| LELINK | D30A6 | DL Abril 2026, tc_emision=1197.50 | data912 / licitacion |
| BONCER | TX26 | BONCER 2% Nov 2026, cer_emision=22.544, 12 flujos | rendimientos-ar (completo) |
| BONCER | TZX26 | LECER zero coupon Jun 2026, cer_emision=200.388 | rendimientos-ar |
| BONTAM | TMF27 | BONTAM Feb 2027, spread=0%, 4 flujos | data912 / estimado |
| BOTE | TTS26 | BOTE Sep 2026, cupon 17%, 4 flujos | estimado de licitacion |
| BOTE | TTJ26 | BOTE Jun 2026, cupon 17%, 4 flujos | estimado de licitacion |

### Correccion de series BCRA
- Serie 27 NO es TAMAR (devuelve vacio). Corregida a **serie 44** (privados TNA)
- Verificado: serie 44 devuelve 26.75% TNA al 2026-03-20
- Estructura respuesta BCRA: `results[0].detalle[]` en orden DESC

### Precios verificados en data912 (2026-03-25)
```
S17A6   108.479   LECAP
TTS26   150.700   BOTE
TX26    1299.000  BONCER (por 1 VN, /10 para normalizar)
D30A6   137220    LELINK (en miles)
M31G6   116.430   LETAM
TMF27   106.200   BONTAM
T30J6   135.150   BONCAP
```

---

## 2026-03-25 — Setup inicial + BCRA live

### Estructura del proyecto
- Creado proyecto desde cero con estructura modular: calculators, coefficients, market, examples
- Zero dependencias externas. Todo Node.js nativo + vanilla HTML/JS
- Basado en analisis del repo rendimientos-ar (buenas practicas de vibe coding)

### Calculators (funciones puras)
- `tir.js` — tirDirecta() para LECAP/BONCAP + tirNewtonRaphson() para bonos con flujos + precioDesdeYTM() inverso
- `tna.js` — tnaLetra() para letras + tnaDesdeVCP() para FCIs + tnaDeseTIR() conversion
- `paridad.js` — valorResidual(), vrPorFlujo(), valorTecnicoLetra(), valorTecnicoBono(), paridad()
- `duration.js` — macaulayDuration() + modifiedDuration()
- `settlement.js` — getSettlementDate() T+1 habiles con feriados argentinos 2025-2026

### Coeficientes BCRA
- `cer.js` — getCERActual() serie 30, getCERT10(), coeficienteCER()
- `tamar.js` — getSerieTAMAR() serie 44, acumularTAMAR(), proyectarTAMAR()
- `tc-oficial.js` — getTCOficial() serie 4, coeficienteDL()

### Correccion critica: Series BCRA
- **TAMAR no es serie 27** (devuelve vacio). Corregido a **serie 44** (privados TNA) y **135** (todos TNA)
- Verificado con fetch real a la API: serie 27 → detalle vacio, serie 44 → 26.75% TNA
- Corregida estructura de respuesta BCRA: `results[0].detalle[]` (no `results[]` directo)
- Corregido orden: detalle viene DESC (mas reciente primero), no ASC
- Actualizado valor CER de referencia: ~731 (no ~23 como decia el repo rendimientos-ar, que usaba otra base)

### Datos de mercado
- `types.js` — Contratos JSDoc con tabla de origen de cada dato (OMS vs BCRA vs CNV)
- `mock-prices.js` — Precios de ejemplo para todos los instrumentos (reemplazar por OMS en prod)
- `instrumentos.json` — Condiciones de emision: LECAP, BONCAP, LECER, LETAM, LELINK, BONCER, BONTAM, BOTE

### Ejemplos ejecutables
- 6 ejemplos: lecap.js, boncer.js, bote.js, lelink.js, letam.js, bontam.js
- Cada uno ejecutable standalone: `node src/examples/lecap.js`
- Incluyen paso a paso comentado con origen de cada dato

### Tests
- tir.test.js — 9 tests (directa + Newton-Raphson + inverso)
- tna.test.js — 7 tests (letra + VCP + conversion)
- paridad.test.js — 9 tests (VR + paridad + valor tecnico)
- Usando `node:test` nativo (sin framework)

### Landing interactiva (public/index.html)
- 6 secciones: LECAP, BONCER, BOTE, LELINK, LETAM, BONTAM
- Orden progresivo de complejidad (simple → complejo)
- Cada seccion: formula renderizada + origen de datos (badges OMS/BCRA/CNV) + inputs editables + paso a paso + resultados en vivo + codigo copiable
- Dark/light mode con toggle persistente
- Nav sticky con scroll horizontal en mobile
- Tabla resumen final: que calcular para cada instrumento + fuentes de datos
- **Conectada a BCRA en vivo**: CER (serie 30), TAMAR (serie 44), TC (serie 4)
- Banner verde al tope muestra datos BCRA live con fecha
- Responsive (375px+)

### Skill UI/UX
- `.impeccable.md` — Design context: dark-first, Inter + JetBrains Mono, tokens
- `.agents/skills/ui-ux/SKILL.md` — Patron de seccion, colores semanticos por origen, checklist

### Documentacion
- `CLAUDE.md` — Contexto para IA con prompts recurrentes
- `FUNCIONAL.md` — Documento funcional: instrumentos, datos, APIs, formulas, arquitectura
- `CHANGELOG.md` — Esta bitacora

---

## Pendientes identificados

- [ ] Conectar OMS real (reemplazar mock-prices.js)
- [ ] Agregar instrumentos reales con datos de prospectos actuales
- [ ] TAMAR: implementar acumulacion historica real (hoy se proyecta constante)
- [ ] Agregar mas tests (coeficientes, settlement, edge cases)
- [ ] Agregar soberanos USD y ONs al scope (estan en rendimientos-ar)
- [ ] PWA manifest + service worker para uso offline

# Audit — QA completo de la landing

Revision sistematica de calidad antes de compartir o deployar.

## Cuando usar
- Antes de cada deploy a produccion
- Despues de cambios grandes en la landing
- Antes de presentar a negocio o al equipo
- Periodicamente (1 vez por semana)

## Checklist de auditoria

### 1. Formulas visibles
- [ ] Cada seccion tiene formula teorica (notacion matematica)
- [ ] Cada seccion tiene formula en Python
- [ ] Cada seccion tiene formula en JS (code block copiable)
- [ ] Las tres versiones son consistentes entre si
- [ ] No hay formulas cortadas o con overflow

### 2. Calculos interactivos
- [ ] Todos los inputs recalculan al cambiar
- [ ] No hay NaN, Infinity, o undefined en resultados
- [ ] Paso a paso muestra valores intermedios correctos
- [ ] Resultados tienen color semantico (verde=positivo, rojo=negativo, ambar=estimado)

### 3. Datos de origen
- [ ] Cada variable tiene badge de origen (OMS/BCRA/CNV/CALC)
- [ ] Los colores de badge son consistentes en toda la landing
- [ ] Los valores de BCRA se cargan live (verificar banner verde)
- [ ] Los precios de data912 se cargan live

### 4. APIs
- [ ] BCRA serie 30 (CER) responde
- [ ] BCRA serie 44 (TAMAR) responde
- [ ] BCRA serie 4 (TC) responde
- [ ] data912 arg_bonds responde
- [ ] data912 arg_notes responde
- [ ] Banner muestra datos live con fecha

### 5. Inventario OMS
- [ ] Cada seccion muestra cantidad de tickers (verde = listados, ambar = preparado)
- [ ] Los numeros coinciden con data/tickers-oms.json
- [ ] Los tickers de ejemplo existen en el inventario o estan marcados como ejemplo

### 6. Notas
- [ ] Nota Dev presente en cada seccion
- [ ] Nota Negocio presente en cada seccion (solo formulas/calculos)
- [ ] No hay preguntas operacionales en notas negocio (solo validacion de formulas)

### 7. Visual
- [ ] Dark mode: contraste suficiente, texto legible
- [ ] Light mode: contraste suficiente, fondos no se pierden
- [ ] Mobile 375px: todo legible, inputs usables, tablas con scroll
- [ ] Mobile 768px: layout correcto, cards no se cortan
- [ ] Desktop: max-width respetado, formulas no overflow

### 8. Codigo
- [ ] No hay console.log en produccion (excepto el log de BCRA Live)
- [ ] Boton "Copiar" funciona en todos los code blocks
- [ ] No hay variables undefined en los calculadores
- [ ] Settlement T+1 es constante (no hardcodeado en cada seccion)

## Severidades
- **CRITICO**: formula incorrecta, calculo da resultado erroneo, API rota
- **ALTO**: dato no se muestra, input no funciona, layout roto
- **MEDIO**: inconsistencia visual, badge faltante, nota incompleta
- **BAJO**: typo, spacing inconsistente, mejora estetica

## Output
Tabla con:
| # | Severidad | Categoria | Hallazgo | Ubicacion | Accion |

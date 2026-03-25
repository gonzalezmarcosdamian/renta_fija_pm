# UI/UX Skill — uala-abc-data

Skill para disenar y mantener la experiencia visual educativa de la landing de renta fija.

## Cuando usar
- Al crear o modificar secciones de la landing (public/index.html)
- Al agregar un nuevo tipo de instrumento a la visualizacion
- Al mejorar la experiencia interactiva de los calculadores
- Antes de compartir la landing con el equipo

## Contexto obligatorio
Leer `.impeccable.md` antes de cualquier cambio visual. El design context define:
- Usuarios: devs, no financieros
- Tono: didactico, preciso
- Tema: dark-first
- Tokens: colores, radios, spacing

## Principios de la landing

### 1. Cada seccion sigue este patron
```
┌─────────────────────────────────────────┐
│ Nombre del instrumento + badge de tipo  │
│ Descripcion en 1 linea                  │
├─────────────────────────────────────────┤
│ FORMULA (renderizada, no imagen)        │
│ Con cada variable explicada             │
├─────────────────────────────────────────┤
│ ORIGEN DE DATOS                         │
│ ┌─────────┐ ┌──────────┐ ┌──────────┐  │
│ │ OMS     │ │ BCRA     │ │ CNV      │  │
│ │ precio  │ │ CER/TAMAR│ │ flujos   │  │
│ └─────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────┤
│ EJEMPLO INTERACTIVO                     │
│ Inputs editables → resultado en vivo    │
│ Paso a paso visible                     │
├─────────────────────────────────────────┤
│ CODIGO (copyable)                       │
│ La funcion JS que hace el calculo       │
└─────────────────────────────────────────┘
```

### 2. Colores semanticos para origen de datos
- **Indigo** (#6366f1): Dato de mercado (OMS)
- **Esmeralda** (#10b981): Coeficiente (BCRA)
- **Ambar** (#f59e0b): Dato estatico (CNV/emision)
- **Gris**: Dato calculado (nosotros)

### 3. Interactividad
- Los inputs de ejemplo deben ser editables
- Al cambiar un input, el resultado se recalcula en vivo
- Mostrar paso a paso intermedio (no solo resultado final)
- Highlight visual en los numeros que cambian

### 4. Progresion de complejidad
Orden de secciones en la landing:
1. LECAP (formula directa, sin coeficiente)
2. BONCAP (igual que LECAP pero plazo mas largo)
3. BOTE (Newton-Raphson, flujos fijos)
4. LECER / BONCER (CER, flujos ajustados)
5. LELINK (Dolar Linked, TC oficial)
6. LETAM / BONTAM (TAMAR, el mas complejo)

### 5. Responsive
- Mobile: secciones full-width, nav colapsable
- Desktop: sidebar sticky con links a cada seccion
- Tablas: horizontal scroll en mobile, nunca truncar datos

## Checklist antes de compartir
- [ ] Todas las formulas se ven correctas (no cortadas)
- [ ] Todos los ejemplos calculan bien (comparar con test/)
- [ ] Dark mode se ve bien (contraste suficiente)
- [ ] Light mode se ve bien
- [ ] Los badges de origen (OMS/BCRA/CNV) son consistentes
- [ ] El codigo es copyable (boton de copiar funciona)
- [ ] Mobile se ve bien (probar 375px)
- [ ] No hay console.log en produccion

## NUNCA
- Usar imagenes para formulas (usar HTML/CSS)
- Hardcodear resultados (siempre calcular en vivo)
- Mezclar estilos inline con CSS (todo en el style tag o archivo)
- Usar librerias de UI (todo vanilla)
- Olvidar el badge de origen en cada variable

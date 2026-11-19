# Trivia Católica — Línea gráfica "Lienzo"

> **Para el asistente que programe la app:** este documento es la fuente de verdad del diseño. Toda pantalla, componente y estado debe usar exclusivamente los tokens definidos acá. No inventes colores, tipografías, sombras ni íconos nuevos. Si algo no está contemplado, resolvelo combinando lo que existe y respetando los principios de la sección 1.
>
> Referencia visual obligatoria: **`boceto-inicio.html`** (en esta misma carpeta). Es la pantalla de inicio aprobada; reproducila fielmente y usala como patrón para el resto de las pantallas.

---

## 1. Principios

1. **Minimalista y sereno.** Fondo blanco, mucho aire, bordes finos, cero sombras, cero degradados.
2. **Legible para personas mayores.** Texto grande, alto contraste (todo par texto/fondo cumple WCAG AA ≥ 4.5:1), botones amplios.
3. **Amigable para jóvenes.** La calidez viene de las esquinas redondeadas, la tipografía, los íconos duotono y el color por categoría, no de adornos.
4. **El color siempre significa algo.** Azul = acción principal / navegación. Cada categoría tiene su color. Ámbar = logros. Verde/rojo = correcto/incorrecto. Nunca usar color como decoración.
5. **Nunca solo color.** Todo estado (correcto, incorrecto, seleccionado) se comunica con color **+ ícono + texto**.

---

## 2. Paleta

### 2.1 Base

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#FFFFFF` | Fondo de pantallas y tarjetas |
| `bg-app` | `#F2F3F6` | Fondo exterior (solo web/escritorio, detrás del contenedor) |
| `ink` | `#14161C` | Títulos y texto principal |
| `ink-2` | `#5B6170` | Texto secundario, contadores, etiquetas de navegación inactivas |
| `line` | `#E6E8EE` | Bordes de tarjetas y botones, divisores |
| `track` | `#EEF0F4` | Fondo de barras de progreso |

### 2.2 Acento principal (azul mariano)

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#2F5BD3` | Bloque "Desafío del día", botón principal, pestaña activa, links, respuesta seleccionada |
| `primary-ink` | `#1E3F9E` | Texto sobre `primary-soft` o sobre blanco dentro de bloques azules |
| `primary-soft` | `#EEF2FD` | Fondo de respuesta seleccionada |
| `on-primary` | `#FFFFFF` | Texto sobre `primary` |
| `on-primary-2` | `#DCE4FA` | Texto secundario sobre `primary` (mín. 14 px) |

### 2.3 Logros (ámbar)

| Token | Hex | Uso |
|---|---|---|
| `gold` | `#E8A33D` | Íconos de racha, estrellas, medallas (solo íconos, nunca texto) |
| `gold-ink` | `#8A5A0B` | Texto de logros |
| `gold-soft` | `#FDF3E1` | Fondo de chips de racha/puntos |

### 2.4 Categorías

Cada categoría usa su color en: ícono, fondo del ícono (`-soft`), barra de progreso y etiqueta de categoría dentro de las preguntas.

| Categoría | Token | Color | Soft | Ícono Phosphor |
|---|---|---|---|---|
| Antiguo Testamento | `cat-at` | `#A94C25` | `#FBEFE6` | `scroll` |
| Nuevo Testamento | `cat-nt` | `#2F5BD3` | `#EEF2FD` | `book-open-text` |
| Santos | `cat-sa` | `#A83E5A` | `#FBECEF` | `hands-praying` |
| Sacramentos | `cat-sc` | `#2B754D` | `#E7F4EC` | `drop` |
| Liturgia | `cat-li` | `#6A52C2` | `#F1EEFB` | `church` |

Si se agregan categorías nuevas, crear el color con el mismo criterio: tono apagado/medio, contraste ≥ 4.5:1 sobre su `-soft` y sobre blanco, y que no se confunda con los existentes.

### 2.5 Estados de respuesta

| Estado | Fondo | Borde | Texto | Ícono |
|---|---|---|---|---|
| Normal | `#FFFFFF` | 1.5 px `line` | `ink` | — |
| Seleccionada (antes de confirmar) | `primary-soft` | 2 px `primary` | `primary-ink` | — |
| Correcta | `#E7F4EC` | 2 px `#2B754D` | `#1E5A3A` | `check-circle` |
| Incorrecta | `#FDECEA` | 2 px `#B42318` | `#B42318` | `x-circle` |
| Correcta no elegida (se revela) | `#FFFFFF` | 2 px `#2B754D` | `ink` | `check-circle` |
| Deshabilitada (tras responder) | `#FFFFFF` | 1.5 px `line` | `ink-2` | — |

Tokens: `success #2B754D`, `success-soft #E7F4EC`, `danger #B42318`, `danger-soft #FDECEA`.

### 2.6 Banner de novedades (tipos)

| Tipo | Color (`--b`) | Fondo (`--b-soft`) | Ícono sugerido |
|---|---|---|---|
| Oración | `cat-li` `#6A52C2` | `#F1EEFB` | `hands-praying` |
| Iniciativa | `cat-sc` `#2B754D` | `#E7F4EC` | `hand-heart` |
| Novedad | `gold-ink` `#8A5A0B` | `#FDF3E1` | `megaphone` |

---

## 3. Tipografía

**Familia única: Source Sans 3** (Google Fonts). Pesos permitidos: **400, 600, 700**. Nada de itálicas ni otras familias.

- Web: `https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap`
- Expo / React Native: `@expo-google-fonts/source-sans-3` (`SourceSans3_400Regular`, `SourceSans3_600SemiBold`, `SourceSans3_700Bold`)

| Estilo | Tamaño | Peso | Interlineado | Uso |
|---|---|---|---|---|
| `display` | 28 px | 700 | 1.15 | Saludo principal ("¿Jugamos hoy?") |
| `question` | 22 px | 600 | 1.3 | Enunciado de la pregunta |
| `title` | 22 px | 600 | 1.25 | Nombre del desafío del día |
| `section` | 20 px | 600 | 1.3 | Títulos de sección ("Categorías") |
| `answer` | 18 px | 600 | 1.3 | Texto de las opciones de respuesta |
| `button` | 18 px | 700 | 1 | Botones principales |
| `item` | 17 px | 600 | 1.3 | Nombre de categoría, título de banner |
| `body` | 16 px | 400 | 1.45 | Texto general |
| `small` | 15 px | 400/600 | 1.35 | Texto de banner, links, chips |
| `caption` | 14 px | 400 | 1.3 | Contadores, etiquetas ("Pregunta 4 de 10") |
| `nav` | 13 px | 400 / 700 activo | 1.2 | Etiquetas de barra inferior |

**Reglas:** nada por debajo de 13 px (y 13 px solo en la barra de navegación). Respetar la escala de texto del sistema operativo (accesibilidad), el layout tiene que aguantar hasta 130 %. Sentence case siempre, nunca TODO MAYÚSCULAS.

---

## 4. Íconos

**Biblioteca: Phosphor Icons** (https://phosphoricons.com), gratuita (MIT).

- Estilo **duotone** para íconos con significado (categorías, banner, racha, desafío, pestaña activa).
- Estilo **regular** para íconos de interfaz neutros (flechas, pestañas inactivas, cerrar).
- El ícono hereda el color del contexto (`currentColor`): el duotono genera solo la capa clara.
- Web: `@phosphor-icons/web` · React: `@phosphor-icons/react` · React Native: `phosphor-react-native`.
- Tamaños: 26 px en categorías, barra inferior y desafío; 20–24 px en chips/inline.
- **No mezclar con otras bibliotecas** (nada de Lucide, Material, Font Awesome, emojis).

---

## 5. Espaciado, radios y bordes

- Escala de espaciado (px): **4 · 8 · 12 · 14 · 16 · 20 · 24 · 32**.
- Margen lateral de pantalla: **20 px**.
- Separación entre tarjetas de lista: **8 px**. Entre secciones: **24–26 px**.
- Radios: chips `999` (píldora) · iconos contenedores `14` · tarjetas y respuestas `16` · bloques destacados (desafío, banner) `18–20` · contenedor de pantalla (solo boceto) `32`.
- Bordes: **1.5 px `line`** en tarjetas y respuestas; **2 px** de color en estados activos.
- **Sin sombras, sin degradados, sin blur, sin transparencias decorativas.**
- Área táctil mínima: **48 × 48 px**. Botones principales: alto mínimo **50 px**, ancho completo.

---

## 6. Componentes

### 6.1 Encabezado de inicio
Saludo pequeño (`body`, `ink-2`) + título `display`. A la derecha, chip de racha (`gold-soft`, texto `gold-ink` 700, ícono `flame` duotono en `gold`).

### 6.2 Banner de novedades (siempre visible, arriba del desafío)
- Contenedor tocable entero, fondo `--b-soft`, radio 18, padding 14/16, **sin borde**.
- Izquierda: cuadro blanco 48 × 48 radio 14 con ícono duotono 28 px en `--b`. **Variante con imagen**: la imagen reemplaza ese cuadro (mismo tamaño o miniatura 64 × 64, radio 14, `object-fit: cover`) — el resto del banner no cambia.
- Centro: etiqueta de tipo (13 px 700 en `--b`) → título (17 px 700 `ink`, máx. 2 líneas) → texto (15 px `ink-2`, máx. 2 líneas).
- Derecha: `caret-right` regular 22 px en `--b`.
- Si hay más de un banner: carrusel horizontal con indicador de puntos debajo (punto activo 18 × 6 en el color del banner activo, inactivos 6 × 6 `line`). Rotación automática lenta (≥ 6 s) que se pausa al tocar.
- Contenido administrable desde el backend: `tipo`, `titulo`, `texto`, `imagen?`, `link`, `vigencia_desde`, `vigencia_hasta`, `orden`.

### 6.3 Desafío del día
Bloque `primary`, radio 20, padding 18. Etiqueta `on-primary-2` 14 px, ícono `sparkle` duotono en `#FFD27A`, título `title` blanco, botón "Comenzar" blanco con texto `primary-ink` 18 px 700, radio 14, ancho completo. **Es el único bloque de color sólido de la pantalla de inicio.**

### 6.4 Tarjeta de categoría
Fila con borde 1.5 px `line`, radio 16, padding 12/14. Ícono 46 × 46 radio 14 en `cat-*-soft` con ícono duotono 26 px en `cat-*`. Nombre `item`, barra de progreso de 6 px (`track` + `cat-*`), contador `caption` a la derecha. Si no hay progreso: texto "Nuevo" en 14 px 700 color de la categoría.

### 6.5 Pantalla de pregunta
- Arriba: botón cerrar (regular) + barra de progreso del desafío en el color de la categoría + "Pregunta 4 de 10" (`caption`).
- Etiqueta de categoría: chip `cat-*-soft` con texto en `cat-*`.
- Enunciado `question`. Si hay cita bíblica, debajo en `body` `ink-2` (ej.: "Gn 6,14").
- 3 o 4 respuestas apiladas a ancho completo, alto mín. 56 px, radio 16, separación 10 px, estados según sección 2.5.
- Tras responder: feedback inmediato con color + ícono + texto ("¡Correcto!" / "La respuesta era: Noé") y botón principal "Siguiente".
- Temporizador (si se usa): barra fina o número en `ink-2`; últimos 5 s en `danger`. Debe poder desactivarse en ajustes (pensando en personas mayores).

### 6.6 Barra de navegación inferior
Fondo blanco, borde superior 1 px `line`. 3 pestañas: Inicio (`house`), Ranking (`trophy`), Perfil (`user-circle`). Activa: ícono duotono + texto 700 en `primary`. Inactiva: ícono regular + texto 400 en `ink-2`.

---

## 7. Tokens en código

### CSS
```css
:root {
  --bg: #FFFFFF; --bg-app: #F2F3F6;
  --ink: #14161C; --ink-2: #5B6170;
  --line: #E6E8EE; --track: #EEF0F4;

  --primary: #2F5BD3; --primary-ink: #1E3F9E; --primary-soft: #EEF2FD;
  --on-primary: #FFFFFF; --on-primary-2: #DCE4FA;

  --gold: #E8A33D; --gold-ink: #8A5A0B; --gold-soft: #FDF3E1;

  --success: #2B754D; --success-ink: #1E5A3A; --success-soft: #E7F4EC;
  --danger: #B42318; --danger-soft: #FDECEA;

  --cat-at: #A94C25; --cat-at-soft: #FBEFE6;
  --cat-nt: #2F5BD3; --cat-nt-soft: #EEF2FD;
  --cat-sa: #A83E5A; --cat-sa-soft: #FBECEF;
  --cat-sc: #2B754D; --cat-sc-soft: #E7F4EC;
  --cat-li: #6A52C2; --cat-li-soft: #F1EEFB;

  --font: 'Source Sans 3', system-ui, sans-serif;
  --r-chip: 999px; --r-icon: 14px; --r-card: 16px; --r-block: 20px;
  --border: 1.5px solid var(--line);
}
```

### JSON / TypeScript
```json
{
  "color": {
    "bg": "#FFFFFF", "bgApp": "#F2F3F6",
    "ink": "#14161C", "ink2": "#5B6170",
    "line": "#E6E8EE", "track": "#EEF0F4",
    "primary": "#2F5BD3", "primaryInk": "#1E3F9E", "primarySoft": "#EEF2FD",
    "onPrimary": "#FFFFFF", "onPrimary2": "#DCE4FA",
    "gold": "#E8A33D", "goldInk": "#8A5A0B", "goldSoft": "#FDF3E1",
    "success": "#2B754D", "successInk": "#1E5A3A", "successSoft": "#E7F4EC",
    "danger": "#B42318", "dangerSoft": "#FDECEA"
  },
  "category": {
    "antiguoTestamento": { "color": "#A94C25", "soft": "#FBEFE6", "icon": "scroll" },
    "nuevoTestamento":   { "color": "#2F5BD3", "soft": "#EEF2FD", "icon": "book-open-text" },
    "santos":            { "color": "#A83E5A", "soft": "#FBECEF", "icon": "hands-praying" },
    "sacramentos":       { "color": "#2B754D", "soft": "#E7F4EC", "icon": "drop" },
    "liturgia":          { "color": "#6A52C2", "soft": "#F1EEFB", "icon": "church" }
  },
  "banner": {
    "oracion":    { "color": "#6A52C2", "soft": "#F1EEFB", "icon": "hands-praying" },
    "iniciativa": { "color": "#2B754D", "soft": "#E7F4EC", "icon": "hand-heart" },
    "novedad":    { "color": "#8A5A0B", "soft": "#FDF3E1", "icon": "megaphone" }
  },
  "font": { "family": "Source Sans 3", "weights": [400, 600, 700] },
  "fontSize": { "display": 28, "question": 22, "title": 22, "section": 20, "answer": 18, "button": 18, "item": 17, "body": 16, "small": 15, "caption": 14, "nav": 13 },
  "radius": { "chip": 999, "icon": 14, "card": 16, "block": 20 },
  "space": [4, 8, 12, 14, 16, 20, 24, 32],
  "touchMin": 48
}
```

---

## 8. Lo que NO hay que hacer

- ❌ Sombras, degradados, glassmorphism, neón, fondos oscuros o de color en pantallas completas.
- ❌ Otras tipografías, itálicas o pesos fuera de 400/600/700.
- ❌ Íconos de otras bibliotecas o emojis en la interfaz.
- ❌ Texto gris claro sobre blanco, o texto menor a 13 px.
- ❌ Más de un bloque de color sólido por pantalla (el sólido es para la acción principal).
- ❌ Comunicar correcto/incorrecto solo con color.
- ❌ Animaciones bruscas: transiciones suaves de 150–250 ms; respetar "reducir movimiento" del sistema.
- ❌ Modo oscuro por ahora (fuera de alcance de esta versión).

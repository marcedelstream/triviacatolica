/* ==========================================================================
   Trivia Católica · ícono vectorial (libro abierto + cruz + destello)
   Redibujado a partir del PNG original de 1024 px, midiendo cada pieza.
   Uso:  node branding/icono/generar-iconos.mjs
   Genera las variantes SVG en esta misma carpeta.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));

const COLORS = {
  azul: '#2F5BD3',      // primary Lienzo
  blanco: '#FFFFFF',
  oro: '#FFD27A',       // gold-sparkle (sobre azul)
  oroFuerte: '#E8A33D'  // gold (sobre blanco, mejor contraste)
};

/* Eje de simetría: la cruz está centrada en x = 511.5 (grilla 1024) */
const AXIS = 1023;
const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+(AXIS - x).toFixed(1)},${y}`);

/* --- Piezas (lado izquierdo; el derecho se obtiene por espejo) ----------- */
// Página: borde superior curvo que baja hacia el lomo y borde inferior que también cae hacia el lomo
const PAGINA = 'M283,422 Q283,412 293,412 C380,413 462,440 462,490 L462,702 C450,686 395,656 293,649 Q283,648 283,638 Z';
// Tapa: barra vertical exterior + banda inferior curva que llega al lomo
const TAPA = 'M218,462 Q218,451 229,451 L255,451 L255,668 C360,672 440,700 462,746 L462,757 C440,742 395,727 330,725 L240,726 Q218,727 218,705 Z';
// Cruz
const CRUZ_V = { x: 489, y: 259, w: 45, h: 506, r: 12 };
const CRUZ_H = { x: 403, y: 349, w: 218, h: 39, r: 12 };
// Destello de 4 puntas (centro 685,296)
const DESTELLO = 'M685,256 Q690,291 722,296 Q690,301 685,336 Q680,301 648,296 Q680,291 685,256 Z';

function svg({ fondo, tinta, destello, radio = 0, titulo = 'Trivia Católica', borde = null }) {
  const bg = fondo
    ? `  <rect id="fondo" width="1024" height="1024"${radio ? ` rx="${radio}"` : ''} fill="${fondo}"${borde ? ` stroke="${borde}" stroke-width="6"` : ''}/>\n`
    : '';
  const rect = (r, id) => `<rect id="${id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.r}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <title>${titulo}</title>
${bg}  <g id="libro" fill="${tinta}">
    <g id="tapas">
      <path id="tapa-izquierda" d="${TAPA}"/>
      <path id="tapa-derecha" d="${mirror(TAPA)}"/>
    </g>
    <g id="paginas">
      <path id="pagina-izquierda" d="${PAGINA}"/>
      <path id="pagina-derecha" d="${mirror(PAGINA)}"/>
    </g>
  </g>
  <g id="cruz" fill="${tinta}">
    ${rect(CRUZ_V, 'cruz-vertical')}
    ${rect(CRUZ_H, 'cruz-horizontal')}
  </g>
  <path id="destello" fill="${destello}" d="${DESTELLO}"/>
</svg>
`;
}

const VARIANTES = {
  // Ícono de la app (tiendas): cuadrado completo, las tiendas aplican la máscara
  'icono-app.svg': { fondo: COLORS.azul, tinta: COLORS.blanco, destello: COLORS.oro },
  // Para web / redes / documentos: esquinas redondeadas tipo app
  'icono-app-redondeado.svg': { fondo: COLORS.azul, tinta: COLORS.blanco, destello: COLORS.oro, radio: 224 },
  // Versión fondo blanco (cuadrada y redondeada con borde fino Lienzo)
  'icono-fondo-blanco.svg': { fondo: COLORS.blanco, tinta: COLORS.azul, destello: COLORS.oroFuerte },
  'icono-fondo-blanco-redondeado.svg': { fondo: COLORS.blanco, tinta: COLORS.azul, destello: COLORS.oroFuerte, radio: 224, borde: '#E6E8EE' },
  // Solo la marca, sin fondo: azul (para fondos claros) y blanca (para fondos oscuros)
  'marca-azul.svg': { fondo: null, tinta: COLORS.azul, destello: COLORS.oroFuerte },
  'marca-blanca.svg': { fondo: null, tinta: COLORS.blanco, destello: COLORS.oro },
  // Monocromo (sellos, grabados, ícono temático de Android)
  'marca-monocromo.svg': { fondo: null, tinta: '#14161C', destello: '#14161C' }
};

for (const [file, opts] of Object.entries(VARIANTES)) {
  fs.writeFileSync(path.join(DIR, file), svg(opts));
  console.log(`✓ ${file}`);
}

/* ==========================================================================
   Trivia Católica · build de la landing multi idioma
   Uso:  node build.mjs
   Fuente única:  src/body.html (plantilla) + src/styles.css + src/app.js
                  + src/i18n/<idioma>.json (textos)
   Genera:        index.html (es), en/index.html, pt/index.html, it/index.html,
                  sitemap.xml y src/og/og-<idioma>.html (fuente de las imágenes OG)
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://triviacatolica.com';
const LANGS = ['es', 'en', 'pt', 'it'];
const TODAY = new Date().toISOString().slice(0, 10);

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), s);
};
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const styles = read('src/styles.css');
const body = read('src/body.html');
const app = read('src/app.js');
const locales = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(read(`src/i18n/${l}.json`))]));

const urlOf = (l) => SITE + locales[l].meta.path;          // canonical absoluto
const hrefOf = (l) => locales[l].meta.path;                 // link interno
const ogImageOf = (l) => `${SITE}/${l === 'es' ? 'og.jpg' : `og-${l}.jpg`}`;
const alternates = Object.fromEntries(LANGS.map((l) => [l, hrefOf(l)]));

/* Verifica que todos los idiomas tengan las mismas claves que el español */
for (const l of LANGS.slice(1)) {
  for (const section of ['meta', 't', 'js']) {
    const missing = Object.keys(locales.es[section]).filter((k) => !(k in locales[l][section]));
    if (missing.length) throw new Error(`[${l}] faltan claves en ${section}: ${missing.join(', ')}`);
  }
  if (locales[l].categories.length !== locales.es.categories.length) throw new Error(`[${l}] categorías incompletas`);
}

function langMenu(cur) {
  const m = locales[cur].meta;
  const items = LANGS.map((l) => `          <a href="${hrefOf(l)}" hreflang="${l}" lang="${l}" data-lang-choice="${l}"${l === cur ? ' aria-current="true"' : ''}>${locales[l].meta.label}<span>${l.toUpperCase()}</span></a>`).join('\n');
  return `        <details class="lang-menu">
          <summary aria-label="${escHtml(locales[cur].t.lang_label)}: ${escHtml(m.label)}">
            <i class="ph-duotone ph-globe-hemisphere-west" aria-hidden="true"></i>
            <span>${cur.toUpperCase()}</span>
            <i class="ph ph-caret-down caret" aria-hidden="true"></i>
          </summary>
          <div class="lang-menu-list">
${items}
          </div>
        </details>`;
}

function langPills(cur, indent) {
  return LANGS.map((l) => `${indent}<a href="${hrefOf(l)}" hreflang="${l}" lang="${l}" data-lang-choice="${l}"${l === cur ? ' aria-current="true"' : ''}>${locales[l].meta.label}</a>`).join('\n');
}

/* Links del footer a las páginas legales (PT e IT usan la versión en inglés) */
const LEGAL_LINK_LABELS = {
  es: { privacy: 'Privacidad', terms: 'Términos', support: 'Soporte' },
  en: { privacy: 'Privacy', terms: 'Terms', support: 'Support' },
  pt: { privacy: 'Privacidade', terms: 'Termos', support: 'Suporte' },
  it: { privacy: 'Privacy', terms: 'Termini', support: 'Assistenza' }
};
function legalLinks(l) {
  const docs = fs.existsSync(path.join(ROOT, 'src/legal.json')) ? JSON.parse(read('src/legal.json')) : [];
  return docs
    .filter((d) => LEGAL_LINK_LABELS[l][d.id])
    .map((d) => {
      const target = d.paths[l] ? l : 'en';
      return `          <a href="${d.paths[target]}"${target !== l ? ` hreflang="${target}"` : ''}>${LEGAL_LINK_LABELS[l][d.id]}</a>`;
    })
    .join('\n');
}

function head(l) {
  const { meta, t } = locales[l];
  const hreflangs = LANGS.map((x) => `  <link rel="alternate" hreflang="${x}" href="${urlOf(x)}">`).join('\n');
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${SITE}/#org`, name: t.brand, url: `${SITE}/`, logo: `${SITE}/icon-512.png`, email: 'hola@triviacatolica.com' },
      { '@type': 'WebSite', '@id': `${urlOf(l)}#website`, url: urlOf(l), name: t.brand, inLanguage: l, publisher: { '@id': `${SITE}/#org` } },
      {
        '@type': 'MobileApplication',
        name: t.brand,
        operatingSystem: 'iOS, Android',
        applicationCategory: 'GameApplication',
        applicationSubCategory: 'Trivia',
        inLanguage: l,
        description: meta.ldDescription,
        image: ogImageOf(l),
        publisher: { '@id': `${SITE}/#org` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      }
    ]
  };
  const ogAlts = [...meta.ogLocaleAlt, ...LANGS.filter((x) => x !== l).map((x) => locales[x].meta.ogLocale)]
    .map((x) => `  <meta property="og:locale:alternate" content="${x}">`).join('\n');

  return `<!doctype html>
<html lang="${meta.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(meta.title)}</title>
  <meta name="description" content="${escHtml(meta.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#2F5BD3">
  <meta name="application-name" content="${escHtml(t.brand)}">
  <meta name="apple-mobile-web-app-title" content="${escHtml(t.brand)}">
  <link rel="canonical" href="${urlOf(l)}">
${hreflangs}
  <link rel="alternate" hreflang="x-default" href="${urlOf('es')}">

  <!-- Open Graph / Compartir (WhatsApp, Facebook, LinkedIn, Telegram) -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escHtml(t.brand)}">
  <meta property="og:url" content="${urlOf(l)}">
  <meta property="og:title" content="${escHtml(meta.ogTitle)}">
  <meta property="og:description" content="${escHtml(meta.ogDescription)}">
  <meta property="og:image" content="${ogImageOf(l)}">
  <meta property="og:image:secure_url" content="${ogImageOf(l)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escHtml(meta.ogAlt)}">
  <meta property="og:locale" content="${meta.ogLocale}">
${ogAlts}

  <!-- X / Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(meta.ogTitle)}">
  <meta name="twitter:description" content="${escHtml(meta.ogDescription)}">
  <meta name="twitter:image" content="${ogImageOf(l)}">
  <meta name="twitter:image:alt" content="${escHtml(meta.ogAlt)}">

  <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" as="image" href="/jesus-app.jpg" fetchpriority="high">

  <!-- Datos estructurados para Google -->
  <script type="application/ld+json">${jsonForScript(ld)}</script>

  <!-- Tipografía única Lienzo: Source Sans 3 (400, 600, 700, sin itálicas) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">

  <!-- Biblioteca única de íconos Lienzo: Phosphor Icons (duotone + regular) -->
  <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css">
  <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">

  <style>
${styles}  </style>
</head>`;
}

function page(l) {
  const loc = locales[l];
  const vars = {
    ...loc.t,
    lang_menu: null,
    lang_pills: null,
    lang_footer: null
  };
  let html = body.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (key === 'lang_menu') return langMenu(l);
    if (key === 'lang_pills') return langPills(l, '        ');
    if (key === 'lang_footer') return langPills(l, '          ');
    if (key === 'legal_links') return legalLinks(l);
    if (!(key in vars)) throw new Error(`[${l}] clave desconocida en la plantilla: ${key}`);
    return escHtml(vars[key]);
  });
  const tc = { lang: l, alternates, js: loc.js, categories: loc.categories };
  return `${head(l)}
<body>
${html}
  <script>window.TC = ${jsonForScript(tc)};</script>
  <script>
${app}  </script>
</body>
</html>
`;
}

function ogSource(l) {
  const { meta, t } = locales[l];
  const svg = read('src/og/mark.svg').trim();
  return read('src/og/template.html')
    .replace('{{lang}}', l)
    .replace('{{mark}}', svg)
    .replace('{{brand}}', escHtml(t.brand))
    .replace('{{titleA}}', escHtml(meta.ogTitleA))
    .replace('{{titleB}}', escHtml(meta.ogTitleB))
    .replace('{{tagline}}', escHtml(meta.ogTagline))
    .replace('{{chip}}', escHtml(meta.ogChip));
}

for (const l of LANGS) {
  const out = l === 'es' ? 'index.html' : `${l}/index.html`;
  write(out, page(l));
  if (fs.existsSync(path.join(ROOT, 'src/og/template.html'))) write(`src/og/og-${l}.html`, ogSource(l));
  console.log(`✓ ${out}`);
}

/* Páginas legales y de soporte (Play Store / App Store): src/legal/<idioma>/<id>.html */
const legal = fs.existsSync(path.join(ROOT, 'src/legal.json')) ? JSON.parse(read('src/legal.json')) : [];
const legalCss = legal.length ? read('src/legal.css') : '';
const LEGAL_UI = {
  es: { updated: 'Última actualización: 19 de noviembre de 2026', eyebrow: 'Información legal', home: 'Volver al inicio' },
  en: { updated: 'Last updated: November 19, 2026', eyebrow: 'Legal information', home: 'Back to home' }
};
const mark = read('src/og/marca-azul-web.svg').trim().replace('<svg ', '<svg aria-hidden="true" ');

for (const doc of legal) {
  const docLangs = Object.keys(doc.paths);
  for (const l of docLangs) {
    const ui = LEGAL_UI[l];
    const brand = locales[l].t.brand;
    const content = read(`src/legal/${l}/${doc.id}.html`);
    const hreflangs = docLangs.map((x) => `  <link rel="alternate" hreflang="${x}" href="${SITE}${doc.paths[x]}">`).join('\n');
    const langLinks = docLangs.map((x) => `<a href="${doc.paths[x]}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ''}>${x.toUpperCase()}</a>`).join('');
    const footerLinks = legal.filter((d) => d.paths[l]).map((d) => `<a href="${d.paths[l]}"${d.id === doc.id ? ' aria-current="page"' : ''}>${d.titles[l]}</a>`).join('\n        ');
    const html = `<!doctype html>
<html lang="${l}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(doc.titles[l])} · ${escHtml(brand)}</title>
  <meta name="description" content="${escHtml(doc.descriptions[l])}">
  <meta name="theme-color" content="#2F5BD3">
  <link rel="canonical" href="${SITE}${doc.paths[l]}">
${hreflangs}
  <link rel="alternate" hreflang="x-default" href="${SITE}${doc.paths.es}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escHtml(brand)}">
  <meta property="og:title" content="${escHtml(doc.titles[l])} · ${escHtml(brand)}">
  <meta property="og:description" content="${escHtml(doc.descriptions[l])}">
  <meta property="og:url" content="${SITE}${doc.paths[l]}">
  <meta property="og:image" content="${ogImageOf(l)}">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
${legalCss}  </style>
</head>
<body>
  <header class="legal-header">
    <div class="container">
      <a class="legal-brand" href="${hrefOf(l)}" aria-label="${escHtml(ui.home)}">${mark}<span>${escHtml(brand)}</span></a>
      <nav class="legal-langs" aria-label="${escHtml(locales[l].t.lang_label)}">${langLinks}</nav>
    </div>
  </header>
  <main>
    <div class="container">
      <span class="legal-eyebrow">${escHtml(doc.id === 'support' ? brand : ui.eyebrow)}</span>
      <h1>${escHtml(doc.titles[l])}</h1>
      <p class="legal-updated">${escHtml(ui.updated)}</p>
      <article>
${content}
      </article>
    </div>
  </main>
  <footer class="legal-footer">
    <div class="container">
      <nav aria-label="${escHtml(ui.eyebrow)}">
        ${footerLinks}
      </nav>
      <p>${escHtml(locales[l].t.footer_copy)} · <a href="mailto:hola@triviacatolica.com">hola@triviacatolica.com</a></p>
    </div>
  </footer>
</body>
</html>
`;
    write(`${doc.paths[l].slice(1)}.html`, html);
    console.log(`✓ ${doc.paths[l].slice(1)}.html`);
  }
}

/* Sitemap con alternativas de idioma + páginas legales */
const urlEntry = (loc, alts, priority) => `  <url>
    <loc>${loc}</loc>
${alts.map(([hl, href]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${href}"/>`).join('\n')}
    <lastmod>${TODAY}</lastmod>
    <priority>${priority}</priority>
  </url>`;
const homeAlts = [...LANGS.map((l) => [l, urlOf(l)]), ['x-default', urlOf('es')]];
const entries = [
  ...LANGS.map((l) => urlEntry(urlOf(l), homeAlts, '1.0')),
  ...legal.flatMap((doc) => {
    const docLangs = Object.keys(doc.paths);
    const alts = [...docLangs.map((l) => [l, `${SITE}${doc.paths[l]}`]), ['x-default', `${SITE}${doc.paths.es}`]];
    return docLangs.map((l) => urlEntry(`${SITE}${doc.paths[l]}`, alts, '0.3'));
  })
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`);
console.log('✓ sitemap.xml');

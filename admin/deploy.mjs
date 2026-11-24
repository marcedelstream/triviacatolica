// Publica el panel en Vercel (proyecto triviacatolica-admin → app.triviacatolica.com).
// Uso, desde /admin:  npm run deploy
// Compila con las variables de admin/.env.local y sube la carpeta ya compilada (sitio
// estático), así no hace falta cargar variables de entorno en Vercel.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '.deploy');
const run = (cmd, cwd = here) => execSync(cmd, { cwd, stdio: 'inherit' });

run('npm run build');

// Carpeta de publicación: conserva .vercel (vínculo al proyecto) y reemplaza el resto.
fs.mkdirSync(out, { recursive: true });
for (const entry of fs.readdirSync(out)) {
  if (entry !== '.vercel') fs.rmSync(path.join(out, entry), { recursive: true, force: true });
}
fs.cpSync(path.join(here, 'dist'), out, { recursive: true });
fs.copyFileSync(path.join(here, 'vercel.json'), path.join(out, 'vercel.json'));

if (!fs.existsSync(path.join(out, '.vercel'))) {
  // Mismo equipo de Vercel que la landing (triviacatolica.com).
  run('vercel link --yes --project triviacatolica-admin --scope mesolucioness-9077s-projects', out);
}
run('vercel deploy --prod --yes', out);

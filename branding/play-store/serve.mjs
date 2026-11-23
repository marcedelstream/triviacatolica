// Servidor local para el editor de capturas de Play Store.
// Uso: node branding/play-store/serve.mjs  → http://localhost:4180/branding/play-store/capturas.html
// POST /save?name=archivo.png (body = data URL) guarda el PNG en branding/play-store/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/save') {
    const name = path.basename(url.searchParams.get('name') || 'captura.png').replace(/[^\w.-]/g, '_');
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const b64 = body.replace(/^data:image\/\w+;base64,/, '');
      const out = path.join(here, name);
      fs.writeFileSync(out, Buffer.from(b64, 'base64'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, path: out }));
    });
    return;
  }
  let f = path.join(root, decodeURIComponent(url.pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404); return res.end('404');
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(4180, () => console.log('http://localhost:4180/branding/play-store/capturas.html'));

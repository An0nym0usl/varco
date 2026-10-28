// Minimal static server for dist/, mounted under the same base path as production (/varco).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.env.SERVE_ROOT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist'));
const BASE = process.env.VARCO_BASE ?? '/varco';
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

async function resolveFile(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  const full = path.join(ROOT, clean);
  if (!full.startsWith(ROOT)) return null;
  try {
    const s = await stat(full);
    if (s.isDirectory()) return resolveFile(path.join(clean, 'index.html'));
    return full;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (BASE && (pathname === '/' || pathname === BASE)) {
    res.writeHead(302, { Location: `${BASE}/` });
    return res.end();
  }
  const file = pathname.startsWith(`${BASE}/`) ? await resolveFile(pathname.slice(BASE.length)) : null;
  if (!file) {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    return res.end(await readFile(path.join(ROOT, '404.html')).catch(() => 'Not found'));
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(await readFile(file));
}).listen(PORT, '127.0.0.1', () => console.log(`Varco: http://127.0.0.1:${PORT}${BASE}/`));

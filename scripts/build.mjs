// Static site generator for Varco. No framework: each page is an ES module that returns HTML.
// Env overrides (used by local tests): VARCO_ORIGIN, VARCO_BASE.
import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const NM = path.join(ROOT, 'node_modules');

// VARCO_CONFIG lets tests build with a fake (sandbox) payment configuration.
const configPath = process.env.VARCO_CONFIG ? path.resolve(ROOT, process.env.VARCO_CONFIG) : path.join(SRC, 'config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const origin = process.env.VARCO_ORIGIN ?? config.site.origin;
const base = process.env.VARCO_BASE ?? config.site.base;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out.sort();
}

// Content hash of the sources: identical sources give identical asset URLs.
const hash = createHash('sha1').update(pkg.version).update(origin + base).update(JSON.stringify(config));
for (const f of await walk(SRC)) hash.update(await readFile(f));
const buildId = hash.digest('hex').slice(0, 10);

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
for (const dir of ['css', 'js', 'data']) await cp(path.join(SRC, dir), path.join(DIST, dir), { recursive: true });
await cp(path.join(SRC, 'static'), DIST, { recursive: true });

// Self-hosted fonts (OFL): no request leaves the site, no consent needed.
const FONTS = {
  '@fontsource-variable/atkinson-hyperlegible-next/files': ['atkinson-hyperlegible-next-latin-wght-normal.woff2', 'atkinson-hyperlegible-next-latin-ext-wght-normal.woff2'],
  '@fontsource-variable/overpass/files': ['overpass-latin-wght-normal.woff2', 'overpass-latin-ext-wght-normal.woff2'],
  '@fontsource/atkinson-hyperlegible-mono/files': ['atkinson-hyperlegible-mono-latin-400-normal.woff2', 'atkinson-hyperlegible-mono-latin-700-normal.woff2'],
};
await mkdir(path.join(DIST, 'fonts'), { recursive: true });
for (const [dir, files] of Object.entries(FONTS)) {
  for (const f of files) await cp(path.join(NM, dir, f), path.join(DIST, 'fonts', f));
}

// axe-core (MPL-2.0) for the sandboxed frame, plus the bookmarklet bundle.
const axeSrc = await readFile(path.join(NM, 'axe-core/axe.min.js'), 'utf8');
const axeVersion = JSON.parse(await readFile(path.join(NM, 'axe-core/package.json'), 'utf8')).version;
const localeJs = `window.VARCO_AXE_LOCALE=${JSON.stringify(JSON.parse(await readFile(path.join(NM, 'axe-core/locales/it.json'), 'utf8')))};\n`;
const compact = await readFile(path.join(SRC, 'agent/compact.js'), 'utf8');
const agent = (await readFile(path.join(SRC, 'agent/agent.js'), 'utf8')).replaceAll('__VARCO_ORIGIN__', origin).replaceAll('__VARCO_BASE__', base);
const runner = await readFile(path.join(SRC, 'agent/runner-frame.js'), 'utf8');
await mkdir(path.join(DIST, 'vendor'), { recursive: true });
await writeFile(path.join(DIST, 'vendor/axe.min.js'), axeSrc);
await cp(path.join(NM, 'axe-core/LICENSE'), path.join(DIST, 'vendor/axe-core-LICENSE.txt'));
await writeFile(path.join(DIST, 'agent.js'), `/*! Varco agent ${pkg.version}. Includes axe-core ${axeVersion} (MPL-2.0, ${base}/vendor/axe-core-LICENSE.txt) */\n${axeSrc}\n${localeJs}${compact}\n${agent}`);
await writeFile(path.join(DIST, 'js/runner-frame.js'), `${localeJs}${compact}\n${runner}`);

const agentUrl = `${origin}${base}/agent.js`;
const bookmarklet = `javascript:(function(){if(window.__varcoAgent){window.__varcoAgent.show();return}var s=document.createElement('script');s.src='${agentUrl}';s.onerror=function(){alert('Varco non riesce ad analizzare questa pagina: il sito blocca gli script esterni. Usa la modalita "Incolla il codice HTML" su Varco.')};document.documentElement.appendChild(s)})();`;

const cf = config.analytics.provider === 'cloudflare' && config.analytics.token;
const csp = [
  "default-src 'self'",
  `script-src 'self' ${origin}${cf ? ' https://static.cloudflareinsights.com' : ''}`,
  "style-src 'self' 'unsafe-inline' https: http:",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data: https: http:",
  `connect-src 'self' https://api.polar.sh https://sandbox-api.polar.sh${cf ? ' https://cloudflareinsights.com' : ''}`,
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// Rule metadata straight from the engine, so pages never drift from what is actually checked.
const axeNode = createRequire(import.meta.url)('axe-core');
const RUN_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const axeRules = Object.fromEntries(axeNode.getRules().map((r) => [r.ruleId, r.tags]));
const ruleCount = axeNode.getRules(RUN_TAGS).filter((r) => !r.tags.includes('experimental') && r.ruleId !== 'frame-tested').length;

const { layout } = await import(pathToFileURL(path.join(SRC, 'layout.mjs')).href);
const imp = async (rel) => (await import(pathToFileURL(path.join(SRC, rel)).href)).default;
const ctx = {
  config, origin, base, buildId, bookmarklet, csp, axeVersion, axeRules, ruleCount,
  version: pkg.version,
  rules: await imp('data/rules.it.js'),
  wcag: await imp('data/wcag.it.js'),
  checklist: await imp('data/checklist.it.js'),
  url: (p) => `${base}${p}`,
  abs: (p) => `${origin}${base}${p}`,
  asset: (p) => `${base}/${p}?v=${buildId}`,
};

const PAGES = ['home', 'verifica', 'report', 'obbligo', 'checklist', 'dichiarazione', 'prezzi', 'acquista', 'licenza', 'grazie', 'guida', 'esempio', 'microimprese', 'regole', 'legali', 'errore'];
const written = [];
for (const name of PAGES) {
  const make = await imp(`pages/${name}.mjs`);
  for (const page of [].concat(await make(ctx))) {
    const file = page.path === '/404.html' ? path.join(DIST, '404.html') : path.join(DIST, page.path, 'index.html');
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, layout(page, ctx));
    written.push(page);
  }
}

const demo = (await readFile(path.join(SRC, 'demo/negozio.html'), 'utf8')).replaceAll('{{BASE}}', base).replaceAll('{{V}}', buildId);
await mkdir(path.join(DIST, 'demo/negozio'), { recursive: true });
await writeFile(path.join(DIST, 'demo/negozio/index.html'), demo);

const today = new Date().toISOString().slice(0, 10);
const urls = written.filter((p) => !p.noindex && p.path !== '/404.html');
await writeFile(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((p) => `  <url><loc>${origin}${base}${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await writeFile(path.join(DIST, '.nojekyll'), '');
await writeFile(path.join(DIST, 'version.json'), JSON.stringify({ version: pkg.version, build: buildId, axe: axeVersion, builtAt: new Date().toISOString() }));

const size = (await stat(path.join(DIST, 'agent.js'))).size;
console.log(`Varco ${pkg.version} (${buildId}) → dist/: ${written.length} pages, ${urls.length} in sitemap, agent.js ${(size / 1024).toFixed(0)} KB, base "${base}"`);

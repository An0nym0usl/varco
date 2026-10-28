// Production smoke test without a browser: key pages, assets and the bookmarklet bundle must be
// reachable and consistent with each other. Usage: node scripts/smoke.mjs https://host/base/
const target = (process.argv[2] ?? 'https://an0nym0usl.github.io/varco/').replace(/\/?$/, '/');
const root = new URL(target);
const origin = root.origin;

const checks = [
  ['', (t) => t.includes('Il tuo sito lascia fuori qualcuno?')],
  ['verifica/', (t) => t.includes('javascript:(function(){') && t.includes(`${origin}${root.pathname}agent.js`)],
  ['report/', (t) => t.includes('data-report-body')],
  ['obbligo/', (t) => t.includes('data-wizard')],
  ['checklist/', (t) => t.includes('data-checklist')],
  ['dichiarazione/', (t) => t.includes('data-statement-form')],
  ['prezzi/', (t) => t.includes('Agenzia')],
  ['guida/european-accessibility-act/', (t) => t.includes('Allegato V')],
  ['guida/dichiarazione-accessibilita-ecommerce/', (t) => t.includes('Bottega Esempio srl')],
  ['guida/eaa-microimprese/', (t) => t.includes('Microimpresa: esente')],
  ['regole/image-alt/', (t) => t.includes('Immagini senza testo alternativo')],
  ['demo/negozio/', (t) => t.includes('data-varco-demo')],
  ['sitemap.xml', (t) => t.includes('<urlset')],
  ['version.json', (t) => Boolean(JSON.parse(t).build)],
  ['agent.js', (t) => t.length > 400_000 && t.includes('axe') && t.includes(`'${origin}'`)],
  ['vendor/axe.min.js', (t) => t.length > 300_000],
  ['js/runner-frame.js', (t) => t.includes('varco:frame-scan')],
  ['css/main.css', (t) => t.includes('--signal')],
  ['fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2', (t) => t.length > 10_000],
];

let failed = 0;
for (const [path, ok] of checks) {
  const url = new URL(path, target).href;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'varco-smoke/1.0' } });
    const text = await res.text();
    const pass = res.ok && ok(text);
    if (!pass) failed += 1;
    console.log(`${pass ? 'OK  ' : 'FAIL'} ${res.status} ${String(Date.now() - t0).padStart(5)}ms ${url}`);
  } catch (e) {
    failed += 1;
    console.log(`FAIL ---       ${url} (${e.message})`);
  }
}
const missing = await fetch(new URL('pagina-inesistente-smoke/', target)).catch(() => null);
if (!missing || missing.status !== 404) { failed += 1; console.log(`FAIL 404 page returned ${missing?.status}`); } else console.log('OK   404 for unknown pages');
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);

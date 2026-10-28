// Renders the social sharing image (1200x630) into src/static/og.png. Run once after design changes:
// node scripts/og-image.mjs
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const font = async (rel) => `data:font/woff2;base64,${(await readFile(path.join(ROOT, 'node_modules', rel))).toString('base64')}`;
const overpass = await font('@fontsource-variable/overpass/files/overpass-latin-wght-normal.woff2');
const atkinson = await font('@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2');

const tile = (n) => `<div class="step"><div class="tile"><span>${n}</span></div><div class="ridge"></div></div>`;
const page = `<!doctype html><html><head><style>
@font-face { font-family: O; src: url(${overpass}); font-weight: 100 900; }
@font-face { font-family: A; src: url(${atkinson}); font-weight: 200 800; }
body { margin: 0; width: 1200px; height: 630px; background: #f3f4f1; font-family: A; color: #15181b; display: grid; grid-template-columns: 1fr 220px; }
.left { padding: 70px 0 0 80px; }
.brand { display: flex; align-items: center; gap: 16px; font: 800 44px/1 O; letter-spacing: -0.02em; }
h1 { font: 900 84px/0.98 O; letter-spacing: -0.035em; margin: 56px 0 28px; max-width: 820px; }
p { font-size: 30px; line-height: 1.35; margin: 0; color: #3d434a; max-width: 800px; }
.path { padding-top: 66px; display: flex; flex-direction: column; align-items: center; }
.tile { width: 84px; height: 84px; border-radius: 10px; background-color: #ffc20e; background-image: radial-gradient(circle, rgba(21,24,27,.17) 0 4px, transparent 4.6px); background-size: 21px 21px; display: grid; place-items: center; }
.tile span { width: 44px; height: 44px; border-radius: 50%; background: #15181b; color: #ffc20e; display: grid; place-items: center; font: 900 26px/1 O; }
.ridge { width: 32px; height: 30px; margin: 0 auto; background-color: #ffc20e; background-image: repeating-linear-gradient(90deg, transparent 0 5px, rgba(21,24,27,.17) 5px 9px); border-radius: 3px; }
.door { width: 84px; height: 104px; border-radius: 10px; background: #ffc20e; position: relative; }
.door::after { content: ''; position: absolute; left: 18px; right: 18px; top: 22px; bottom: 0; background: #15181b; border-radius: 24px 24px 0 0; }
</style></head><body>
<div class="left">
  <div class="brand"><svg width="56" height="56" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#ffc20e"/><path d="M10 27V15a6 6 0 0 1 12 0v12z" fill="#15181b"/></svg>Varco</div>
  <h1>Il tuo sito lascia fuori qualcuno?</h1>
  <p>Verifica di accessibilità e European Accessibility Act, in italiano. Gratis per iniziare.</p>
</div>
<div class="path">${[1, 2, 3, 4].map(tile).join('')}<div class="door"></div></div>
</body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await tab.setContent(page);
await tab.evaluate(() => document.fonts.ready);
await tab.screenshot({ path: path.join(ROOT, 'src/static/og.png') });
await browser.close();
console.log('src/static/og.png written');

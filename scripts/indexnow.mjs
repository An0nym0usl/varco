// Notifies IndexNow (Bing, Yandex, Seznam, Naver…) of pages whose content changed since the previous
// deployment. Usage: node scripts/indexnow.mjs <old-pages.json> <new-pages.json>
// The ownership key file is published at <base>/<key>.txt by the build (config.seo.indexNowKey).
import { readFile } from 'node:fs/promises';

const [oldPath, newPath] = process.argv.slice(2);
const read = async (p) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return { pages: {} }; } };
const before = await read(oldPath);
const after = await read(newPath);
if (!after.key || !after.site) { console.log('IndexNow: no key configured, skipped'); process.exit(0); }

const changed = Object.entries(after.pages).filter(([p, h]) => before.pages?.[p] !== h).map(([p]) => p);
const removed = Object.keys(before.pages ?? {}).filter((p) => !(p in after.pages));
const urlList = [...changed, ...removed].map((p) => `${after.site}${p}`);
if (!urlList.length) { console.log('IndexNow: no content changes, nothing to submit'); process.exit(0); }

const site = new URL(after.site);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: site.host, key: after.key, keyLocation: `${after.site}/${after.key}.txt`, urlList: urlList.slice(0, 10000) }),
});
console.log(`IndexNow: submitted ${urlList.length} URL(s) (${changed.length} new/changed, ${removed.length} removed) → HTTP ${res.status}`);
// 200 = received, 202 = received, key validation pending. Anything else is reported but never fails a deploy.
if (![200, 202].includes(res.status)) console.log(await res.text().catch(() => ''));

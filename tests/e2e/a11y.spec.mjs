// Dogfooding: every Varco page must have zero axe-core violations, in light and dark mode.
import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const PAGES = ['/', '/verifica/', '/report/', '/obbligo/', '/checklist/', '/dichiarazione/', '/prezzi/', '/licenza/', '/grazie/',
  '/guida/european-accessibility-act/', '/guida/dichiarazione-accessibilita-ecommerce/', '/regole/', '/regole/color-contrast/', '/regole/aria-dialog-name/', '/privacy/', '/termini/',
  '/note-legali/', '/acquista/pro/', '/pagina-che-non-esiste/'];

test.use({ bypassCSP: true });

async function audit(page) {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate((tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
}

for (const scheme of ['light', 'dark']) {
  for (const path of PAGES) {
    test(`${path} has no accessibility violations (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.route('**/sandbox.polar.sh/**', (r) => r.abort());
      await page.goto(`/varco${path}`);
      expect(await audit(page)).toEqual([]);
    });
  }
}

test('report with real results has no violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/varco/verifica/');
  await page.getByRole('button', { name: 'Analizza il negozio di prova' }).click();
  await page.waitForURL('**/varco/report/');
  await expect(page.locator('.issue').first()).toBeVisible();
  await page.locator('details').evaluateAll((list) => list.forEach((d) => { d.open = true; }));
  expect(await audit(page)).toEqual([]);
});

test('wizard result and statement preview have no violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/varco/obbligo/');
  await page.getByLabel('Vendita online di prodotti o servizi a consumatori (e-commerce)').check();
  await page.getByLabel('A consumatori (privati)').check();
  await page.getByLabel('10 o più').check();
  await page.getByRole('group', { name: '6. Sei una pubblica amministrazione?' }).getByLabel('No').check();
  await page.getByRole('button', { name: 'Mostra il risultato' }).click();
  await expect(page.getByRole('heading', { name: 'Probabilmente sei obbligato' })).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

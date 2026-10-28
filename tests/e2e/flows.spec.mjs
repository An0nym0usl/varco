import { test, expect } from '@playwright/test';

const FIXTURE = 'http://127.0.0.1:4180/fixture.html';

test('demo scan finds the deliberate problems and opens the report', async ({ page }) => {
  await page.goto('/varco/verifica/');
  await page.getByRole('button', { name: 'Analizza il negozio di prova' }).click();
  await page.waitForURL('**/varco/report/');
  await expect(page.locator('[data-report-title]')).toContainText('Bottega Demo');
  for (const title of ['Immagini senza testo alternativo', 'Testo con contrasto insufficiente', 'Campi del modulo senza etichetta',
    'Pulsanti senza nome', 'Lingua della pagina non dichiarata', 'Zoom bloccato sui dispositivi mobili',
    'Valore di autocompletamento non valido', 'Menu a tendina senza etichetta', 'Link senza testo comprensibile']) {
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await expect(page.locator('.report-meta')).toContainText('Negozio di esempio');
  await expect(page.locator('.issue--critical').first()).toBeVisible();
});

test('home page demo shows the summary inline', async ({ page }) => {
  await page.goto('/varco/');
  await page.getByRole('button', { name: 'Analizza il negozio di prova' }).click();
  const result = page.locator('[data-demo-result]');
  await expect(result).toBeVisible();
  await expect(result.getByRole('link', { name: 'Apri il report completo' })).toBeFocused();
  await expect(result).toContainText('tipi di problema');
});

test('pasted HTML is scanned without running its scripts', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', (d) => { dialogs += 1; d.dismiss(); });
  await page.goto('/varco/verifica/');
  await page.getByRole('button', { name: 'Analizza il codice' }).click();
  await expect(page.locator('#paste-html')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-error-for="html"]')).toContainText('Incolla il codice');
  await page.getByLabel('Codice HTML della pagina').fill('<html lang="it"><head><title>Prova incollata</title></head><body><main><h1>Ciao</h1><img src="foto.png"><button onclick="alert(2)"></button><script>alert(1)</script></main></body></html>');
  await page.locator('#paste-url').fill('https://www.esempio.it/pagina');
  await page.getByRole('button', { name: 'Analizza il codice' }).click();
  await page.waitForURL('**/varco/report/');
  await expect(page.getByRole('heading', { name: 'Immagini senza testo alternativo', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pulsanti senza nome', exact: true })).toBeVisible();
  await expect(page.locator('.report-meta')).toContainText('https://www.esempio.it/pagina');
  expect(dialogs).toBe(0);
});

test('bookmarklet scans a third-party page and hands results to the report', async ({ page, context, baseURL }) => {
  await page.goto('/varco/verifica/');
  const code = await page.locator('[data-bookmarklet]').getAttribute('href');
  expect(code.startsWith('javascript:')).toBe(true);
  // Clicking it on Varco itself must not run it.
  await page.locator('[data-bookmarklet]').click();
  await expect(page.locator('[data-bookmarklet-hint]')).toContainText('trascinalo');

  await page.goto(FIXTURE);
  await page.evaluate((c) => (0, eval)(c.slice('javascript:'.length)), code);
  await expect(page.getByText(/Trovat[oi] \d+ tip[oi] di problema/)).toBeVisible();
  await page.getByRole('button', { name: /Mostra nella pagina: / }).first().click();
  await expect(page.locator('[data-varco-flag]').first()).toBeAttached();
  const [report] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: 'Apri il report completo' }).click(),
  ]);
  await report.waitForLoadState();
  expect(report.url()).toContain(`${baseURL}/varco/report/`);
  await expect(report.getByRole('heading', { name: 'Report: Pagina di prova esterna' })).toBeVisible();
  await expect(report.getByRole('heading', { name: 'Immagini senza testo alternativo', exact: true })).toBeVisible();
  await expect(report.locator('.report-meta')).toContainText('Pulsante Varco');
  // Running the bookmarklet again only re-opens the panel.
  await page.keyboard.press('Escape');
  await page.evaluate((c) => (0, eval)(c.slice('javascript:'.length)), code);
  await expect(page.locator('#varco-agent-host')).toHaveCount(1);
});

test('imported results with hostile content are shown as text', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', (d) => { dialogs += 1; d.dismiss(); });
  await page.goto('/varco/report/');
  const evil = '<img src=x onerror="alert(1)">';
  const payload = JSON.stringify({ format: 'varco-scan', version: 1, scan: {
    url: 'javascript:alert(1)', title: `<script>alert(1)</script>`,
    violations: [{ id: 'image-alt', impact: 'critical', tags: ['wcag111'], help: evil, nodeCount: 1, nodes: [{ target: evil, html: evil, summary: evil }] }],
    incomplete: [], passes: [],
  } });
  await page.locator('summary', { hasText: 'Importa risultati' }).click();
  await page.getByLabel('Incolla i risultati').fill(payload);
  await page.getByRole('button', { name: 'Importa' }).click();
  await expect(page.locator('[data-report-title]')).toContainText('<script>alert(1)</script>');
  await page.locator('summary', { hasText: 'Elementi coinvolti' }).click();
  await expect(page.locator('.node-target').first()).toHaveText(evil);
  await expect(page.locator('.report-meta a')).toHaveCount(0);
  expect(await page.locator('[data-report-body] img[src="x"]').count()).toBe(0);
  expect(dialogs).toBe(0);
});

test('saving reports respects the free limit and survives reloads', async ({ page }) => {
  await page.goto('/varco/verifica/');
  await page.getByRole('button', { name: 'Analizza il negozio di prova' }).click();
  await page.waitForURL('**/varco/report/');
  await page.getByRole('button', { name: 'Salva nel progetto' }).click();
  await expect(page.locator('[data-action-status]')).toContainText('Report salvato');
  await page.reload();
  await expect(page.locator('.project-list li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Esporta CSV' }).click();
  await expect(page.locator('[data-action-status]')).toContainText('piani Pro e Agenzia');
});

test('EAA wizard gives the microenterprise exemption and validates answers', async ({ page }) => {
  await page.goto('/varco/obbligo/');
  await page.getByRole('button', { name: 'Mostra il risultato' }).click();
  await expect(page.locator('[data-wizard-error]')).toContainText('domanda 1');
  await page.getByLabel('Vendita online di prodotti o servizi a consumatori (e-commerce)').check();
  await page.getByLabel('A consumatori (privati)').check();
  await page.getByLabel('Meno di 10').check();
  await page.getByRole('group', { name: '4. Fatturato annuo' }).getByLabel('Fino a 2 milioni di euro').check();
  await page.getByRole('group', { name: '6. Sei una pubblica amministrazione?' }).getByLabel('No').check();
  await page.getByRole('button', { name: 'Mostra il risultato' }).click();
  await expect(page.getByRole('heading', { name: 'Probabilmente sei esente (microimpresa)' })).toBeVisible();
  await expect(page.locator('[data-wizard-result]')).toBeFocused();
  await page.reload();
  await expect(page.getByLabel('Meno di 10')).toBeChecked();
});

test('checklist answers persist and update progress', async ({ page }) => {
  await page.goto('/varco/checklist/');
  const first = page.locator('[data-check="tastiera"]');
  await first.getByLabel('Non superato').check();
  await expect(page.locator('[data-checklist-progress]')).toContainText('1 controlli completati');
  await expect(first).toHaveAttribute('data-state', 'ko');
  await page.reload();
  await expect(page.locator('[data-check="tastiera"]').getByLabel('Non superato')).toBeChecked();
});

test('statement generator uses scan results, checklist and the plan credit', async ({ page }) => {
  await page.goto('/varco/verifica/');
  await page.getByRole('button', { name: 'Analizza il negozio di prova' }).click();
  await page.waitForURL('**/varco/report/');
  await page.goto('/varco/checklist/');
  await page.locator('[data-check="acquisto"]').getByLabel('Non superato').check();
  await page.goto('/varco/dichiarazione/');
  await page.getByLabel('Ragione sociale').fill('Bottega Rossi srl');
  await page.getByLabel('Email per le segnalazioni').fill('accessibilita@esempio.it');
  const preview = page.locator('[data-statement-preview]');
  await expect(preview).toContainText('Bottega Rossi srl');
  await expect(preview).toContainText('Immagini senza testo alternativo');
  await expect(preview).toContainText('Il percorso di acquisto è completo e accessibile');
  await expect(preview).toContainText('Verifica preparata con');
  await expect(page.locator('[data-status-suggestion]')).toContainText('parzialmente conforme');
  await page.getByLabel(/Immagini senza testo alternativo/).uncheck();
  await expect(preview).not.toContainText('Immagini senza testo alternativo');
  await page.reload();
  await expect(page.getByLabel('Ragione sociale')).toHaveValue('Bottega Rossi srl');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Scarica .html' }).click()]);
  expect(download.suggestedFilename()).toBe('informazioni-accessibilita.html');
});

test('license activation unlocks paid features (Polar sandbox mocked)', async ({ page }) => {
  const calls = [];
  await page.route('https://sandbox-api.polar.sh/v1/customer-portal/license-keys/*', async (route) => {
    const action = route.request().url().split('/').pop();
    const body = route.request().postDataJSON();
    calls.push({ action, body });
    const ok = body.key === 'VARCO-PRO-TEST-KEY' && body.organization_id === '00000000-0000-4000-8000-000000000001';
    const key = { status: 'granted', benefit_id: '00000000-0000-4000-8000-0000000000aa', display_key: '****-TEST', expires_at: null, limit_activations: 3 };
    if (!ok) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"ResourceNotFound"}' });
    if (action === 'activate') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'act-test-1', label: body.label, license_key: key }) });
    if (action === 'deactivate') return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(key) });
  });
  await page.goto('/varco/licenza/');
  await page.getByLabel('Chiave di licenza').fill('WRONG-KEY-0000');
  await page.getByRole('button', { name: 'Attiva' }).click();
  await expect(page.locator('[data-license-msg]')).toContainText('Licenza non trovata');
  await page.getByLabel('Chiave di licenza').fill('VARCO-PRO-TEST-KEY');
  await page.getByRole('button', { name: 'Attiva' }).click();
  await expect(page.getByRole('heading', { name: 'Piano attuale: Pro' })).toBeVisible();
  await expect(page.locator('[data-plan-badge]')).toHaveText('Piano Pro');

  await page.goto('/varco/verifica/');
  await page.getByRole('button', { name: 'Analizza il negozio di prova' }).click();
  await page.waitForURL('**/varco/report/');
  const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Esporta CSV' }).click()]);
  expect(csv.suggestedFilename()).toMatch(/^varco-.*\.csv$/);
  await page.goto('/varco/dichiarazione/');
  await expect(page.locator('[data-statement-preview]')).not.toContainText('Verifica preparata con');
  // The device was registered with a readable label, and removing the license frees the slot.
  expect(calls.find((c) => c.action === 'activate').body.label).toMatch(/ su /);
  await page.goto('/varco/licenza/');
  await page.getByRole('button', { name: 'Rimuovi la licenza da questo browser' }).click();
  await expect(page.getByRole('heading', { name: 'Piano attuale: Gratis' })).toBeVisible();
  expect(calls.some((c) => c.action === 'deactivate' && c.body.activation_id === 'act-test-1')).toBe(true);
});

const lighthouse = (audits) => ({
  lighthouseResult: {
    lighthouseVersion: '13.0.0', fetchTime: '2026-10-28T12:00:00.000Z', finalDisplayedUrl: 'https://www.esempio.it/',
    categories: { accessibility: { auditRefs: Object.keys(audits).map((id) => ({ id })) } },
    audits,
  },
});

test('URL scan turns a PageSpeed result into an Italian report', async ({ page }) => {
  let requested = '';
  await page.route('https://www.googleapis.com/pagespeedonline/v5/runPagespeed**', (route) => {
    requested = route.request().url();
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(lighthouse({
      'image-alt': { score: 0, scoreDisplayMode: 'binary', title: 'Image elements do not have [alt]', details: { items: [{ node: { selector: 'main > img', snippet: '<img src="a.jpg">', explanation: 'Fix any of the following' } }, { node: { selector: 'footer img', snippet: '<img src="b.png">' } }] } },
      'color-contrast': { score: 1, scoreDisplayMode: 'binary', title: 'ok' },
      'document-title': { score: 1, scoreDisplayMode: 'binary', title: 'ok' },
      'video-caption': { score: null, scoreDisplayMode: 'notApplicable', title: 'n/a' },
      'logical-tab-order': { score: null, scoreDisplayMode: 'manual', title: 'manual' },
    })) });
  });
  await page.goto('/varco/verifica/');
  await page.getByLabel('Indirizzo della pagina da controllare').fill('www.esempio.it');
  await page.getByRole('button', { name: "Analizza l'indirizzo" }).click();
  await page.waitForURL('**/varco/report/');
  expect(new URL(requested).searchParams.get('url')).toBe('https://www.esempio.it/');
  expect(new URL(requested).searchParams.get('category')).toBe('ACCESSIBILITY');
  await expect(page.getByRole('heading', { name: 'Immagini senza testo alternativo', exact: true })).toBeVisible();
  await expect(page.locator('.report-meta')).toContainText('Indirizzo (Google PageSpeed Insights)');
  await expect(page.locator('[data-report-lead]')).toContainText('1 tipo di problema su 2 elementi. 2 regole superate');
});

test('URL scan explains quota and invalid addresses', async ({ page }) => {
  await page.route('https://www.googleapis.com/pagespeedonline/v5/runPagespeed**', (route) => route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":{"code":429}}' }));
  await page.goto('/varco/verifica/');
  await page.getByRole('button', { name: "Analizza l'indirizzo" }).click();
  await expect(page.locator('[data-error-for="scanurl"]')).toContainText("Scrivi l'indirizzo completo");
  await page.getByLabel('Indirizzo della pagina da controllare').fill('https://www.esempio.it/');
  await page.getByRole('button', { name: "Analizza l'indirizzo" }).click();
  await expect(page.locator('[data-error-for="scanurl"]')).toContainText('limite di oggi');
  await expect(page.locator('#scan-url')).toHaveAttribute('aria-invalid', 'true');
});

test('analytics sends anonymous funnel events without scan content', async ({ page }) => {
  const events = [];
  await page.route('**/__ph/capture/', async (route) => {
    events.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' });
  });
  await page.goto('/varco/?utm_source=linkedin&utm_medium=post');
  await page.getByRole('button', { name: 'Analizza il negozio di prova' }).click();
  await expect(page.locator('[data-demo-result]')).toBeVisible();
  await expect.poll(() => events.map((e) => e.event)).toEqual(expect.arrayContaining(['$pageview', 'demo_run', 'scan_completed']));
  const view = events.find((e) => e.event === '$pageview');
  expect(view.api_key).toBe('phc_test_project_key');
  expect(view.properties).toMatchObject({ utm_source: 'linkedin', utm_medium: 'post', path: '/varco/', $process_person_profile: false });
  const done = events.find((e) => e.event === 'scan_completed');
  expect(done.properties.source).toBe('demo');
  expect(done.properties.rules_failed).toBeGreaterThan(0);
  const all = JSON.stringify(events);
  expect(all).not.toContain('negozio');
  expect(all).not.toContain('<img');
  expect(new Set(events.map((e) => e.properties.distinct_id)).size).toBe(1);
  expect(await page.evaluate(() => document.cookie)).toBe('');
});

test('pricing links go through the tracked checkout page to Polar', async ({ page }) => {
  await page.route('https://sandbox.polar.sh/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Polar checkout (mock)</title>' }));
  await page.goto('/varco/prezzi/');
  await page.getByRole('link', { name: 'Acquista Pro' }).click();
  await page.waitForURL('https://sandbox.polar.sh/checkout/test-pro');
});

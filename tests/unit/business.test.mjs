import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessEaa, classifyMicro } from '../../src/js/lib/wizard.js';
import { activateLicense, checkLicense, deactivateLicense, effectivePlan, needsRevalidation, planForBenefit, deviceLabel, API, GRACE_MS } from '../../src/js/lib/license.js';
import { buildStatementHtml, buildStatementText, statementModel, formatDateIt } from '../../src/js/lib/statement.js';
import { sanitize, attribution } from '../../src/js/lib/analytics.js';

const payments = { organizationId: 'org-1', sandbox: false, benefits: { pro: 'ben-pro', agenzia: 'ben-ag' } };
const granted = (over = {}) => ({ status: 'granted', benefit_id: 'ben-ag', display_key: '****-3456', expires_at: null, limit_activations: 3, ...over });

// Fake Polar: responses keyed by endpoint action (activate / validate / deactivate).
function fakePolar(routes, calls = []) {
  return async (url, init) => {
    const action = url.split('/').pop();
    calls.push({ url, action, body: JSON.parse(init.body) });
    const r = routes[action] ?? { status: 404, body: {} };
    if (r.throw) throw new Error('offline');
    return { status: r.status, ok: r.status >= 200 && r.status < 300, json: async () => r.body };
  };
}

test('microenterprise definition follows EAA art. 3(23)', () => {
  assert.equal(classifyMicro('<10', '<=2', '>2'), 'si');
  assert.equal(classifyMicro('<10', '>2', '<=2'), 'si');
  assert.equal(classifyMicro('<10', '>2', '>2'), 'no');
  assert.equal(classifyMicro('10+', '<=2', '<=2'), 'no');
  assert.equal(classifyMicro('<10', 'nonso', 'nonso'), 'incerto');
  assert.equal(classifyMicro(null, '<=2', '<=2'), 'incerto');
});

test('EAA assessment outcomes', () => {
  const base = { services: ['ecommerce'], clienti: 'consumatori', pa: 'no', fatturato500: 'no' };
  assert.equal(assessEaa({ ...base, persone: '10+' }).outcome, 'obbligato');
  assert.equal(assessEaa({ ...base, persone: '<10', fatturato: '<=2' }).outcome, 'esente');
  assert.equal(assessEaa({ ...base, persone: '<10', fatturato: 'nonso', bilancio: 'nonso' }).outcome, 'da-verificare');
  assert.equal(assessEaa({ ...base, clienti: 'aziende', persone: '10+' }).outcome, 'fuori-ambito');
  assert.equal(assessEaa({ ...base, services: ['nessuno'], persone: '10+' }).outcome, 'fuori-ambito');
  assert.equal(assessEaa({ ...base, services: [], clienti: 'aziende', persone: '10+', fatturato500: 'si' }).outcome, 'obbligato');
  assert.equal(assessEaa({ ...base, pa: 'si' }).outcome, 'pa');
  const r = assessEaa({ ...base, persone: '10+' });
  assert.ok(r.next.length >= 4);
  assert.ok(r.refs.some((x) => x.url.includes('normattiva')));
});

test('activation binds the device and maps the plan', async () => {
  const calls = [];
  const res = await activateLicense(' KEY-123456 ', payments, { label: 'Chrome su Windows', fetchImpl: fakePolar({ activate: { status: 200, body: { id: 'act-1', license_key: granted() } } }, calls) });
  assert.equal(res.ok, true);
  assert.deepEqual([res.license.plan, res.license.activationId, res.license.key], ['agenzia', 'act-1', 'KEY-123456']);
  assert.equal(calls[0].url, `${API.live}/activate`);
  assert.deepEqual(calls[0].body, { organization_id: 'org-1', key: 'KEY-123456', label: 'Chrome su Windows', meta: { app: 'varco' } });
});

test('activation falls back to validate for keys without device limits, and reports full limits', async () => {
  const noLimit = await activateLicense('KEY-123456', payments, { fetchImpl: fakePolar({ activate: { status: 403, body: {} }, validate: { status: 200, body: granted({ limit_activations: null, benefit_id: 'ben-pro' }) } }) });
  assert.equal(noLimit.ok, true);
  assert.equal(noLimit.license.plan, 'pro');
  assert.equal(noLimit.license.activationId, null);
  const full = await activateLicense('KEY-123456', payments, { fetchImpl: fakePolar({ activate: { status: 403, body: {} }, validate: { status: 200, body: granted() } }) });
  assert.equal(full.reason, 'activation_limit');
  const revoked = await activateLicense('KEY-123456', payments, { fetchImpl: fakePolar({ activate: { status: 403, body: {} }, validate: { status: 404, body: {} } }) });
  assert.equal(revoked.reason, 'not_found');
});

test('activation error mapping', async () => {
  const run = (routes) => activateLicense('KEY-123456', payments, { fetchImpl: fakePolar(routes) });
  assert.equal((await run({ activate: { status: 404, body: {} } })).reason, 'not_found');
  assert.equal((await run({ activate: { status: 422, body: {} } })).reason, 'invalid_format');
  assert.equal((await run({ activate: { status: 500, body: {} } })).reason, 'server');
  assert.equal((await run({ activate: { throw: true } })).reason, 'network');
  assert.equal((await run({ activate: { status: 200, body: { id: 'a', license_key: granted({ benefit_id: 'other' }) } } })).reason, 'wrong_product');
  assert.equal((await run({ activate: { status: 200, body: { id: 'a', license_key: granted({ expires_at: '2000-01-01T00:00:00Z' }) } } })).reason, 'expired');
  assert.equal((await activateLicense('short', payments, { fetchImpl: fakePolar({}) })).reason, 'invalid_format');
  assert.equal((await activateLicense('KEY-123456', { organizationId: '' }, { fetchImpl: fakePolar({}) })).reason, 'not_configured');
});

test('daily re-check sends the activation id and detects revocation; deactivation frees the slot', async () => {
  const calls = [];
  const lic = { key: 'KEY-123456', plan: 'agenzia', activationId: 'act-1', validatedAt: '2026-10-01T00:00:00Z' };
  const ok = await checkLicense(lic, { ...payments, sandbox: true }, fakePolar({ validate: { status: 200, body: granted() } }, calls));
  assert.equal(ok.ok, true);
  assert.equal(calls[0].url, `${API.sandbox}/validate`);
  assert.equal(calls[0].body.activation_id, 'act-1');
  assert.equal((await checkLicense(lic, payments, fakePolar({ validate: { status: 404, body: {} } }))).reason, 'not_found');
  const dcalls = [];
  assert.equal((await deactivateLicense(lic, payments, fakePolar({ deactivate: { status: 204, body: null } }, dcalls))).ok, true);
  assert.deepEqual(dcalls[0].body, { organization_id: 'org-1', key: 'KEY-123456', activation_id: 'act-1' });
  assert.equal((await deactivateLicense({ ...lic, activationId: null }, payments, fakePolar({}))).skipped, true);
});

test('effective plan honours expiry and the offline grace period', () => {
  const now = Date.parse('2026-10-28T12:00:00Z');
  const lic = { plan: 'pro', validatedAt: '2026-10-28T06:00:00Z', expiresAt: null };
  assert.equal(effectivePlan(lic, now), 'pro');
  assert.equal(effectivePlan({ ...lic, expiresAt: '2026-10-01T00:00:00Z' }, now), 'gratis');
  assert.equal(effectivePlan({ ...lic, validatedAt: new Date(now - GRACE_MS - 1).toISOString() }, now), 'gratis');
  assert.equal(effectivePlan({ ...lic, plan: 'hacker' }, now), 'gratis');
  assert.equal(effectivePlan(null, now), 'gratis');
  assert.equal(needsRevalidation({ plan: 'pro', validatedAt: '2026-10-27T06:00:00Z' }, now), true);
  assert.equal(needsRevalidation(lic, now), false);
  assert.equal(needsRevalidation({ plan: 'gratis', validatedAt: '2026-01-01T00:00:00Z' }, now), false);
  assert.equal(planForBenefit('', { pro: '' }), null);
  assert.match(deviceLabel({ userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36' }), /^Chrome su Windows/);
});

test('analytics keeps only coarse properties and attribution', () => {
  assert.deepEqual(sanitize({ plan: 'pro', rules_failed: 13, ok: true, url: 'x'.repeat(41), 'Bad-Key': 1, nested: { a: 1 } }), { plan: 'pro', rules_failed: 13, ok: true });
  const loc = { search: '?utm_source=linkedin&utm_medium=post&x=1', host: 'an0nym0usl.github.io' };
  assert.deepEqual(attribution(loc, 'https://www.google.com/search?q=secret'), { utm_source: 'linkedin', utm_medium: 'post', referrer_host: 'www.google.com' });
  assert.deepEqual(attribution(loc, 'https://an0nym0usl.github.io/varco/'), { utm_source: 'linkedin', utm_medium: 'post' });
});

test('statement follows Annex V and escapes user input', () => {
  const input = {
    azienda: 'Bottega <Rossi> srl', servizio: 'il negozio online', sito: 'https://www.esempio.it', descrizione: 'Vendiamo scarpe.',
    funzionamento: 'Scegli, paga, ricevi.', stato: 'parziale', problemi: ['Immagini senza testo alternativo'], alternative: 'Ordina per telefono.',
    email: 'accessibilita@esempio.it', data: '2026-10-28', metodo: 'autovalutazione',
  };
  const h = buildStatementHtml(input, { credit: true, creditUrl: 'https://an0nym0usl.github.io/varco/' });
  assert.ok(h.includes('Bottega &lt;Rossi&gt; srl'));
  assert.ok(!h.includes('<Rossi>'));
  for (const part of ['Descrizione generale del servizio', 'Come funziona il servizio', 'Come il servizio soddisfa i requisiti', 'Limitazioni note', 'Alternative accessibili', 'Segnalazioni e richieste', 'AgID', '28 ottobre 2026', 'parzialmente conforme']) assert.ok(h.includes(part), part);
  assert.ok(h.includes('Varco</a>'));
  assert.ok(!buildStatementHtml(input, { credit: false }).includes('Varco</a>'));
  const t = buildStatementText(input, { credit: false });
  assert.ok(t.startsWith("INFORMAZIONI SULL'ACCESSIBILITÀ DEL SERVIZIO"));
  assert.ok(t.includes('- Immagini senza testo alternativo'));
  assert.ok(!t.includes('Varco'));
  assert.equal(statementModel({ sito: 'javascript:alert(1)' }).sito, '');
  assert.equal(statementModel({ stato: 'bogus' }).status, 'parziale');
  assert.equal(formatDateIt('2026-01-05'), '5 gennaio 2026');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessEaa, classifyMicro } from '../../src/js/lib/wizard.js';
import { validateLicense, effectivePlan, needsRevalidation, planForBenefit, ENDPOINTS, GRACE_MS } from '../../src/js/lib/license.js';
import { buildStatementHtml, buildStatementText, statementModel, formatDateIt } from '../../src/js/lib/statement.js';

const payments = { organizationId: 'org-1', sandbox: false, benefits: { pro: 'ben-pro', agenzia: 'ben-ag' } };
const fakeFetch = (status, body, capture) => async (url, init) => {
  if (capture) capture.push({ url, init });
  return { status, ok: status >= 200 && status < 300, json: async () => body };
};

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

test('license validation maps Polar responses', async () => {
  const calls = [];
  const ok = await validateLicense(' KEY-123456 ', payments, fakeFetch(200, { status: 'granted', benefit_id: 'ben-ag', display_key: '****-3456', expires_at: null }, calls));
  assert.equal(ok.ok, true);
  assert.equal(ok.license.plan, 'agenzia');
  assert.equal(ok.license.key, 'KEY-123456');
  assert.equal(calls[0].url, ENDPOINTS.live);
  assert.deepEqual(JSON.parse(calls[0].init.body), { key: 'KEY-123456', organization_id: 'org-1' });
  const sandboxCalls = [];
  await validateLicense('KEY-123456', { ...payments, sandbox: true }, fakeFetch(404, {}, sandboxCalls));
  assert.equal(sandboxCalls[0].url, ENDPOINTS.sandbox);
  assert.equal((await validateLicense('KEY-123456', payments, fakeFetch(404, {}))).reason, 'not_found');
  assert.equal((await validateLicense('KEY-123456', payments, fakeFetch(422, {}))).reason, 'invalid_format');
  assert.equal((await validateLicense('KEY-123456', payments, fakeFetch(500, {}))).reason, 'server');
  assert.equal((await validateLicense('KEY-123456', payments, fakeFetch(200, { status: 'granted', benefit_id: 'other' }))).reason, 'wrong_product');
  assert.equal((await validateLicense('KEY-123456', payments, fakeFetch(200, { status: 'granted', benefit_id: 'ben-pro', expires_at: '2000-01-01T00:00:00Z' }))).reason, 'expired');
  assert.equal((await validateLicense('KEY-123456', payments, async () => { throw new Error('offline'); })).reason, 'network');
  assert.equal((await validateLicense('short', payments, fakeFetch(200, {}))).reason, 'invalid_format');
  assert.equal((await validateLicense('KEY-123456', { organizationId: '' }, fakeFetch(200, {}))).reason, 'not_configured');
});

test('effective plan honours expiry and the offline grace period', () => {
  const now = Date.parse('2026-10-28T12:00:00Z');
  const lic = { plan: 'pro', validatedAt: '2026-10-27T12:00:00Z', expiresAt: null };
  assert.equal(effectivePlan(lic, now), 'pro');
  assert.equal(effectivePlan({ ...lic, expiresAt: '2026-10-01T00:00:00Z' }, now), 'gratis');
  assert.equal(effectivePlan({ ...lic, validatedAt: new Date(now - GRACE_MS - 1).toISOString() }, now), 'gratis');
  assert.equal(effectivePlan({ ...lic, plan: 'hacker' }, now), 'gratis');
  assert.equal(effectivePlan(null, now), 'gratis');
  assert.equal(needsRevalidation({ validatedAt: '2026-10-01T00:00:00Z' }, now), true);
  assert.equal(needsRevalidation(lic, now), false);
  assert.equal(planForBenefit('', { pro: '' }), null);
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

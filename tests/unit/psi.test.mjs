import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanFromLighthouse, scanUrl, impactOf, psiRequestUrl } from '../../src/js/lib/psi.js';
import AXE_TAGS from '../../src/data/axe-tags.js';
import { tagsFor } from '../../scripts/gen-axe-tags.mjs';

const lhr = {
  lighthouseVersion: '13.0.0', fetchTime: '2026-10-28T12:00:00.000Z', finalDisplayedUrl: 'https://www.esempio.it/',
  categories: { accessibility: { auditRefs: [{ id: 'image-alt' }, { id: 'heading-order' }, { id: 'color-contrast' }, { id: 'video-caption' }, { id: 'logical-tab-order' }] } },
  audits: {
    'image-alt': { score: 0, scoreDisplayMode: 'binary', title: 'img', details: { items: [{ node: { selector: 'img', snippet: '<img>', explanation: 'x' } }] } },
    'heading-order': { score: 0, scoreDisplayMode: 'binary', title: 'h', details: { items: [] } },
    'color-contrast': { score: 1, scoreDisplayMode: 'binary' },
    'video-caption': { score: null, scoreDisplayMode: 'notApplicable' },
    'logical-tab-order': { score: null, scoreDisplayMode: 'manual' },
  },
};

test('Lighthouse audits become a Varco scan with axe tags and typical impact', () => {
  const s = scanFromLighthouse(lhr);
  assert.deepEqual(s.violations.map((v) => [v.id, v.impact]), [['image-alt', 'critical'], ['heading-order', 'moderate']]);
  assert.deepEqual(s.violations[0].tags, AXE_TAGS['image-alt']);
  assert.deepEqual(s.violations[0].nodes[0], { target: 'img', html: '<img>', summary: 'x' });
  assert.deepEqual(s.passes, ['color-contrast']);
  assert.equal(s.inapplicable, 1);
  assert.equal(s.title, 'www.esempio.it');
  assert.equal(impactOf('color-contrast'), 'serious');
  assert.throws(() => scanFromLighthouse({}));
});

test('scanUrl validates addresses and maps HTTP outcomes', async () => {
  const fake = (status, body) => async () => ({ status, ok: status === 200, json: async () => body });
  assert.equal((await scanUrl('not a url', 'k', { fetchImpl: fake(200, {}) })).reason, 'invalid_url');
  assert.equal((await scanUrl('http://localhost:3000/', 'k', { fetchImpl: fake(200, {}) })).reason, 'invalid_url');
  assert.equal((await scanUrl('https://a.it/', 'k', { fetchImpl: fake(429, {}) })).reason, 'quota');
  assert.equal((await scanUrl('https://a.it/', 'k', { fetchImpl: fake(500, {}) })).reason, 'unreachable');
  assert.equal((await scanUrl('https://a.it/', 'k', { fetchImpl: async () => { throw new Error('x'); } })).reason, 'network');
  const ok = await scanUrl('https://a.it/', 'k', { fetchImpl: fake(200, { lighthouseResult: lhr }) });
  assert.equal(ok.ok, true);
  assert.equal(ok.scan.source, 'url');
  const u = new URL(psiRequestUrl('https://a.it/', 'KEY'));
  assert.equal(u.searchParams.get('locale'), 'it');
  assert.equal(u.searchParams.get('key'), 'KEY');
});

test('generated axe tags match the installed axe-core', () => {
  assert.deepEqual(AXE_TAGS, tagsFor(), 'run: node scripts/gen-axe-tags.mjs');
});

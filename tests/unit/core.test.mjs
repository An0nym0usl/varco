import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, esc, raw, safeUrl } from '../../src/js/lib/escape.js';
import { criteriaFromTags, enClausesFromTags, isBestPractice, sortRules } from '../../src/js/lib/axe-map.js';
import { normalizeScan, reviveScan, summarize, shrinkScan, LIMITS } from '../../src/js/lib/normalize.js';
import { limits } from '../../src/js/lib/plan.js';
import { csvCell, scanToCsv, compareScans, parseImport, scanToJson } from '../../src/js/lib/export.js';
import RULES from '../../src/data/rules.it.js';
import WCAG from '../../src/data/wcag.it.js';
import CHECKLIST from '../../src/data/checklist.it.js';

const rawScan = (over = {}) => ({
  url: 'https://www.esempio.it/prodotto',
  title: 'Prodotto',
  scannedAt: '2026-10-28T10:00:00.000Z',
  engineVersion: '4.14.0',
  viewport: { w: 1280, h: 800 },
  violations: [
    { id: 'image-alt', impact: 'critical', tags: ['wcag2a', 'wcag111', 'EN-301-549', 'EN-9.1.1.1'], help: 'img', nodeCount: 3, nodes: [{ target: 'img.a', html: '<img src="a.jpg">', summary: 'Fix' }] },
    { id: 'region', impact: 'moderate', tags: ['best-practice'], help: 'region', nodeCount: 1, nodes: [] },
  ],
  incomplete: [],
  passes: ['document-title', 'html-has-lang'],
  inapplicable: 40,
  ...over,
});

test('html`` escapes interpolations but keeps nested safe html', () => {
  const evil = '<img src=x onerror="alert(1)">';
  const out = html`<p title="${evil}">${evil}</p>${html`<b>${'ok'}</b>`}`.value;
  assert.equal(out, `<p title="${esc(evil)}">${esc(evil)}</p><b>ok</b>`);
  assert.ok(!out.includes('<img'));
  assert.equal(html`${[1, 2].map((n) => html`<i>${n}</i>`)}`.value, '<i>1</i><i>2</i>');
  assert.equal(html`${false}${null}${undefined}`.value, '');
  assert.equal(html`${raw('<br>')}`.value, '<br>');
});

test('safeUrl only allows http(s)', () => {
  assert.equal(safeUrl('https://a.it/x'), 'https://a.it/x');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,hi'), '');
  assert.equal(safeUrl('not a url'), '');
});

test('WCAG criteria and EN 301 549 clauses come from axe tags', () => {
  const c = criteriaFromTags(['wcag2a', 'wcag111', 'wcag412', 'wcag1412', 'wcag258', 'wcag21aa']);
  assert.deepEqual(c.map((x) => x.sc), ['1.1.1', '1.4.12', '2.5.8', '4.1.2']);
  assert.equal(c.find((x) => x.sc === '2.5.8').version, '2.2');
  assert.equal(c.find((x) => x.sc === '1.1.1').name, 'Contenuti non testuali');
  assert.deepEqual(enClausesFromTags(['EN-301-549', 'EN-9.1.1.1']), [{ clause: '9.1.1.1', v4Only: false }]);
  assert.deepEqual(enClausesFromTags(['EN-301-549v4', 'EN-9.2.5.8']), [{ clause: '9.2.5.8', v4Only: true }]);
  assert.ok(isBestPractice(['best-practice']));
  assert.ok(!isBestPractice(['best-practice', 'wcag111']));
});

test('rules are sorted by impact then by affected elements', () => {
  const sorted = sortRules([
    { id: 'b', impact: 'minor', nodeCount: 9 }, { id: 'a', impact: 'critical', nodeCount: 1 }, { id: 'c', impact: 'critical', nodeCount: 5 },
  ]);
  assert.deepEqual(sorted.map((r) => r.id), ['c', 'a', 'b']);
});

test('normalizeScan validates and caps untrusted input', () => {
  const s = normalizeScan(rawScan(), 'bookmarklet');
  assert.equal(s.source, 'bookmarklet');
  assert.match(s.id, /^scan_/);
  assert.equal(s.violations[0].id, 'image-alt');
  assert.equal(s.engine.version, '4.14.0');
  const hostile = normalizeScan(rawScan({
    url: 'javascript:alert(1)',
    title: 'x'.repeat(5000),
    violations: [
      { id: 'BAD ID', impact: 'critical', nodes: [] },
      { id: 'image-alt', impact: 'apocalyptic', tags: ['wcag111', '<script>'], nodes: Array.from({ length: 500 }, () => ({ target: 'x'.repeat(9999), html: 1 })) },
    ],
    passes: ['ok-rule', 42, 'ok-rule'],
  }), 'evil-source');
  assert.equal(hostile.url, '');
  assert.equal(hostile.source, 'import');
  assert.equal(hostile.title.length, LIMITS.title);
  assert.equal(hostile.violations.length, 1);
  assert.equal(hostile.violations[0].impact, 'minor');
  assert.deepEqual(hostile.violations[0].tags, ['wcag111']);
  assert.equal(hostile.violations[0].nodes.length, LIMITS.nodes);
  assert.equal(hostile.violations[0].nodes[0].target.length, LIMITS.target);
  assert.equal(hostile.violations[0].nodes[0].html, '');
  assert.deepEqual(hostile.passes, ['ok-rule']);
  assert.throws(() => normalizeScan(null));
  assert.throws(() => normalizeScan({ violations: 'x' }));
});

test('summarize, shrink and revive keep the numbers consistent', () => {
  const s = normalizeScan(rawScan());
  assert.deepEqual(summarize(s), { rulesFailed: 2, elements: 4, byImpact: { critical: 1, serious: 0, moderate: 1, minor: 0 }, passed: 2, review: 0 });
  const revived = reviveScan(JSON.parse(JSON.stringify(shrinkScan(s, 0))));
  assert.equal(revived.id, s.id);
  assert.equal(revived.violations[0].nodeCount, 3);
  assert.equal(revived.violations[0].nodes.length, 0);
});

test('plans unlock the right features', () => {
  assert.equal(limits('gratis').maxSavedScans, 5);
  assert.equal(limits('nonsense').plan, 'gratis');
  assert.equal(limits('pro').exportData, true);
  assert.equal(limits('pro').whiteLabel, false);
  assert.equal(limits('agenzia').whiteLabel, true);
  assert.equal(limits('gratis').statementCredit, true);
  assert.equal(limits('pro').statementCredit, false);
});

test('CSV export neutralises spreadsheet formulas and quotes fields', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('+1'), "'+1");
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('plain'), 'plain');
  const csv = scanToCsv(normalizeScan(rawScan()), (r) => RULES[r.id]?.t ?? r.id);
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 3);
  assert.match(lines[1], /Immagini senza testo alternativo/);
  assert.match(lines[1], /1\.1\.1 \(A\)/);
  assert.match(lines[1], /9\.1\.1\.1/);
});

test('JSON export round-trips and comparison finds fixed and new problems', () => {
  const a = normalizeScan(rawScan());
  assert.deepEqual(parseImport(scanToJson(a)), JSON.parse(JSON.stringify(a)));
  const b = normalizeScan(rawScan({ violations: [{ id: 'image-alt', impact: 'critical', tags: [], nodeCount: 1, nodes: [] }, { id: 'label', impact: 'critical', tags: [], nodeCount: 2, nodes: [] }] }));
  const c = compareScans(a, b);
  assert.deepEqual(c.fixed, ['region']);
  assert.deepEqual(c.added, ['label']);
  assert.deepEqual(c.changed, [{ id: 'image-alt', before: 3, after: 1 }]);
  assert.equal(c.elementsBefore, 4);
  assert.equal(c.elementsAfter, 3);
});

test('content data is complete and consistent', () => {
  for (const [id, r] of Object.entries(RULES)) {
    assert.ok(r.t && r.w && r.y && Array.isArray(r.f) && r.f.length, `rule ${id} incomplete`);
    if (r.e) assert.ok(r.e.bad && r.e.good, `rule ${id} example incomplete`);
  }
  for (const c of CHECKLIST) for (const sc of c.sc) assert.ok(WCAG[sc], `checklist ${c.id} references unknown ${sc}`);
  assert.equal(new Set(CHECKLIST.map((c) => c.id)).size, CHECKLIST.length);
});

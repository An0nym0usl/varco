import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal localStorage stand-in (Node has no DOM storage by default).
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { if (String(v).length > 200000) throw new Error('QuotaExceededError'); mem.set(k, String(v)); },
  removeItem: (k) => mem.delete(k),
};

const { saveScan, getProjects, countSaved, deleteScan, findScan, read, write, getLastScan, setLastScan } = await import('../../src/js/lib/store.js');
const { normalizeScan } = await import('../../src/js/lib/normalize.js');

const scan = (url = 'https://a.it/') => normalizeScan({ url, title: 't', violations: [{ id: 'label', impact: 'serious', tags: [], nodeCount: 1, nodes: [{ target: 'input', html: '<input>' }] }], incomplete: [], passes: [] }, 'demo');

beforeEach(() => mem.clear());

test('save, find, count and delete scans per project', () => {
  const a = scan();
  assert.deepEqual(saveScan(a, { projectName: 'a.it' }).ok, true);
  assert.equal(saveScan(a, { projectName: 'a.it' }).already, true);
  saveScan(scan('https://b.it/'), { projectName: 'b.it' });
  assert.equal(countSaved(), 2);
  assert.equal(getProjects().length, 2);
  assert.equal(findScan(a.id).url, 'https://a.it/');
  deleteScan(a.id);
  assert.equal(countSaved(), 1);
  assert.equal(getProjects().length, 1);
});

test('the free plan limit is enforced', () => {
  for (let i = 0; i < 5; i++) assert.equal(saveScan(scan(), { maxSaved: 5 }).ok, true);
  assert.deepEqual(saveScan(scan(), { maxSaved: 5 }), { ok: false, reason: 'limit' });
});

test('corrupted storage never throws', () => {
  mem.set('varco:projects', '{not json');
  mem.set('varco:lastScan', '"string"');
  assert.deepEqual(getProjects(), []);
  assert.equal(getLastScan(), null);
  assert.equal(read('missing', 'fallback'), 'fallback');
  write('x', { a: 1 });
  assert.deepEqual(read('x'), { a: 1 });
});

test('last scan round-trips through storage', () => {
  const s = scan();
  setLastScan(s);
  assert.equal(getLastScan().id, s.id);
});

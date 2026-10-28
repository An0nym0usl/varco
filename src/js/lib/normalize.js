// Validates and normalises a scan coming from the bookmarklet, the sandboxed frame or an imported
// file. Everything here is untrusted input: types are checked, sizes capped, unknown fields dropped.
import { sortRules } from './axe-map.js';

export const LIMITS = { rules: 150, nodes: 50, text: 600, target: 300, title: 200, help: 300, passes: 300 };
const IMPACTS = ['critical', 'serious', 'moderate', 'minor'];
const RULE_ID = /^[a-z0-9-]{2,60}$/;
const TAG = /^[A-Za-z0-9.-]{1,40}$/;
const SOURCES = ['bookmarklet', 'demo', 'paste', 'url', 'import'];

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const int = (v, max) => (Number.isInteger(v) && v >= 0 ? Math.min(v, max) : 0);

function makeId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return `scan_${c.randomUUID()}`;
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normRule(r) {
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !RULE_ID.test(r.id)) return null;
  const tags = Array.isArray(r.tags) ? r.tags.filter((t) => typeof t === 'string' && TAG.test(t)).slice(0, 30) : [];
  const nodes = Array.isArray(r.nodes)
    ? r.nodes.slice(0, LIMITS.nodes).filter((n) => n && typeof n === 'object').map((n) => ({
      target: str(n.target, LIMITS.target),
      html: str(n.html, LIMITS.text),
      summary: str(n.summary, LIMITS.text),
    }))
    : [];
  const count = int(r.nodeCount, 100000);
  return {
    id: r.id,
    impact: IMPACTS.includes(r.impact) ? r.impact : 'minor',
    tags,
    help: str(r.help, LIMITS.help),
    nodes,
    nodeCount: Math.max(count, nodes.length),
  };
}

function normRules(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const item of list.slice(0, LIMITS.rules)) {
    const r = normRule(item);
    if (r && !seen.has(r.id)) { seen.add(r.id); out.push(r); }
  }
  return sortRules(out);
}

function normUrl(v) {
  if (typeof v !== 'string' || !v) return '';
  try {
    const u = new URL(v);
    return ['http:', 'https:'].includes(u.protocol) ? u.href.slice(0, 2000) : '';
  } catch {
    return '';
  }
}

function normDate(v) {
  const t = typeof v === 'string' ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
}

export function normalizeScan(input, source = 'import') {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Formato della scansione non valido');
  if (!Array.isArray(input.violations) || !Array.isArray(input.passes)) throw new TypeError('La scansione non contiene risultati di axe-core');
  const passes = [...new Set(input.passes.filter((id) => typeof id === 'string' && RULE_ID.test(id)))].slice(0, LIMITS.passes);
  return {
    v: 1,
    id: makeId(),
    source: SOURCES.includes(source) ? source : 'import',
    url: normUrl(input.url),
    title: str(input.title, LIMITS.title),
    scannedAt: normDate(input.scannedAt),
    engine: { name: 'axe-core', version: str(input.engineVersion, 20) },
    viewport: { w: int(input.viewport?.w, 20000), h: int(input.viewport?.h, 20000) },
    violations: normRules(input.violations),
    incomplete: normRules(input.incomplete),
    passes,
    inapplicable: int(input.inapplicable, 1000),
  };
}

// Re-validates a scan that was stored or exported by Varco itself (keeps id and source).
export function reviveScan(stored) {
  const scan = normalizeScan({ ...stored, engineVersion: stored?.engine?.version }, stored?.source);
  if (typeof stored?.id === 'string' && /^scan_[\w-]{4,80}$/.test(stored.id)) scan.id = stored.id;
  return scan;
}

export function summarize(scan) {
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  let elements = 0;
  for (const r of scan.violations) {
    byImpact[r.impact] += 1;
    elements += r.nodeCount;
  }
  return {
    rulesFailed: scan.violations.length,
    elements,
    byImpact,
    passed: scan.passes.length,
    review: scan.incomplete.length,
  };
}

// Smaller copy for localStorage: keeps every rule but only the first nodes of each.
export function shrinkScan(scan, maxNodes = 20) {
  const cut = (rules) => rules.map((r) => ({ ...r, nodes: r.nodes.slice(0, maxNodes) }));
  return { ...scan, violations: cut(scan.violations), incomplete: cut(scan.incomplete) };
}

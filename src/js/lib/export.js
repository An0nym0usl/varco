// CSV / JSON export and before/after comparison of two scans.
import { criteriaFromTags, enClausesFromTags, IMPACT } from './axe-map.js';

// Cells starting with = + - @ (or tab/CR) are prefixed so spreadsheets never run them as formulas.
export function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function scanToCsv(scan, titleFor = (r) => r.help) {
  const header = ['pagina', 'url', 'data', 'regola', 'problema', 'gravita', 'criteri_wcag', 'clausole_en301549', 'elementi', 'primo_selettore'];
  const rows = scan.violations.map((r) => [
    scan.title,
    scan.url,
    scan.scannedAt,
    r.id,
    titleFor(r),
    IMPACT[r.impact]?.label ?? r.impact,
    criteriaFromTags(r.tags).map((c) => `${c.sc} (${c.level})`).join(' '),
    enClausesFromTags(r.tags).map((c) => c.clause).join(' '),
    r.nodeCount,
    r.nodes[0]?.target ?? '',
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function scanToJson(scan) {
  return JSON.stringify({ format: 'varco-scan', version: 1, scan }, null, 2);
}

export function parseImport(text) {
  const data = JSON.parse(text);
  if (data && data.format === 'varco-scan' && data.scan) return data.scan;
  return data;
}

export function compareScans(before, after) {
  const map = (s) => new Map(s.violations.map((r) => [r.id, r.nodeCount]));
  const a = map(before);
  const b = map(after);
  const fixed = [...a.keys()].filter((id) => !b.has(id));
  const added = [...b.keys()].filter((id) => !a.has(id));
  const changed = [...b.keys()].filter((id) => a.has(id) && a.get(id) !== b.get(id)).map((id) => ({ id, before: a.get(id), after: b.get(id) }));
  const total = (m) => [...m.values()].reduce((n, x) => n + x, 0);
  return { fixed, added, changed, elementsBefore: total(a), elementsAfter: total(b) };
}

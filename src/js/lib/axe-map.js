// Turns axe-core rule tags into the references a report needs: WCAG criteria, level, version
// and EN 301 549 clauses. axe 4.14 tags rules with "EN-9.x.x.x" and marks v4-only clauses.
import WCAG from '../../data/wcag.it.js';

export const IMPACT = {
  critical: { label: 'Critico', rank: 0 },
  serious: { label: 'Grave', rank: 1 },
  moderate: { label: 'Moderato', rank: 2 },
  minor: { label: 'Lieve', rank: 3 },
};

export const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor'];

export function criteriaFromTags(tags = []) {
  const seen = new Set();
  const out = [];
  for (const tag of tags) {
    const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(tag);
    if (!m) continue;
    const sc = `${m[1]}.${m[2]}.${m[3]}`;
    if (seen.has(sc)) continue;
    seen.add(sc);
    const info = WCAG[sc];
    out.push({ sc, name: info ? info.n : '', level: info ? info.l : '', version: info ? info.v : '' });
  }
  return out.sort((a, b) => a.sc.localeCompare(b.sc, 'en', { numeric: true }));
}

export function enClausesFromTags(tags = []) {
  const v4Only = tags.includes('EN-301-549v4');
  return tags
    .filter((t) => /^EN-9(\.\d+){3}$/.test(t))
    .map((t) => ({ clause: t.slice(3), v4Only }));
}

export function isBestPractice(tags = []) {
  return tags.includes('best-practice') && criteriaFromTags(tags).length === 0;
}

// Principle of the first criterion (1 Percepibile … 4 Robusto) or null for best practices.
export const PRINCIPLES = {
  1: 'Percepibile',
  2: 'Utilizzabile',
  3: 'Comprensibile',
  4: 'Robusto',
};

export function principleOf(tags = []) {
  const c = criteriaFromTags(tags)[0];
  return c ? Number(c.sc[0]) : null;
}

export function sortRules(rules) {
  return [...rules].sort((a, b) =>
    (IMPACT[a.impact]?.rank ?? 9) - (IMPACT[b.impact]?.rank ?? 9) || b.nodeCount - a.nodeCount || a.id.localeCompare(b.id));
}

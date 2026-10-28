// "Inserisci l'indirizzo": scans a public URL through Google PageSpeed Insights, whose Lighthouse
// accessibility audits run axe-core on Google's servers. Needs a referrer-restricted API key
// (config.psi.apiKey); keyless calls hit an exhausted shared quota (HTTP 429, tested 2026-10-28).
// Lighthouse returns pass/fail per rule but no impact, so severity comes from axe's usual impact per rule.
import { normalizeScan } from './normalize.js';
import AXE_TAGS from '../../data/axe-tags.js';

export const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

const CRITICAL = ['image-alt', 'label', 'button-name', 'input-button-name', 'input-image-alt', 'area-alt', 'aria-hidden-body', 'aria-required-attr',
  'aria-required-children', 'aria-required-parent', 'aria-roles', 'aria-valid-attr', 'aria-valid-attr-value', 'aria-allowed-attr', 'meta-viewport',
  'select-name', 'duplicate-id-aria', 'video-caption', 'audio-caption', 'meta-refresh'];
const MODERATE = ['heading-order', 'region', 'page-has-heading-one', 'skip-link', 'scope-attr-valid', 'form-field-multiple-labels', 'html-xml-lang-mismatch',
  'no-autoplay-audio', 'landmark-one-main', 'landmark-unique', 'landmark-no-duplicate-main', 'landmark-no-duplicate-banner', 'landmark-no-duplicate-contentinfo',
  'landmark-banner-is-top-level', 'landmark-contentinfo-is-top-level', 'landmark-main-is-top-level', 'landmark-complementary-is-top-level'];
const MINOR = ['empty-heading', 'image-redundant-alt', 'empty-table-header', 'table-duplicate-name', 'aria-allowed-role', 'presentation-role-conflict',
  'aria-deprecated-role', 'server-side-image-map', 'meta-viewport-large'];

export function impactOf(ruleId) {
  if (CRITICAL.includes(ruleId)) return 'critical';
  if (MODERATE.includes(ruleId)) return 'moderate';
  if (MINOR.includes(ruleId)) return 'minor';
  return 'serious';
}

export function psiRequestUrl(pageUrl, key, strategy = 'desktop') {
  const q = new URLSearchParams({ url: pageUrl, category: 'ACCESSIBILITY', strategy: strategy.toUpperCase(), locale: 'it', key });
  return `${ENDPOINT}?${q}`;
}

// Converts a Lighthouse result into the raw scan shape accepted by normalizeScan.
export function scanFromLighthouse(lhr) {
  const cat = lhr?.categories?.accessibility;
  if (!cat || !Array.isArray(cat.auditRefs) || !lhr.audits) throw new TypeError('Risposta di PageSpeed senza risultati di accessibilità');
  const violations = [];
  const passes = [];
  let inapplicable = 0;
  for (const ref of cat.auditRefs) {
    const audit = lhr.audits[ref.id];
    if (!audit) continue;
    if (audit.scoreDisplayMode === 'notApplicable') { inapplicable += 1; continue; }
    if (audit.scoreDisplayMode === 'manual' || audit.scoreDisplayMode === 'informative') continue;
    if (audit.score === 1) { passes.push(ref.id); continue; }
    if (audit.score !== 0) continue;
    const items = Array.isArray(audit.details?.items) ? audit.details.items : [];
    violations.push({
      id: ref.id,
      impact: impactOf(ref.id),
      tags: AXE_TAGS[ref.id] ?? [],
      help: String(audit.title ?? ''),
      nodeCount: items.length,
      nodes: items.slice(0, 50).map((it) => ({ target: it.node?.selector ?? '', html: it.node?.snippet ?? '', summary: it.node?.explanation ?? '' })),
    });
  }
  const url = lhr.finalDisplayedUrl || lhr.finalUrl || lhr.requestedUrl || '';
  let title = '';
  try { title = new URL(url).hostname; } catch { title = ''; }
  return {
    url, title, scannedAt: lhr.fetchTime, engineVersion: `Lighthouse ${lhr.lighthouseVersion ?? ''}`.trim(),
    viewport: { w: lhr.configSettings?.screenEmulation?.width ?? 0, h: lhr.configSettings?.screenEmulation?.height ?? 0 },
    violations, incomplete: [], passes, inapplicable,
  };
}

export const PSI_ERRORS = {
  invalid_url: "Scrivi l'indirizzo completo di una pagina pubblica, per esempio https://www.esempio.it/",
  quota: 'Il servizio di analisi per indirizzo ha raggiunto il limite di oggi. Usa il pulsante Varco: funziona sempre ed è più completo.',
  unreachable: 'Google non è riuscito ad aprire la pagina (indirizzo errato, sito non raggiungibile o protetto da accesso). Controlla l\'indirizzo o usa il pulsante Varco.',
  network: 'Connessione non riuscita. Controlla la rete e riprova.',
  failed: "L'analisi non è riuscita. Riprova o usa il pulsante Varco.",
};

export async function scanUrl(pageUrl, key, { strategy = 'desktop', fetchImpl = globalThis.fetch } = {}) {
  let target;
  try { target = new URL(pageUrl); } catch { return { ok: false, reason: 'invalid_url' }; }
  if (!['http:', 'https:'].includes(target.protocol) || /^(localhost|127\.|10\.|192\.168\.)/.test(target.hostname)) return { ok: false, reason: 'invalid_url' };
  let res;
  try { res = await fetchImpl(psiRequestUrl(target.href, key, strategy)); } catch { return { ok: false, reason: 'network' }; }
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (res.status === 429) return { ok: false, reason: 'quota' };
  if (!res.ok) return { ok: false, reason: res.status === 400 || res.status === 500 ? 'unreachable' : 'failed' };
  try {
    return { ok: true, scan: normalizeScan(scanFromLighthouse(data?.lighthouseResult), 'url') };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

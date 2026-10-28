// Renders a normalised scan as HTML. Every value from the scan passes through html`` escaping.
import { html, safeUrl } from './escape.js';
import { IMPACT, IMPACT_ORDER, criteriaFromTags, enClausesFromTags } from './axe-map.js';
import { summarize } from './normalize.js';
import RULES from '../../data/rules.it.js';

const PLATFORMS = { wordpress: 'WordPress', shopify: 'Shopify', wix: 'Wix' };
export const SOURCE_LABEL = { bookmarklet: 'Pulsante Varco', demo: 'Negozio di esempio', paste: 'Codice HTML incollato', import: 'Risultati importati' };

export const ruleTitle = (rule) => RULES[rule.id]?.t ?? rule.help ?? rule.id;

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function countsHtml(scan) {
  const s = summarize(scan);
  return html`<ul class="counts" aria-label="Tipi di problema per gravità">
    ${IMPACT_ORDER.map((k) => html`<li><b>${s.byImpact[k]}</b><span class="sev sev--${k}">${IMPACT[k].label}</span></li>`)}
  </ul>`;
}

export function summaryText(scan) {
  const s = summarize(scan);
  if (!s.rulesFailed) return `Nessun problema rilevato automaticamente. ${plural(s.passed, 'regola superata', 'regole superate')}, ${plural(s.review, 'punto', 'punti')} da verificare a mano.`;
  return `${plural(s.rulesFailed, 'tipo di problema', 'tipi di problema')} su ${plural(s.elements, 'elemento', 'elementi')}. ${plural(s.passed, 'regola superata', 'regole superate')}, ${plural(s.review, 'punto', 'punti')} da verificare a mano.`;
}

function refsHtml(rule) {
  const criteria = criteriaFromTags(rule.tags);
  const clauses = enClausesFromTags(rule.tags);
  return html`<p class="refs">
    ${criteria.map((c) => html`<span class="chip chip--quiet">WCAG ${c.sc} ${c.name} (${c.level}${c.version === '2.2' ? ', WCAG 2.2' : ''})</span>`)}
    ${clauses.map((c) => html`<span class="chip chip--quiet">EN 301 549 ${c.clause}${c.v4Only ? ' (v4)' : ''}</span>`)}
    ${criteria.length ? '' : html`<span class="chip chip--quiet">Buona pratica</span>`}
  </p>`;
}

function nodesHtml(rule, label) {
  if (!rule.nodes.length) return '';
  return html`<details class="disclosure nodes"><summary>${label} (${rule.nodeCount})</summary>
    <ul class="node-list">${rule.nodes.map((n) => html`<li>
      ${n.target ? html`<div class="node-target">${n.target}</div>` : ''}
      ${n.html ? html`<pre class="snippet"><code>${n.html}</code></pre>` : ''}
      ${n.summary ? html`<p class="hint">${n.summary}</p>` : ''}
    </li>`)}</ul>
    ${rule.nodeCount > rule.nodes.length ? html`<p class="hint">Mostrati ${rule.nodes.length} elementi su ${rule.nodeCount}.</p>` : ''}
  </details>`;
}

export function issueHtml(rule, base) {
  const info = RULES[rule.id];
  return html`<article class="issue issue--${rule.impact}" id="r-${rule.id}">
    <div class="issue-head">
      <h3>${ruleTitle(rule)}</h3>
      <span class="sev sev--${rule.impact}">${IMPACT[rule.impact].label}</span>
      <span class="chip chip--quiet">${plural(rule.nodeCount, 'elemento', 'elementi')}</span>
    </div>
    ${info ? html`<p class="issue-who"><strong>Chi è penalizzato:</strong> ${info.w}</p><p>${info.y}</p>` : html`<p>${rule.help}</p>`}
    ${refsHtml(rule)}
    ${info ? html`<h4>Come risolvere</h4><ol class="fix-list">${info.f.map((s) => html`<li>${s}</li>`)}</ol>` : ''}
    ${info?.e ? html`<details class="disclosure"><summary>Esempio di codice</summary><div class="code-compare">
      <figure><figcaption>Da evitare</figcaption><pre class="snippet"><code>${info.e.bad}</code></pre></figure>
      <figure><figcaption>Corretto</figcaption><pre class="snippet"><code>${info.e.good}</code></pre></figure>
    </div></details>` : ''}
    ${info?.p ? html`<details class="disclosure"><summary>Su WordPress, Shopify e Wix</summary><dl class="platform-list">
      ${Object.entries(info.p).map(([k, v]) => html`<div><dt>${PLATFORMS[k]}</dt><dd>${v}</dd></div>`)}
    </dl></details>` : ''}
    ${nodesHtml(rule, 'Elementi coinvolti')}
    ${info ? html`<p class="no-print"><a href="${base}/regole/${rule.id}/">Guida completa: ${info.t}</a></p>` : ''}
  </article>`;
}

export function coverHtml(scan, branding, base) {
  const logo = branding?.logo && /^data:image\/(png|jpeg|webp|gif);base64,/.test(branding.logo) ? branding.logo : '';
  const by = branding?.agency || 'Varco';
  return html`<div class="print-only print-cover">
    <div class="cover-row">
      ${logo ? html`<img src="${logo}" alt="${by}">` : html`<strong>${by}</strong>`}
      <span>Report di accessibilità</span>
    </div>
    ${branding?.client ? html`<p>Cliente: ${branding.client}</p>` : ''}
  </div>`;
}

export function reportHtml(scan, { base, branding, dateText }) {
  const url = safeUrl(scan.url);
  const groups = IMPACT_ORDER.map((k) => [k, scan.violations.filter((r) => r.impact === k)]).filter(([, list]) => list.length);
  return html`
    ${coverHtml(scan, branding, base)}
    <div class="report-meta">
      ${url ? html`<span>Pagina: <a href="${url}">${url}</a></span>` : ''}
      <span>Analisi: ${dateText}</span>
      <span>Metodo: ${SOURCE_LABEL[scan.source] ?? scan.source}</span>
      ${scan.engine.version ? html`<span>Motore: axe-core ${scan.engine.version}</span>` : ''}
    </div>
    ${countsHtml(scan)}
    <div class="toolbar no-print" data-toolbar>
      <button class="button button--primary" type="button" data-action="save">Salva nel progetto</button>
      <button class="button" type="button" data-action="print">Stampa o salva in PDF</button>
      <button class="button" type="button" data-action="csv">Esporta CSV</button>
      <button class="button" type="button" data-action="json">Esporta JSON</button>
      <a class="button" href="${base}/dichiarazione/">Crea le informazioni di accessibilità</a>
    </div>
    <p class="scan-status no-print" role="status" data-action-status></p>
    <div data-branding-slot class="no-print"></div>
    <div data-compare-slot class="no-print"></div>
    ${groups.length ? html`<section class="report-section" aria-labelledby="problemi">
      <h2 id="problemi">Problemi da correggere</h2>
      ${groups.map(([k, list]) => html`<h3 class="visually-hidden">Gravità: ${IMPACT[k].label}</h3>${list.map((r) => issueHtml(r, base))}`)}
    </section>` : html`<section class="report-section card"><h2>Nessun problema rilevato automaticamente</h2><p>Ottimo punto di partenza. Ricorda che i test automatici coprono solo una parte dei requisiti: prosegui con la <a href="${base}/checklist/">checklist manuale</a>.</p></section>`}
    ${scan.incomplete.length ? html`<section class="report-section" aria-labelledby="da-verificare">
      <h2 id="da-verificare">Da verificare a mano</h2>
      <p>Per questi punti axe-core non può decidere da solo (per esempio il contrasto di un testo su un'immagine). Controllali tu.</p>
      ${scan.incomplete.map((r) => html`<article class="issue"><div class="issue-head"><h3>${ruleTitle(r)}</h3><span class="chip chip--quiet">${plural(r.nodeCount, 'elemento', 'elementi')}</span></div>${refsHtml(r)}${nodesHtml(r, 'Elementi da controllare')}</article>`)}
    </section>` : ''}
    <section class="report-section" aria-labelledby="superate">
      <h2 id="superate">Regole superate</h2>
      <details class="disclosure"><summary>${plural(scan.passes.length, 'regola superata', 'regole superate')}</summary>
        <ul class="passed-list">${scan.passes.map((id) => html`<li>${RULES[id]?.t ?? id}</li>`)}</ul>
      </details>
    </section>
    <section class="report-section" aria-labelledby="metodo">
      <h2 id="metodo">Metodo e limiti</h2>
      <p>Analisi automatica eseguita con axe-core sulle regole WCAG 2.0, 2.1 e 2.2 di livello A e AA e sulle buone pratiche; ogni regola indica il criterio WCAG e la clausola della norma EN 301 549. I test automatici rilevano solo una parte dei problemi di accessibilità: completa i controlli della <a href="${base}/checklist/">checklist manuale</a>. I contenuti dentro iframe non sono analizzati.${scan.source === 'paste' ? ' Analisi del codice HTML incollato: script e contenuti generati da JavaScript sono esclusi.' : ''}</p>
      <p>Questo report non certifica la conformità e non costituisce consulenza legale.</p>
    </section>`;
}

import { html } from '../js/lib/escape.js';
import { criteriaFromTags, enClausesFromTags, PRINCIPLES, principleOf } from '../js/lib/axe-map.js';

const PLATFORMS = { wordpress: 'WordPress', shopify: 'Shopify', wix: 'Wix' };

export default (ctx) => {
  const ids = Object.keys(ctx.rules).filter((id) => ctx.axeRules[id]).sort((a, b) => ctx.rules[a].t.localeCompare(ctx.rules[b].t, 'it'));
  const groupOf = (id) => principleOf(ctx.axeRules[id]) ?? 0;
  const groups = [1, 2, 3, 4, 0].map((g) => [g, ids.filter((id) => groupOf(id) === g)]).filter(([, list]) => list.length);

  const index = {
    path: '/regole/',
    nav: 'guida',
    title: 'Regole di accessibilità spiegate in italiano',
    description: `Le ${ids.length} regole di accessibilità controllate da Varco, con i criteri WCAG, la norma EN 301 549 e le istruzioni per correggerle su WordPress, Shopify e Wix.`,
    body: html`
<div class="wrap page-head">
  <p class="eyebrow">Regole</p>
  <h1>Regole di accessibilità spiegate in italiano</h1>
  <p class="lead">Ogni problema che Varco può trovare, con chi penalizza, perché conta e come risolverlo. Le regole sono raggruppate secondo i quattro principi delle WCAG.</p>
</div>
<div class="wrap rule-index">
  ${groups.map(([g, list]) => html`<section aria-labelledby="principio-${g}">
    <h2 id="principio-${g}">${g ? `${g}. ${PRINCIPLES[g]}` : 'Buone pratiche'}</h2>
    <ul class="rule-list">${list.map((id) => html`<li><a href="${ctx.url(`/regole/${id}/`)}">${ctx.rules[id].t}</a></li>`)}</ul>
  </section>`)}
</div>
`,
  };

  const pages = ids.map((id) => {
    const r = ctx.rules[id];
    const tags = ctx.axeRules[id];
    const criteria = criteriaFromTags(tags);
    const clauses = enClausesFromTags(tags);
    return {
      path: `/regole/${id}/`,
      nav: 'guida',
      title: r.t,
      description: `${r.t}: ${r.y}`.slice(0, 158),
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'TechArticle', inLanguage: 'it', headline: r.t, about: criteria.map((c) => `WCAG ${c.sc}`), mainEntityOfPage: ctx.abs(`/regole/${id}/`) }],
      body: html`
<article class="wrap rule-page">
  <p class="eyebrow"><a href="${ctx.url('/regole/')}">Regole</a> · ${criteria.length ? `WCAG ${criteria.map((c) => c.sc).join(', ')}` : 'Buona pratica'}</p>
  <h1>${r.t}</h1>
  <p class="lead">${r.y}</p>
  <dl class="meta-list card">
    <div><dt>Chi è penalizzato</dt><dd>${r.w}</dd></div>
    <div><dt>Criteri WCAG</dt><dd>${criteria.length ? criteria.map((c) => html`<span class="chip chip--quiet">${c.sc} ${c.name} · livello ${c.level}${c.version === '2.2' ? ' · WCAG 2.2' : ''}</span>`) : 'Nessuno: è una buona pratica che aiuta a rispettare i criteri.'}</dd></div>
    <div><dt>Norma EN 301 549</dt><dd>${clauses.length ? clauses.map((c) => html`<span class="chip chip--quiet">${c.clause}${c.v4Only ? ' (versione 4, in preparazione)' : ''}</span>`) : 'Non applicabile'}</dd></div>
    <div><dt>Regola axe-core</dt><dd><code>${id}</code></dd></div>
  </dl>
  <h2>Come risolvere</h2>
  <ol class="fix-list">${r.f.map((s) => html`<li>${s}</li>`)}</ol>
  ${r.e ? html`<h2>Esempio</h2>
  <div class="code-compare">
    <figure><figcaption>Da evitare</figcaption><pre><code>${r.e.bad}</code></pre></figure>
    <figure><figcaption>Corretto</figcaption><pre><code>${r.e.good}</code></pre></figure>
  </div>` : ''}
  ${r.p ? html`<h2>Su WordPress, Shopify e Wix</h2>
  <dl class="platform-list">${Object.entries(r.p).map(([k, v]) => html`<div><dt>${PLATFORMS[k]}</dt><dd>${v}</dd></div>`)}</dl>
  <p class="hint">I nomi dei menu possono cambiare in base al tema e alla versione.</p>` : ''}
  <aside class="cta-card">
    <h2>Il tuo sito ha questo problema?</h2>
    <p>Scoprilo in pochi secondi, gratis, con il pulsante Varco.</p>
    <a class="button button--primary" href="${ctx.url('/verifica/')}">Verifica una pagina</a>
  </aside>
</article>
`,
    };
  });
  return [index, ...pages];
};

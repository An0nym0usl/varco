import { html } from '../js/lib/escape.js';

export default (ctx) => {
  const groups = [...new Set(ctx.checklist.map((c) => c.g))];
  const states = [['ok', 'Superato'], ['ko', 'Non superato'], ['na', 'Non applicabile']];
  return {
    path: '/checklist/',
    nav: 'checklist',
    title: 'Checklist manuale di accessibilità',
    description: `${ctx.checklist.length} controlli di accessibilità da fare a mano, spiegati in italiano: tastiera, zoom, sottotitoli, moduli, percorso di acquisto. Con i criteri WCAG di riferimento.`,
    scripts: ['js/pages/checklist.js'],
    body: html`
<div class="wrap page-head">
  <p class="eyebrow">Controlli manuali</p>
  <h1>Checklist manuale di accessibilità</h1>
  <p class="lead">I test automatici non sanno se il sito si usa con la tastiera, se un testo alternativo è utile o se i sottotitoli sono corretti. Questi ${ctx.checklist.length} controlli sì, e richiedono pochi minuti ciascuno. I risultati restano nel tuo browser e finiscono nelle informazioni di accessibilità.</p>
  <p class="progress" data-checklist-progress role="status"></p>
</div>

<form class="wrap checklist" data-checklist>
  ${groups.map((g) => html`<section class="check-group" aria-labelledby="g-${g.toLowerCase().replace(/\W+/g, '-')}">
    <h2 id="g-${g.toLowerCase().replace(/\W+/g, '-')}">${g}</h2>
    ${ctx.checklist.filter((c) => c.g === g).map((c) => html`<fieldset class="check card" data-check="${c.id}">
      <legend>${c.t}</legend>
      <p class="check-why">${c.why}</p>
      <details class="disclosure"><summary>Come verificarlo</summary><p>${c.how}</p>
        ${c.sc.length ? html`<p class="check-sc">Criteri WCAG: ${c.sc.map((s) => html`<span class="chip chip--quiet">${s} ${ctx.wcag[s] ? ctx.wcag[s].n : ''}</span>`)}</p>` : ''}
      </details>
      <div class="check-states">
        ${states.map(([v, l]) => html`<label class="choice choice--inline"><input type="radio" name="${c.id}" value="${v}"> <span>${l}</span></label>`)}
      </div>
    </fieldset>`)}
  </section>`)}
  <div class="form-actions">
    <a class="button button--primary" href="${ctx.url('/dichiarazione/')}">Crea le informazioni di accessibilità</a>
    <button class="button" type="button" data-checklist-reset>Azzera la checklist</button>
  </div>
</form>
`,
  };
};

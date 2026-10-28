import { html, safeUrl } from '../js/lib/escape.js';
import { PLAN_NAMES } from '../js/lib/plan.js';

// Intermediate pages /acquista/<piano>/: they exist so that analytics can count checkout starts
// as page views before the visitor is sent to Polar.
export default (ctx) => ['pro', 'agenzia'].map((plan) => {
  const target = safeUrl(ctx.config.payments.checkout[plan]);
  return {
    path: `/acquista/${plan}/`,
    nav: 'prezzi',
    title: `Acquista il piano ${PLAN_NAMES[plan]}`,
    description: `Pagamento del piano ${PLAN_NAMES[plan]} di Varco tramite Polar.`,
    noindex: true,
    scripts: ['js/pages/acquista.js'],
    body: html`
<div class="wrap page-head narrow">
  <p class="eyebrow">Pagamento</p>
  <h1>Piano ${PLAN_NAMES[plan]}</h1>
  ${target
    ? html`<p class="lead" data-checkout="${target}">Ti stiamo portando alla pagina di pagamento sicuro di Polar…</p>
<p><a class="button button--primary" href="${target}">Vai al pagamento</a></p>`
    : html`<p class="lead">Gli acquisti non sono ancora attivi. Tutte le funzioni gratuite restano disponibili.</p>
<p><a class="button" href="${ctx.url('/prezzi/')}">Torna ai prezzi</a></p>`}
</div>
`,
  };
});

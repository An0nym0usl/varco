import { html } from '../js/lib/escape.js';

export default (ctx) => ({
  path: '/grazie/',
  nav: 'prezzi',
  title: "Grazie per l'acquisto",
  description: "Conferma dell'acquisto di Varco.",
  noindex: true,
  body: html`
<div class="wrap page-head narrow">
  <p class="eyebrow">Acquisto completato</p>
  <h1>Grazie, il tuo piano è quasi pronto</h1>
  <p class="lead">Polar ti ha inviato una email con la ricevuta e la chiave di licenza.</p>
</div>
<div class="wrap narrow">
  <ol class="steps">
    <li><p>Apri l'email di Polar (controlla anche lo spam) e copia la chiave di licenza.</p></li>
    <li><p>Incollala nella pagina di attivazione.</p></li>
  </ol>
  <p><a class="button button--primary" href="${ctx.url('/licenza/')}">Attiva la licenza</a></p>
  <p class="hint">Problemi con il pagamento o la chiave? Rispondi all'email di Polar o scrivici: ti aiutiamo entro un giorno lavorativo.</p>
</div>
`,
});

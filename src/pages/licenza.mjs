import { html } from '../js/lib/escape.js';

export default (ctx) => ({
  path: '/licenza/',
  nav: 'prezzi',
  title: 'Attiva la licenza',
  description: 'Attiva il piano Pro o Agenzia di Varco con la chiave di licenza ricevuta via email.',
  noindex: true,
  scripts: ['js/pages/licenza.js'],
  body: html`
<div class="wrap page-head narrow">
  <p class="eyebrow">Licenza</p>
  <h1>Attiva la licenza</h1>
  <p class="lead">Incolla la chiave che hai ricevuto via email dopo l'acquisto. La verifichiamo con Polar e attiviamo il piano in questo browser.</p>
</div>
<div class="wrap narrow">
  <div class="card current-plan" data-current-plan></div>
  <form class="card" data-license-form novalidate>
    <label for="license-key">Chiave di licenza</label>
    <input id="license-key" name="key" autocomplete="off" spellcheck="false" aria-describedby="license-msg">
    <p class="field-error" id="license-msg" role="alert" data-license-msg></p>
    <p><button class="button button--primary" type="submit">Attiva</button></p>
  </form>
  <p><button class="button" type="button" data-license-remove hidden>Rimuovi la licenza da questo browser</button></p>
  <p class="hint">Non hai ancora una licenza? <a href="${ctx.url('/prezzi/')}">Guarda i piani</a>.</p>
</div>
`,
});

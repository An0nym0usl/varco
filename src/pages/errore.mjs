import { html } from '../js/lib/escape.js';

export default (ctx) => ({
  path: '/404.html',
  title: 'Pagina non trovata',
  description: 'La pagina richiesta non esiste.',
  noindex: true,
  body: html`
<div class="wrap page-head narrow">
  <p class="eyebrow">Errore 404</p>
  <h1>Questa pagina non esiste</h1>
  <p class="lead">Il link potrebbe essere sbagliato o la pagina è stata spostata.</p>
  <div class="cta-row">
    <a class="button button--primary" href="${ctx.url('/')}">Vai alla pagina iniziale</a>
    <a class="button" href="${ctx.url('/verifica/')}">Verifica una pagina</a>
  </div>
</div>
`,
});

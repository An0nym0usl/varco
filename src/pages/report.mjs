import { html } from '../js/lib/escape.js';

export default (ctx) => ({
  path: '/report/',
  nav: 'verifica',
  title: 'Report di accessibilità',
  description: 'Il report della tua analisi di accessibilità: problemi per gravità, criteri WCAG, clausole EN 301 549 e come risolverli.',
  scripts: ['js/pages/report.js'],
  noindex: true,
  body: html`
<div class="wrap page-head report-head">
  <p class="eyebrow">Report</p>
  <h1 data-report-title>Report di accessibilità</h1>
  <p class="lead" data-report-lead>Qui trovi i risultati delle tue analisi.</p>
</div>

<div class="wrap">
  <p class="scan-status" role="status" data-report-status></p>
  <div class="empty card" data-report-empty hidden>
    <h2>Nessun report aperto</h2>
    <p>Analizza una pagina per vedere qui i risultati, apri un report salvato oppure importa un file.</p>
    <p><a class="button button--primary" href="${ctx.url('/verifica/')}">Verifica una pagina</a></p>
  </div>
  <div data-report-body></div>
</div>

<section class="wrap section no-print" aria-labelledby="salvati-title">
  <h2 id="salvati-title">Report salvati in questo browser</h2>
  <div data-projects></div>
  <details class="disclosure">
    <summary>Importa risultati</summary>
    <form data-import-form>
      <label for="import-text">Incolla i risultati copiati dal pulsante Varco o il contenuto di un file .json esportato</label>
      <textarea id="import-text" name="text" rows="4" spellcheck="false"></textarea>
      <label for="import-file">Oppure scegli un file</label>
      <input id="import-file" name="file" type="file" accept="application/json,.json">
      <p><button class="button" type="submit">Importa</button></p>
    </form>
  </details>
</section>
`,
});

import { html } from '../js/lib/escape.js';
import { logo } from '../layout.mjs';

export default (ctx) => ({
  path: '/verifica/',
  nav: 'verifica',
  title: 'Verifica l\'accessibilità di una pagina',
  description: "Analizza gratis l'accessibilità di qualsiasi pagina del tuo sito, anche carrello e checkout, con il pulsante Varco. WCAG 2.2 ed EN 301 549, risultati in italiano.",
  scripts: ['js/pages/verifica.js'],
  body: html`
<div class="wrap page-head">
  <p class="eyebrow">Strumento gratuito</p>
  <h1>Verifica una pagina</h1>
  <p class="lead">Scegli come analizzare la pagina. In tutti i casi il controllo avviene nel tuo browser con axe-core, il motore open source usato anche da Google Lighthouse.</p>
</div>

<div class="wrap method-grid">
  <section class="card method method--main" aria-labelledby="metodo-pulsante">
    <h2 id="metodo-pulsante">Con il pulsante Varco <span class="badge">Consigliato</span></h2>
    <p>Funziona su qualsiasi pagina che apri, anche dopo l'accesso: carrello, checkout, area clienti. Serve un browser per computer (Chrome, Edge, Firefox o Safari); da smartphone usa l'analisi del codice HTML.</p>
    <ol class="steps">
      <li>
        <p>Trascina questo pulsante nella barra dei preferiti del browser:</p>
        <p class="bookmarklet-wrap"><a class="bookmarklet" href="${ctx.bookmarklet}" data-bookmarklet>${logo('logo logo--small')}Varco</a></p>
        <p class="hint">Non vedi la barra dei preferiti? Premi Ctrl+Maiusc+B (su Mac Cmd+Maiusc+B).</p>
      </li>
      <li><p>Apri la pagina del tuo sito che vuoi controllare.</p></li>
      <li><p>Clicca «Varco» tra i preferiti: compare un pannello con i risultati e il pulsante per aprire il report completo.</p></li>
    </ol>
    <p class="hint" role="status" data-bookmarklet-hint></p>
    <details class="disclosure">
      <summary>Non puoi trascinare? Crea il preferito a mano</summary>
      <ol>
        <li>Copia il codice: <button class="button button--small" type="button" data-copy-bookmarklet>Copia il codice</button></li>
        <li>Crea un nuovo preferito (Ctrl+D, o dal menu dei preferiti), chiamalo «Varco» e incolla il codice nel campo dell'indirizzo.</li>
      </ol>
      <label for="codice-pulsante">Codice del pulsante</label>
      <textarea id="codice-pulsante" readonly rows="3">${ctx.bookmarklet}</textarea>
    </details>
    <p class="note">Se un sito blocca gli script esterni il pulsante te lo segnala: in quel caso usa l'analisi del codice HTML.</p>
  </section>

  <section class="card method" aria-labelledby="metodo-demo">
    <h2 id="metodo-demo">Prova sul negozio di esempio</h2>
    <p>Un e-commerce di prova, creato apposta con errori di accessibilità. Utile per vedere il report prima di analizzare il tuo sito.</p>
    <button class="button button--primary" type="button" data-demo-run>Analizza il negozio di prova</button>
  </section>

  <section class="card method" aria-labelledby="metodo-codice">
    <h2 id="metodo-codice">Incolla il codice HTML</h2>
    <form data-paste-form novalidate>
      <label for="paste-url">Indirizzo della pagina <span class="optional">(consigliato: serve a caricare stili e immagini)</span></label>
      <input id="paste-url" name="url" type="url" inputmode="url" placeholder="https://www.esempio.it/prodotto" autocomplete="url" aria-describedby="paste-url-err">
      <p class="field-error" id="paste-url-err" data-error-for="url"></p>
      <label for="paste-html">Codice HTML della pagina</label>
      <textarea id="paste-html" name="html" rows="7" aria-describedby="paste-help paste-html-err" spellcheck="false"></textarea>
      <p class="field-error" id="paste-html-err" data-error-for="html"></p>
      <p id="paste-help" class="hint">Nel browser: tasto destro sulla pagina → «Visualizza sorgente pagina», seleziona tutto e copia. Gli script vengono rimossi prima dell'analisi; per le pagine costruite con JavaScript usa il pulsante Varco.</p>
      <button class="button button--primary" type="submit">Analizza il codice</button>
    </form>
  </section>
</div>

<div class="wrap scan-area">
  <p class="scan-status" role="status" data-scan-status></p>
  <div class="scan-stage" data-scan-stage></div>
</div>
`,
});

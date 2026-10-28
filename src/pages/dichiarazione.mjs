import { html } from '../js/lib/escape.js';

const field = (id, label, input, hint = '') => html`<div class="field">
  <label for="${id}">${label}</label>
  ${hint ? html`<p class="hint" id="${id}-hint">${hint}</p>` : ''}
  ${input}
</div>`;

export default (ctx) => ({
  path: '/dichiarazione/',
  nav: 'dichiarazione',
  title: "Generatore delle informazioni di accessibilità (dichiarazione EAA)",
  description: "Crea gratis le informazioni sull'accessibilità del servizio richieste dall'European Accessibility Act (art. 13 e Allegato V): descrizione, conformità, limitazioni, contatti. In italiano.",
  scripts: ['js/pages/dichiarazione.js'],
  body: html`
<div class="wrap page-head">
  <p class="eyebrow">Generatore</p>
  <h1>Informazioni sull'accessibilità del servizio</h1>
  <p class="lead">L'EAA chiede ai fornitori di servizi di spiegare, nelle condizioni generali o in un documento equivalente, come il servizio soddisfa i requisiti di accessibilità (art. 13 e Allegato V della Direttiva 2019/882). Compila i campi: il testo si aggiorna mentre scrivi.</p>
</div>

<div class="wrap statement-layout">
  <form class="card statement-form" data-statement-form novalidate>
    <fieldset>
      <legend>Chi fornisce il servizio</legend>
      ${field('azienda', 'Ragione sociale', html`<input id="azienda" name="azienda" autocomplete="organization">`)}
      ${field('servizio', 'Nome del servizio', html`<input id="servizio" name="servizio" placeholder="Il negozio online Bottega Rossi" aria-describedby="servizio-hint">`, 'Come lo chiamerebbero i tuoi clienti.')}
      ${field('sito', 'Indirizzo del sito', html`<input id="sito" name="sito" type="url" inputmode="url" placeholder="https://www.esempio.it" autocomplete="url">`)}
    </fieldset>
    <fieldset>
      <legend>Il servizio</legend>
      ${field('descrizione', 'Descrizione generale', html`<textarea id="descrizione" name="descrizione" rows="3" aria-describedby="descrizione-hint"></textarea>`, 'Allegato V, lettera a. Es.: «Vendiamo online calzature e accessori in pelle con consegna in tutta Italia.»')}
      ${field('funzionamento', 'Come funziona', html`<textarea id="funzionamento" name="funzionamento" rows="3" aria-describedby="funzionamento-hint"></textarea>`, 'Allegato V, lettera b. I passaggi principali: ricerca, scelta, carrello, pagamento, consegna, assistenza.')}
    </fieldset>
    <fieldset>
      <legend>Stato di conformità</legend>
      <p class="hint" data-status-suggestion></p>
      <label class="choice"><input type="radio" name="stato" value="conforme"> <span>Conforme</span></label>
      <label class="choice"><input type="radio" name="stato" value="parziale" checked> <span>Parzialmente conforme</span></label>
      <label class="choice"><input type="radio" name="stato" value="non-conforme"> <span>Non conforme</span></label>
      ${field('misure', 'Misure adottate', html`<textarea id="misure" name="misure" rows="3" aria-describedby="misure-hint"></textarea>`, 'Allegato V, lettera c. Cosa avete fatto per rendere accessibile il servizio (correzioni, formazione, verifiche periodiche).')}
    </fieldset>
    <fieldset>
      <legend>Limitazioni note</legend>
      <div data-known-issues><p class="hint">Analizza e salva almeno una pagina per importare qui i problemi trovati.</p></div>
      ${field('altri-problemi', 'Altre limitazioni (una per riga)', html`<textarea id="altri-problemi" name="altriProblemi" rows="3"></textarea>`)}
      ${field('alternative', 'Alternative accessibili', html`<textarea id="alternative" name="alternative" rows="3" aria-describedby="alternative-hint"></textarea>`, 'Es.: «Puoi ordinare anche per telefono, dal lunedì al venerdì, 9–18.»')}
    </fieldset>
    <fieldset>
      <legend>Segnalazioni</legend>
      ${field('email', 'Email per le segnalazioni', html`<input id="email" name="email" type="email" autocomplete="email">`)}
      ${field('telefono', 'Telefono (facoltativo)', html`<input id="telefono" name="telefono" type="tel" autocomplete="tel">`)}
      ${field('tempi', 'Tempo massimo di risposta', html`<select id="tempi" name="tempi"><option>7 giorni</option><option>15 giorni</option><option selected>30 giorni</option></select>`)}
    </fieldset>
    <fieldset>
      <legend>Valutazione</legend>
      ${field('data', 'Data della valutazione', html`<input id="data" name="data" type="date">`)}
      <label class="choice"><input type="radio" name="metodo" value="autovalutazione" checked> <span>Autovalutazione (test automatici e controlli manuali)</span></label>
      <label class="choice"><input type="radio" name="metodo" value="terza-parte"> <span>Valutazione di un soggetto terzo</span></label>
    </fieldset>
  </form>

  <section class="statement-preview" aria-labelledby="anteprima-title">
    <div class="preview-head">
      <h2 id="anteprima-title">Anteprima</h2>
      <div class="preview-actions">
        <button class="button button--primary" type="button" data-copy-html>Copia HTML</button>
        <button class="button" type="button" data-copy-text>Copia testo</button>
        <button class="button" type="button" data-download>Scarica .html</button>
      </div>
      <p class="hint" role="status" data-statement-status></p>
    </div>
    <div class="preview-doc card" data-statement-preview></div>
    <p class="hint" data-credit-note></p>
    <p class="hint">Rileggi il testo prima di pubblicarlo e fallo verificare da un professionista se hai dubbi: Varco non fornisce consulenza legale.</p>
  </section>
</div>
`,
});

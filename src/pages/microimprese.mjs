import { html } from '../js/lib/escape.js';
import { classifyMicro } from '../js/lib/wizard.js';

// Worked examples are checked against the same function the wizard uses.
const CASES = [
  { who: 'Negozio online di ceramiche', persone: '<10', p: 4, fatturato: '<=2', f: '800.000 €', bilancio: '<=2', b: '500.000 €' },
  { who: 'E-commerce di elettronica', persone: '<10', p: 6, fatturato: '>2', f: '3 milioni €', bilancio: '<=2', b: '1,5 milioni €' },
  { who: 'Agenzia di viaggi con prenotazione online', persone: '<10', p: 8, fatturato: '>2', f: '4 milioni €', bilancio: '>2', b: '2,5 milioni €' },
  { who: 'Shop di abbigliamento', persone: '10+', p: 12, fatturato: '<=2', f: '1 milione €', bilancio: '<=2', b: '600.000 €' },
].map((c) => ({ ...c, micro: classifyMicro(c.persone, c.fatturato, c.bilancio) === 'si' }));

export default (ctx) => ({
  path: '/guida/eaa-microimprese/',
  nav: 'guida',
  title: "EAA e microimprese: quando sei esente (e quando no)",
  description: "Le microimprese che forniscono servizi sono esentate dall'European Accessibility Act. Come si calcolano le soglie (10 persone, 2 milioni), esempi pratici e cosa resta da fare.",
  jsonLd: [{
    '@context': 'https://schema.org', '@type': 'Article', inLanguage: 'it',
    headline: "EAA e microimprese: quando sei esente (e quando no)",
    dateModified: '2026-10-28', author: { '@type': 'Organization', name: 'Varco' },
    mainEntityOfPage: ctx.abs('/guida/eaa-microimprese/'),
  }],
  body: html`
<article class="wrap prose narrow guide-article">
  <header class="page-head">
    <p class="eyebrow">Guida · aggiornata al 28 ottobre 2026</p>
    <h1>EAA e microimprese: quando sei esente (e quando no)</h1>
    <p class="lead">L'European Accessibility Act esenta le microimprese che forniscono servizi. La definizione però ha un dettaglio che cambia molti casi: basta una delle due soglie economiche.</p>
  </header>

  <h2>La regola in una frase</h2>
  <p>Sei una microimpresa se occupi <strong>meno di 10 persone</strong> e hai un <strong>fatturato annuo oppure un totale di bilancio annuo non superiore a 2 milioni di euro</strong> (Direttiva (UE) 2019/882, art. 3, punto 23). Le microimprese che forniscono servizi sono esentate dai requisiti di accessibilità e da ogni obbligo collegato (art. 4, paragrafo 5).</p>
  <p>Quell'«oppure» è importante: con meno di 10 persone sei microimpresa anche se il fatturato supera i 2 milioni, purché il totale di bilancio resti entro i 2 milioni (o viceversa).</p>

  <h2>Quattro casi pratici</h2>
  <div class="table-wrap" role="region" aria-labelledby="casi-caption" tabindex="0">
    <table class="cases">
      <caption id="casi-caption">Esempi di calcolo (casi inventati a scopo illustrativo)</caption>
      <thead><tr><th scope="col">Impresa</th><th scope="col">Persone</th><th scope="col">Fatturato</th><th scope="col">Totale di bilancio</th><th scope="col">Esito per i servizi</th></tr></thead>
      <tbody>${CASES.map((c) => html`<tr><th scope="row">${c.who}</th><td>${c.p}</td><td>${c.f}</td><td>${c.b}</td><td>${c.micro ? 'Microimpresa: esente' : 'Non è microimpresa: obbligata'}</td></tr>`)}</tbody>
    </table>
  </div>
  <p>Il secondo caso sorprende spesso: il fatturato supera i 2 milioni, ma il totale di bilancio no, quindi l'impresa resta microimpresa. Il terzo supera entrambe le soglie economiche; il quarto ha 10 persone o più, e questo basta a escluderlo.</p>

  <h2>Come contare le persone e i valori</h2>
  <p>Usa i dati dell'ultimo bilancio approvato e il numero di persone occupate. Se hai collaboratori, soci che lavorano nell'impresa, dipendenti part-time o un gruppo di imprese collegate, chiedi al commercialista di fare il calcolo con i criteri della definizione europea di PMI: è il modo più sicuro per non sbagliare.</p>

  <h2>Cosa copre l'esenzione, e cosa no</h2>
  <ul>
    <li><strong>Copre i servizi</strong> elencati dall'EAA: e-commerce verso consumatori, servizi bancari, trasporto passeggeri, e-book, comunicazioni elettroniche, accesso ai media audiovisivi.</li>
    <li><strong>Non copre i prodotti</strong>: chi fabbrica, importa o distribuisce prodotti coperti dalla direttiva ha obblighi diversi.</li>
    <li><strong>Non è per sempre</strong>: se l'impresa cresce oltre le soglie, gli obblighi scattano. Conviene ricontrollare a ogni bilancio.</li>
  </ul>

  <h2>Perché valutare comunque l'accessibilità</h2>
  <p>La direttiva stessa incoraggia le microimprese a offrire servizi accessibili per essere più competitive (considerando 72), e chiede agli Stati membri di fornire loro orientamenti e strumenti (art. 4, paragrafo 6). In pratica un sito accessibile raggiunge più clienti, abbandona meno carrelli e ti prepara al giorno in cui supererai le soglie.</p>

  <aside class="cta-card">
    <h2>Verifica il tuo caso in due minuti</h2>
    <p>Sette domande, nessun dato inviato a server. Ti diciamo se sei probabilmente obbligato, esente o fuori ambito, e perché.</p>
    <a class="button button--primary" href="${ctx.url('/obbligo/')}">Sei obbligato?</a>
  </aside>

  <section class="sources">
    <h2>Fonti</h2>
    <ul>
      <li><a href="https://eur-lex.europa.eu/eli/dir/2019/882/oj?locale=it">Direttiva (UE) 2019/882, art. 3 punto 23, art. 4 paragrafi 5 e 6, considerando 70–72</a></li>
      <li><a href="https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2022-05-27;82">D.Lgs. 27 maggio 2022, n. 82</a></li>
      <li><a href="${ctx.url('/guida/european-accessibility-act/')}">Guida pratica all'European Accessibility Act</a></li>
    </ul>
  </section>
</article>
`,
});

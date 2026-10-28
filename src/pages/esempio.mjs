import { html, raw } from '../js/lib/escape.js';
import { buildStatementHtml } from '../js/lib/statement.js';

// The example is produced by the same builder as the generator, so the guide can never drift from the tool.
const SAMPLE = {
  azienda: 'Bottega Esempio srl',
  servizio: 'il negozio online Bottega Esempio',
  sito: 'https://www.bottega-esempio.it',
  descrizione: 'Vendiamo online calzature e accessori in pelle, con consegna in tutta Italia e reso gratuito entro 30 giorni.',
  funzionamento: "Puoi cercare i prodotti per categoria o per nome, scegliere taglia e colore, aggiungerli al carrello e completare l'acquisto come ospite o con un account. Il pagamento avviene con carta, PayPal o bonifico. Dopo l'ordine ricevi una email di conferma con il link per seguire la spedizione.\n\nL'assistenza risponde via email, telefono e chat dal lunedì al venerdì.",
  stato: 'parziale',
  misure: "Abbiamo corretto contrasto dei colori, testi alternativi delle immagini prodotto ed etichette dei moduli di registrazione e pagamento. Il sito viene verificato a ogni rilascio con test automatici e, ogni tre mesi, con una prova completa del percorso di acquisto da tastiera e con lettore di schermo.",
  problemi: [
    'Alcuni video dimostrativi dei prodotti non hanno ancora i sottotitoli (correzione prevista entro marzo).',
    'Il filtro per prezzo nella pagina di categoria non è utilizzabile da tastiera: puoi usare in alternativa l\'ordinamento per prezzo.',
  ],
  alternative: "Puoi ordinare anche per telefono al numero indicato qui sotto, dal lunedì al venerdì dalle 9 alle 18: un operatore completa l'ordine con te.",
  email: 'accessibilita@bottega-esempio.it',
  telefono: '+39 000 000 0000',
  tempi: '15 giorni',
  data: '2026-10-28',
  metodo: 'autovalutazione',
};

export default (ctx) => ({
  path: '/guida/dichiarazione-accessibilita-ecommerce/',
  nav: 'guida',
  title: "Dichiarazione di accessibilità per e-commerce: un esempio completo",
  description: "Cosa scrivere nelle informazioni sull'accessibilità richieste dall'EAA per un negozio online: dove pubblicarle, le tre parti obbligatorie, un esempio commentato e gli errori da evitare.",
  jsonLd: [{
    '@context': 'https://schema.org', '@type': 'Article', inLanguage: 'it',
    headline: "Dichiarazione di accessibilità per e-commerce: un esempio completo",
    dateModified: '2026-10-28', author: { '@type': 'Organization', name: 'Varco' },
    mainEntityOfPage: ctx.abs('/guida/dichiarazione-accessibilita-ecommerce/'),
  }],
  body: html`
<article class="wrap prose narrow guide-article">
  <header class="page-head">
    <p class="eyebrow">Guida · aggiornata al 28 ottobre 2026</p>
    <h1>Dichiarazione di accessibilità per e-commerce: un esempio completo</h1>
    <p class="lead">Cosa scrivere nelle informazioni sull'accessibilità che l'European Accessibility Act chiede ai negozi online, con un esempio commentato e il generatore gratuito per creare la tua.</p>
  </header>

  <h2>Prima di tutto: ti riguarda?</h2>
  <p>L'obbligo vale per chi vende online a consumatori e non è una microimpresa (meno di 10 persone e fatturato annuo oppure totale di bilancio fino a 2 milioni di euro). <a href="${ctx.url('/obbligo/')}">Verifica il tuo caso in due minuti</a>.</p>

  <h2>Dove va pubblicata</h2>
  <p>La direttiva chiede di includere le informazioni nelle condizioni generali o in un documento equivalente (Allegato V) e di renderle disponibili in forma scritta e orale, anche in modo accessibile alle persone con disabilità (art. 13, paragrafo 2). In pratica funziona bene così:</p>
  <ul>
    <li>una pagina «Accessibilità» collegata dal piè di pagina di tutto il sito;</li>
    <li>un richiamo a quella pagina nelle condizioni di vendita;</li>
    <li>la possibilità di ricevere le stesse informazioni a voce, per telefono, su richiesta.</li>
  </ul>

  <h2>Le tre parti richieste dall'Allegato V</h2>
  <ol>
    <li><strong>Una descrizione generale del servizio</strong>, in formati accessibili: cosa vendi e a chi.</li>
    <li><strong>Le spiegazioni per capire come funziona</strong>: ricerca, scelta, carrello, pagamento, consegna, assistenza.</li>
    <li><strong>Come il servizio soddisfa i requisiti di accessibilità</strong> dell'Allegato I: lo standard seguito, lo stato di conformità e le misure adottate.</li>
  </ol>
  <p>A queste conviene aggiungere le limitazioni note con le alternative disponibili, un contatto per le segnalazioni con i tempi di risposta, e la data e il metodo dell'ultima valutazione.</p>

  <h2>L'esempio</h2>
  <p class="callout" role="note">Esempio fittizio: Bottega Esempio srl non esiste. I contatti sono segnaposto.</p>
  <div class="card example-doc">
    ${raw(buildStatementHtml(SAMPLE, { credit: false }))}
  </div>

  <h2>Perché è scritto così</h2>
  <ul>
    <li><strong>Stato «parzialmente conforme»</strong>: è onesto. Dichiarare «conforme» senza una verifica completa espone a contestazioni.</li>
    <li><strong>Limitazioni concrete con una data o un'alternativa</strong>: dice al cliente cosa non funziona ancora e come ottenere comunque il servizio.</li>
    <li><strong>Un'alternativa umana</strong> (l'ordine per telefono) copre i casi che il sito non risolve ancora.</li>
    <li><strong>Tempi di risposta</strong> che l'azienda riesce davvero a rispettare.</li>
    <li><strong>Metodo e data</strong> della valutazione, così chi legge sa quanto è aggiornata.</li>
  </ul>

  <h2>Errori da evitare</h2>
  <ul>
    <li>Copiare un testo generico che non descrive il tuo servizio.</li>
    <li>Promettere conformità totale dopo aver installato un widget di accessibilità.</li>
    <li>Nascondere la pagina o non citarla nelle condizioni di vendita.</li>
    <li>Non aggiornarla quando cambi tema, checkout o metodi di pagamento.</li>
  </ul>

  <aside class="cta-card">
    <h2>Crea la tua in cinque minuti</h2>
    <p>Il generatore di Varco costruisce lo stesso testo a partire dalle tue risposte e dai problemi trovati nelle analisi. Gratis.</p>
    <a class="button button--primary" href="${ctx.url('/dichiarazione/')}">Apri il generatore</a>
  </aside>

  <section class="sources">
    <h2>Fonti</h2>
    <ul>
      <li><a href="https://eur-lex.europa.eu/eli/dir/2019/882/oj?locale=it">Direttiva (UE) 2019/882, art. 13 e Allegato V</a></li>
      <li><a href="https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2022-05-27;82">D.Lgs. 27 maggio 2022, n. 82</a></li>
      <li><a href="${ctx.url('/guida/european-accessibility-act/')}">Guida pratica all'European Accessibility Act</a></li>
    </ul>
  </section>
</article>
`,
});

import { html } from '../js/lib/escape.js';

const FAQ = [
  ['Posso usare Varco sui siti dei miei clienti?', 'Sì. Il pulsante Varco analizza qualsiasi pagina che apri nel browser, anche dopo l\'accesso: carrello, checkout, area clienti. Funziona con WooCommerce, Shopify, PrestaShop, Wix e siti su misura.'],
  ['Il report porta il marchio Varco?', 'Con il piano Agenzia no: la versione stampata mostra il tuo logo, il nome della tua agenzia e quello del cliente.'],
  ['Quanti clienti posso gestire?', 'Con il piano Agenzia, clienti e progetti illimitati.'],
  ['Dove finiscono i dati dei clienti?', 'Da nessuna parte: le analisi e i report restano nel tuo browser. Varco non ha un server che riceve le pagine.'],
  ['Varco certifica la conformità del sito del cliente?', "No, e diffida di chi lo promette con uno strumento automatico. Varco trova i problemi rilevabili in automatico, guida i controlli manuali e documenta la valutazione: la base per un lavoro serio, non un bollino."],
];

export default (ctx) => {
  const p = ctx.config.payments;
  const live = Boolean(p.organizationId && p.checkout.agenzia && p.benefits.agenzia);
  const steps = [
    ['Verifica dell\'obbligo', 'In due minuti capisci se il cliente è obbligato o se è una microimpresa esente.', '/obbligo/'],
    ['Analisi delle pagine chiave', 'Home, categoria, prodotto, carrello, checkout: con il pulsante Varco, anche dopo l\'accesso.', '/verifica/'],
    ['Controlli manuali', 'Tastiera, zoom, lettore di schermo, moduli: 24 verifiche guidate.', '/checklist/'],
    ['Report per il cliente', 'Problemi per gravità, criteri WCAG e clausole EN 301 549, come correggere. In PDF con il tuo logo.', '/report/'],
    ['Informazioni di accessibilità', 'Il testo da pubblicare nelle condizioni di vendita, costruito sui risultati.', '/dichiarazione/'],
    ['Riverifica dopo le correzioni', 'Confronto prima/dopo per mostrare al cliente i progressi.', '/report/'],
  ];
  return {
    path: '/agenzie/',
    nav: 'agenzie',
    title: 'Verifiche EAA per i clienti della tua web agency',
    description: "Per web agency e freelance: analizza i siti dei clienti, anche carrello e checkout, e consegna report di accessibilità in italiano con il tuo logo e le informazioni EAA da pubblicare.",
    jsonLd: [{
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    }],
    body: html`
<div class="wrap page-head">
  <p class="eyebrow">Per web agency e freelance</p>
  <h1>Offri ai tuoi clienti la verifica EAA, con il tuo marchio</h1>
  <p class="lead">I clienti e-commerce ti chiedono se il loro sito rispetta l'European Accessibility Act. Con Varco analizzi le loro pagine, anche carrello e checkout, e consegni un report in italiano e le informazioni di accessibilità da pubblicare.</p>
  <div class="cta-row">
    <a class="button button--primary" href="${ctx.url('/verifica/')}">Prova sul negozio di esempio</a>
    <a class="button" href="${ctx.url('/prezzi/')}">Piano Agenzia: €${p.prices.agenzia} all'anno</a>
  </div>
</div>

<section class="wrap section" aria-labelledby="perche-ora">
  <h2 id="perche-ora">Perché i tuoi clienti te lo chiederanno</h2>
  <ul class="feature-list">
    <li>Dal 28 giugno 2025 l'EAA vale per gli e-commerce rivolti ai consumatori, tranne le microimprese (meno di 10 persone e fatturato oppure bilancio fino a 2 milioni di euro).</li>
    <li>Nel 2026 AgID ha pubblicato le linee guida sull'accessibilità dei servizi e il regolamento su verifiche e sanzioni, e ha aperto un canale pubblico per le segnalazioni.</li>
    <li>L'art. 24 del D.Lgs. 82/2022 prevede sanzioni da 5.000 a 40.000 euro per chi non rispetta requisiti e obblighi.</li>
    <li>Molti store ricevono proposte di widget «per la conformità»: tu puoi offrire un'analisi vera e le correzioni nel codice.</li>
  </ul>
  <p class="hint">Fonti: <a href="https://eur-lex.europa.eu/eli/dir/2019/882/oj?locale=it">Direttiva (UE) 2019/882</a>, <a href="https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2022-05-27;82~art24">D.Lgs. 82/2022, art. 24</a>, <a href="${ctx.url('/guida/european-accessibility-act/')}">la nostra guida</a>.</p>
</section>

<section class="band band--agency" aria-labelledby="flusso">
  <div class="wrap">
    <h2 id="flusso">Il flusso di lavoro con un cliente</h2>
    <ol class="flow">
      ${steps.map(([t, d, href]) => html`<li><a href="${ctx.url(href)}"><span class="flow-t">${t}</span></a><span class="flow-d">${d}</span></li>`)}
    </ol>
  </div>
</section>

<section class="wrap section" aria-labelledby="onesto">
  <div class="two-col">
    <div class="card">
      <h2 id="onesto">Onesto con i tuoi clienti</h2>
      <p>Nessun widget sovrapposto al sito e nessuna promessa di «conformità garantita». I test automatici trovano solo una parte dei problemi: Varco lo dice nel report e guida i controlli manuali, così il tuo lavoro regge davanti al cliente.</p>
    </div>
    <div class="card plan--featured">
      <h2>Piano Agenzia</h2>
      <p class="price"><span class="price-n">€${p.prices.agenzia}</span> <span class="price-per">all'anno, IVA esclusa</span></p>
      <ul class="feature-list"><li>Report in PDF con il tuo logo e il nome del cliente</li><li>Clienti e progetti illimitati</li><li>Confronto prima/dopo, esportazione CSV e JSON</li><li>Informazioni di accessibilità senza citazione di Varco</li></ul>
      ${live
        ? html`<p><a class="button button--primary" href="${ctx.url('/acquista/agenzia/')}">Acquista Agenzia</a></p>`
        : html`<p class="soon">Disponibile a breve</p><p class="hint">Vuoi essere tra i primi o dirci cosa ti serve? <a href="${ctx.config.site.feedback}">Scrivici nelle discussioni del progetto</a> (serve un account GitHub).</p>`}
    </div>
  </div>
</section>

<section class="wrap section" aria-labelledby="faq-agenzie">
  <h2 id="faq-agenzie">Domande delle agenzie</h2>
  <div class="faq">${FAQ.map(([q, a]) => html`<details class="disclosure"><summary>${q}</summary><p>${a}</p></details>`)}</div>
</section>
`,
  };
};

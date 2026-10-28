import { html } from '../js/lib/escape.js';

const FAQ = [
  ['Varco certifica che il mio sito è conforme?', "No. Nessuno strumento automatico può farlo. Varco trova i problemi rilevabili in automatico, ti guida nei controlli manuali e ti aiuta a documentare la valutazione. Per dichiarare formalmente la conformità serve una verifica completa, se necessario con un professionista."],
  ['Le mie pagine vengono inviate a un server?', "No. L'analisi avviene nel tuo browser con axe-core. Varco è un sito statico: non ha un server che riceve le tue pagine. Report, progetti e checklist restano salvati nel tuo browser."],
  ["Cos'è l'European Accessibility Act?", 'È la Direttiva (UE) 2019/882, recepita in Italia con il D.Lgs. 82/2022. Dal 28 giugno 2025 richiede che e-commerce, servizi bancari, trasporti passeggeri, e-book e altri servizi rivolti ai consumatori siano accessibili alle persone con disabilità.'],
  ['Sono una piccola impresa: devo adeguarmi?', "Le microimprese che forniscono servizi (meno di 10 persone e fatturato annuo oppure totale di bilancio fino a 2 milioni di euro) sono esentate. Verifica il tuo caso in due minuti con il test «Sei obbligato?»."],
  ['Funziona con WordPress, Shopify, Wix?', 'Sì. Il pulsante Varco funziona su qualsiasi pagina aperta nel browser, compresi carrello e checkout dopo l\'accesso. Molte schede di correzione includono istruzioni per WordPress, Shopify e Wix.'],
  ['Quanto costa?', 'Verifica, checklist e generatore delle informazioni di accessibilità sono gratuiti. I piani Pro (€49 all\'anno) e Agenzia (€149 all\'anno) aggiungono progetti illimitati, esportazioni e report con il tuo marchio.'],
];

export default (ctx) => {
  const { url } = ctx;
  const steps = [
    ['/obbligo/', 'Sei obbligato?', "Due minuti per capire se l'EAA si applica alla tua impresa."],
    ['/verifica/', 'Scansione automatica', `${ctx.ruleCount} regole di accessibilità controllate nel tuo browser.`],
    ['/checklist/', 'Controlli manuali', `${ctx.checklist.length} verifiche guidate su ciò che le macchine non vedono.`],
    ['/dichiarazione/', 'Informazioni di accessibilità', 'Il testo da pubblicare, costruito sui risultati.'],
  ];
  return {
    path: '/',
    nav: 'home',
    title: "Varco — verifica di accessibilità e European Accessibility Act per imprese italiane",
    description: "Controlla gratis l'accessibilità del tuo sito nel browser, scopri se l'European Accessibility Act ti riguarda e crea le informazioni di accessibilità da pubblicare. In italiano.",
    scripts: ['js/pages/home.js'],
    bodyClass: 'page-home',
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Varco', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', inLanguage: 'it', url: ctx.abs('/'),
        description: "Verifica di accessibilità (WCAG 2.2, EN 301 549) e strumenti per l'European Accessibility Act.",
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
    body: html`
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="eyebrow">European Accessibility Act · in vigore dal 28 giugno 2025</p>
      <h1>Il tuo sito lascia fuori qualcuno?</h1>
      <p class="lead">Varco controlla l'accessibilità delle tue pagine direttamente nel browser, ti dice se l'EAA riguarda la tua impresa e ti aiuta a pubblicare le informazioni di accessibilità richieste dalla legge. In italiano, senza installare nulla.</p>
      <div class="cta-row">
        <a class="button button--primary" href="${url('/verifica/')}">Verifica una pagina</a>
        <a class="button" href="${url('/obbligo/')}">Scopri se sei obbligato</a>
      </div>
      <p class="fineprint">Gratis per iniziare. Le pagine che analizzi non lasciano mai il tuo browser.</p>
    </div>
    <nav class="percorso" aria-label="Il percorso di Varco in quattro passi">
      <ol>
        ${steps.map(([href, t, d], i) => html`<li class="percorso-step" style="--i:${i}">
          <a href="${url(href)}"><span class="tile" aria-hidden="true"></span><span class="step-n">${i + 1}</span><span class="step-t">${t}</span><span class="step-d">${d}</span></a>
        </li>`)}
      </ol>
      <span class="percorso-door" aria-hidden="true"></span>
    </nav>
  </div>
</section>

<section class="band band--demo" aria-labelledby="demo-title">
  <div class="wrap demo-grid">
    <div class="demo-copy">
      <h2 id="demo-title">Guardalo al lavoro su un negozio di prova</h2>
      <p>Abbiamo costruito un piccolo e-commerce di esempio con gli errori che si incontrano più spesso: immagini senza descrizione, testo poco leggibile, pulsanti senza nome, campi senza etichetta. Analizzalo e guarda cosa riporta Varco.</p>
      <button class="button button--primary" type="button" data-demo-run>Analizza il negozio di prova</button>
      <p class="scan-status" role="status" data-scan-status></p>
    </div>
    <div class="demo-out">
      <div class="scan-stage" data-scan-stage></div>
      <div class="demo-result" data-demo-result hidden></div>
    </div>
  </div>
</section>

<section class="wrap section" aria-labelledby="limiti-title">
  <h2 id="limiti-title">Cosa può dirti un controllo automatico, e cosa no</h2>
  <div class="two-col">
    <div class="card">
      <h3>Automatico</h3>
      <p>Testi alternativi mancanti, contrasto dei colori, campi senza etichetta, pulsanti senza nome, struttura dei titoli, attributi ARIA errati, dimensione degli elementi cliccabili: ${ctx.ruleCount} regole basate su WCAG 2.2 livello A e AA e sulle buone pratiche, collegate ai criteri WCAG e alla norma europea EN 301 549.</p>
    </div>
    <div class="card">
      <h3>Manuale, ma guidato</h3>
      <p>Uso con la sola tastiera, qualità dei testi alternativi, sottotitoli dei video, messaggi di errore, percorso di acquisto completo. Nessuno strumento automatico li verifica in modo affidabile: Varco ti spiega come farlo in pochi minuti.</p>
    </div>
  </div>
  <p class="callout">Per questo Varco non mostra un «punteggio di conformità» e non promette certificazioni. E non aggiunge widget sovrapposti al tuo sito: le correzioni vanno fatte nel codice e nei contenuti, ed è lì che ti aiuta.</p>
</section>

<section class="band band--agency" aria-labelledby="agency-title">
  <div class="wrap agency-grid">
    <div>
      <h2 id="agency-title">Per web agency e freelance</h2>
      <p>I tuoi clienti chiedono se il sito è a norma. Con Varco consegni un'analisi in italiano, chiara, con i riferimenti tecnici e normativi.</p>
    </div>
    <ul class="feature-list">
      <li>Report da stampare in PDF con il tuo logo e il nome del cliente</li>
      <li>Progetti illimitati e confronto prima/dopo per mostrare i progressi</li>
      <li>Esportazione CSV per pianificare le correzioni con il team</li>
      <li>Informazioni di accessibilità pronte da consegnare</li>
    </ul>
    <p><a class="button" href="${url('/prezzi/')}">Piano Agenzia: €149 all'anno</a></p>
  </div>
</section>

<section class="wrap section" aria-labelledby="faq-title">
  <h2 id="faq-title">Domande frequenti</h2>
  <div class="faq">
    ${FAQ.map(([q, a]) => html`<details class="disclosure"><summary>${q}</summary><p>${a}</p></details>`)}
  </div>
</section>

<section class="wrap section sources" aria-labelledby="fonti-title">
  <h2 id="fonti-title">Fonti</h2>
  <ul>
    <li><a href="https://eur-lex.europa.eu/eli/dir/2019/882/oj?locale=it">Direttiva (UE) 2019/882 — European Accessibility Act</a></li>
    <li><a href="https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2022-05-27;82">D.Lgs. 27 maggio 2022, n. 82</a></li>
    <li><a href="https://www.agid.gov.it/">AgID — Agenzia per l'Italia Digitale</a></li>
    <li><a href="https://github.com/dequelabs/axe-core">axe-core, il motore di analisi open source</a></li>
  </ul>
</section>
`,
  };
};

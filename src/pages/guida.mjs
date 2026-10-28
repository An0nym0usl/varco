import { html } from '../js/lib/escape.js';

export default (ctx) => {
  const u = ctx.url;
  const toc = [
    ['in-breve', 'In breve'], ['servizi', 'Quali servizi sono coperti'], ['ecommerce', "L'e-commerce in pratica"],
    ['microimprese', 'Le microimprese'], ['informazioni', 'Le informazioni da pubblicare'], ['standard', 'Lo standard tecnico'],
    ['mantenere', 'Mantenere la conformità'], ['onere', 'Onere sproporzionato'], ['transitorio', 'Periodo transitorio'],
    ['vigilanza', 'Vigilanza in Italia'], ['iniziare', 'Da dove iniziare'], ['fonti', 'Fonti'],
  ];
  return {
    path: '/guida/european-accessibility-act/',
    nav: 'guida',
    title: "European Accessibility Act: guida pratica per le imprese italiane",
    description: "Cosa prevede l'European Accessibility Act (D.Lgs. 82/2022) per e-commerce e servizi: chi è obbligato, esenzione delle microimprese, informazioni da pubblicare, standard EN 301 549, vigilanza AgID.",
    jsonLd: [{
      '@context': 'https://schema.org', '@type': 'Article', inLanguage: 'it',
      headline: "European Accessibility Act: guida pratica per le imprese italiane",
      dateModified: '2026-10-28', author: { '@type': 'Organization', name: 'Varco' },
      mainEntityOfPage: ctx.abs('/guida/european-accessibility-act/'),
    }],
    body: html`
<article class="wrap prose-layout">
  <header class="page-head">
    <p class="eyebrow">Guida · aggiornata al 28 ottobre 2026</p>
    <h1>European Accessibility Act: guida pratica per le imprese italiane</h1>
    <p class="lead">Cosa chiede la legge a chi vende o offre servizi online ai consumatori, spiegato con i riferimenti agli articoli. Non è una consulenza legale: è il punto di partenza per capire cosa fare.</p>
  </header>
  <nav class="toc card" aria-labelledby="indice">
    <h2 id="indice">In questa guida</h2>
    <ol>${toc.map(([id, t]) => html`<li><a href="#${id}">${t}</a></li>`)}</ol>
  </nav>
  <div class="prose">
    <section id="in-breve" class="summary-box">
      <h2>In breve</h2>
      <dl>
        <div><dt>Cos'è</dt><dd>La Direttiva (UE) 2019/882, recepita in Italia con il D.Lgs. 27 maggio 2022, n. 82.</dd></div>
        <div><dt>Da quando</dt><dd>Dal 28 giugno 2025 per i prodotti immessi sul mercato e i servizi forniti da quella data.</dd></div>
        <div><dt>Chi riguarda</dt><dd>Chi fornisce ai consumatori alcuni servizi (e-commerce, banca, trasporti, e-book, comunicazioni elettroniche, media audiovisivi) e chi fabbrica, importa o distribuisce alcuni prodotti.</dd></div>
        <div><dt>Chi è esente</dt><dd>Le microimprese che forniscono servizi.</dd></div>
        <div><dt>Cosa fare</dt><dd>Rendere accessibili sito e app, pubblicare le informazioni sull'accessibilità del servizio, mantenere la conformità nel tempo.</dd></div>
      </dl>
    </section>

    <section id="servizi">
      <h2>Quali servizi sono coperti</h2>
      <p>L'articolo 2 della direttiva elenca i servizi forniti ai consumatori che devono rispettare i requisiti di accessibilità:</p>
      <ul>
        <li><strong>Commercio elettronico</strong>: la vendita online di qualsiasi prodotto o servizio a consumatori, tramite sito web o app.</li>
        <li><strong>Servizi bancari per consumatori</strong>: conti, pagamenti, credito, servizi di investimento.</li>
        <li><strong>Trasporto passeggeri</strong> aereo, in autobus, ferroviario e per vie navigabili: siti web, app, biglietteria elettronica, informazioni di viaggio. Per i trasporti urbani, extraurbani e regionali valgono solo i terminali self-service.</li>
        <li><strong>E-book</strong> e software dedicati alla loro lettura.</li>
        <li><strong>Servizi di comunicazione elettronica</strong>, come telefonia e accesso a internet, e la gestione delle chiamate di emergenza al 112.</li>
        <li><strong>Servizi di accesso ai media audiovisivi</strong>, come le piattaforme di TV e streaming.</li>
      </ul>
      <p>Un sito vetrina che non permette di concludere contratti con i consumatori, di per sé, non rientra in queste categorie. <a href="${u('/obbligo/')}">Verifica il tuo caso in due minuti</a>.</p>
    </section>

    <section id="ecommerce">
      <h2>L'e-commerce in pratica</h2>
      <p>Per la direttiva il commercio elettronico è un servizio fornito a distanza, tramite siti web e applicazioni mobili, per via elettronica e su richiesta individuale di un consumatore, per concludere un contratto di consumo. Oltre all'accessibilità del sito e dell'app, l'Allegato I (sezione IV, lettera g) chiede di:</p>
      <ul>
        <li>fornire le informazioni sull'accessibilità dei prodotti e servizi venduti, quando le fornisce l'operatore economico responsabile;</li>
        <li>rendere accessibili identificazione, sicurezza e pagamento quando fanno parte del servizio;</li>
        <li>offrire metodi di identificazione, firme elettroniche e servizi di pagamento percepibili, utilizzabili, comprensibili e solidi.</li>
      </ul>
      <p>In concreto: il percorso dalla ricerca del prodotto alla conferma dell'ordine deve funzionare anche con la tastiera, con i lettori di schermo e con lo zoom. È il percorso che conviene verificare per primo.</p>
    </section>

    <section id="microimprese">
      <h2>Le microimprese</h2>
      <p>È microimpresa chi occupa meno di 10 persone e ha un fatturato annuo oppure un totale di bilancio annuo non superiore a 2 milioni di euro (art. 3, punto 23). Le microimprese che forniscono servizi sono esentate dai requisiti di accessibilità e da ogni obbligo collegato (art. 4, paragrafo 5).</p>
      <p>L'esenzione riguarda i servizi: per chi fabbrica, importa o distribuisce prodotti coperti dalla direttiva valgono regole diverse. E se l'impresa cresce oltre le soglie, gli obblighi scattano.</p>
    </section>

    <section id="informazioni">
      <h2>Le informazioni da pubblicare</h2>
      <p>I fornitori di servizi devono preparare le informazioni previste dall'Allegato V e spiegare come i servizi soddisfano i requisiti di accessibilità. Le informazioni vanno messe a disposizione del pubblico in forma scritta e orale, anche in modo accessibile alle persone con disabilità, e conservate finché il servizio è operativo (art. 13, paragrafo 2).</p>
      <p>Secondo l'Allegato V vanno incluse nelle condizioni generali o in un documento equivalente e comprendono, quando applicabili:</p>
      <ol>
        <li>una descrizione generale del servizio in formati accessibili;</li>
        <li>le descrizioni e spiegazioni necessarie a comprenderne il funzionamento;</li>
        <li>una descrizione di come il servizio soddisfa i requisiti di accessibilità dell'Allegato I.</li>
      </ol>
      <p>Vedi un <a href="${u('/guida/dichiarazione-accessibilita-ecommerce/')}">esempio completo per un e-commerce</a>, commentato.</p>
      <p><a class="button button--primary" href="${u('/dichiarazione/')}">Crea le informazioni di accessibilità</a></p>
    </section>

    <section id="standard">
      <h2>Lo standard tecnico</h2>
      <p>Il riferimento tecnico più usato è la norma europea EN 301 549, che per i contenuti web richiama le WCAG 2.1 di livello AA. È in preparazione una nuova versione della norma allineata all'EAA. Le WCAG 2.2 aggiungono criteri utili, per esempio la dimensione minima degli elementi cliccabili: Varco li controlla e li segnala come tali.</p>
    </section>

    <section id="mantenere">
      <h2>Mantenere la conformità</h2>
      <p>Non basta adeguarsi una volta. Il fornitore deve avere procedure perché il servizio resti conforme quando cambiano il sito, i requisiti o le norme tecniche (art. 13, paragrafo 3). Se il servizio non è conforme deve adottare misure correttive e informare subito le autorità competenti, indicando la non conformità e le misure adottate (art. 13, paragrafo 4).</p>
    </section>

    <section id="onere">
      <h2>Onere sproporzionato e modifica sostanziale</h2>
      <p>I requisiti si applicano solo nella misura in cui non richiedono una modifica sostanziale del servizio e non impongono un onere sproporzionato (art. 14). Chi invoca questa eccezione deve fare una valutazione documentata secondo i criteri dell'Allegato VI, rinnovarla almeno ogni cinque anni per i servizi e informare le autorità. È un'eccezione da valutare con un professionista, non una scorciatoia.</p>
    </section>

    <section id="transitorio">
      <h2>Periodo transitorio</h2>
      <p>Fino al 28 giugno 2030 i fornitori possono continuare a prestare i servizi con i prodotti che usavano legittimamente prima del 28 giugno 2025. I contratti di servizi conclusi prima del 28 giugno 2025 possono restare invariati fino alla scadenza, ma non oltre cinque anni da quella data (art. 32). Il sito e l'app con cui vendi oggi, invece, devono già rispettare i requisiti.</p>
    </section>

    <section id="vigilanza">
      <h2>Vigilanza in Italia</h2>
      <p>In Italia la vigilanza sull'accessibilità dei servizi digitali è affidata principalmente ad AgID, l'Agenzia per l'Italia Digitale; per alcuni settori intervengono anche le autorità di settore. Nel 2026 AgID ha adottato le linee guida sull'accessibilità dei servizi (determinazione n. 38/2026, Gazzetta Ufficiale n. 69 del 24 marzo 2026), ha attivato un canale pubblico per le segnalazioni e ha approvato il regolamento sul procedimento di verifica e sanzione (determinazione n. 84/2026). Il D.Lgs. 82/2022 prevede sanzioni amministrative per chi non rispetta i requisiti.</p>
    </section>

    <section id="iniziare">
      <h2>Da dove iniziare</h2>
      <ol class="steps">
        <li><p><a href="${u('/obbligo/')}">Verifica se sei obbligato</a>.</p></li>
        <li><p><a href="${u('/verifica/')}">Analizza le pagine del percorso principale</a>: home, categoria, prodotto, carrello, accesso, pagamento, contatti.</p></li>
        <li><p><a href="${u('/checklist/')}">Completa i controlli manuali</a>, a partire dalla tastiera.</p></li>
        <li><p>Correggi i problemi critici e gravi, poi ripeti l'analisi.</p></li>
        <li><p><a href="${u('/dichiarazione/')}">Pubblica le informazioni di accessibilità</a> e un contatto per le segnalazioni.</p></li>
      </ol>
    </section>

    <section id="fonti" class="sources">
      <h2>Fonti</h2>
      <ul>
        <li><a href="https://eur-lex.europa.eu/eli/dir/2019/882/oj?locale=it">Direttiva (UE) 2019/882 sui requisiti di accessibilità dei prodotti e dei servizi</a></li>
        <li><a href="https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2022-05-27;82">D.Lgs. 27 maggio 2022, n. 82</a></li>
        <li><a href="https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2004-01-09;4">Legge 9 gennaio 2004, n. 4</a></li>
        <li><a href="https://www.agid.gov.it/">AgID — Agenzia per l'Italia Digitale</a></li>
        <li><a href="https://www.w3.org/TR/WCAG22/">Web Content Accessibility Guidelines (WCAG) 2.2</a></li>
      </ul>
    </section>
  </div>
</article>
`,
  };
};

import { html } from '../js/lib/escape.js';

export default (ctx) => {
  const o = ctx.config.owner;
  const analytics = ctx.config.analytics.provider === 'cloudflare' && ctx.config.analytics.token;
  const owner = o.legalName
    ? html`<p>${o.legalName}${o.vatNumber ? html` · P. IVA ${o.vatNumber}` : ''}${o.address ? html` · ${o.address}` : ''}${o.contactEmail ? html` · <a href="mailto:${o.contactEmail}">${o.contactEmail}</a>` : ''}</p>`
    : html`<p>Varco è un progetto indipendente in fase di avvio. I dati completi del titolare saranno pubblicati qui prima dell'attivazione dei pagamenti. Nel frattempo puoi scriverci aprendo una segnalazione su <a href="${ctx.config.site.repo}/issues">GitHub</a>.</p>`;
  const page = (path, title, description, body, scripts) => ({ path, title, description, body, scripts, nav: '' });
  return [
    page('/privacy/', 'Privacy', "Come Varco tratta i dati: nessun cookie, analisi nel browser, dati salvati solo sul tuo dispositivo.", html`
<article class="wrap prose narrow">
  <p class="eyebrow">Informativa privacy</p>
  <h1>Privacy</h1>
  <p class="lead">In breve: Varco non usa cookie e non ha un server che riceve i tuoi dati. Le pagine che analizzi restano nel tuo browser.</p>
  <h2>Titolare del trattamento</h2>
  ${owner}
  <h2>Cosa succede quando usi Varco</h2>
  <ul>
    <li><strong>Analisi delle pagine.</strong> Il controllo di accessibilità avviene nel tuo browser. Il pulsante Varco carica uno script da questo sito; il contenuto delle pagine analizzate non viene inviato a Varco né a terzi.</li>
    <li><strong>Dati salvati nel browser.</strong> Report, progetti, checklist, bozze delle informazioni di accessibilità e licenza sono salvati nella memoria locale (localStorage) del tuo browser. Non li riceviamo. Puoi cancellarli in qualsiasi momento con il pulsante qui sotto.</li>
    <li><strong>Hosting.</strong> Il sito è pubblicato con GitHub Pages (GitHub, Inc.), che registra dati tecnici come l'indirizzo IP per motivi di sicurezza e funzionamento. Vedi l'<a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">informativa di GitHub</a>.</li>
    <li><strong>Statistiche.</strong> ${analytics ? html`Usiamo Cloudflare Web Analytics, che non usa cookie e non traccia le persone tra siti diversi, per contare le visite in forma aggregata.` : 'Al momento non usiamo strumenti di statistica.'}</li>
    <li><strong>Licenze e pagamenti.</strong> Gli acquisti sono gestiti da Polar (polar.sh), che agisce come rivenditore (merchant of record) e tratta i dati di pagamento secondo la propria <a href="https://polar.sh/legal/privacy">informativa</a>. Quando attivi una licenza, la chiave viene inviata a Polar per la verifica.</li>
  </ul>
  <h2>I tuoi diritti</h2>
  <p>Puoi chiedere accesso, rettifica o cancellazione dei dati che ci riguardano e proporre reclamo al Garante per la protezione dei dati personali. Per i dati salvati nel browser non serve chiederci nulla: li controlli tu.</p>
  <div class="card">
    <h2>Cancella i dati di Varco da questo browser</h2>
    <p>Elimina report, progetti, checklist, bozze e licenza salvati su questo dispositivo.</p>
    <button class="button" type="button" data-clear-data>Cancella tutti i dati</button>
    <p class="hint" role="status" data-clear-status></p>
  </div>
  <p class="hint">Ultimo aggiornamento: 28 ottobre 2026.</p>
</article>`, ['js/pages/privacy.js']),
    page('/termini/', "Termini d'uso", "Le condizioni d'uso di Varco: cosa offre, cosa non garantisce, piani a pagamento.", html`
<article class="wrap prose narrow">
  <p class="eyebrow">Condizioni</p>
  <h1>Termini d'uso</h1>
  <h2>Cosa offre Varco</h2>
  <p>Varco offre strumenti per individuare problemi di accessibilità nelle pagine web, guidare i controlli manuali e preparare le informazioni di accessibilità di un servizio. I test automatici rilevano solo una parte dei problemi possibili.</p>
  <h2>Cosa Varco non fa</h2>
  <p>Varco non certifica la conformità di un sito alle norme, non fornisce consulenza legale e non garantisce che un servizio rispetti l'European Accessibility Act o altre leggi. Sei responsabile delle decisioni che prendi e dei testi che pubblichi usando gli strumenti.</p>
  <h2>Uso corretto</h2>
  <p>Puoi analizzare le pagine che visiti con il tuo browser, nel rispetto delle condizioni dei siti stessi. Non è consentito usare Varco per attività illecite o per aggirare misure di sicurezza.</p>
  <h2>Piani a pagamento</h2>
  <p>I piani Pro e Agenzia sono abbonamenti annuali rivolti a imprese e professionisti, venduti da Polar (polar.sh) come rivenditore secondo i propri termini. Puoi disdire in qualsiasi momento dal portale clienti di Polar; il piano resta attivo fino alla fine del periodo pagato. Entro 14 giorni dall'acquisto puoi chiedere il rimborso completo.</p>
  <h2>Disponibilità</h2>
  <p>Il servizio è fornito «così com'è». Facciamo il possibile per mantenerlo disponibile e corretto, ma possono esserci interruzioni o errori. Gli strumenti gratuiti possono cambiare nel tempo.</p>
  <h2>Legge applicabile</h2>
  <p>Questi termini sono regolati dalla legge italiana.</p>
  <p class="hint">Ultimo aggiornamento: 28 ottobre 2026.</p>
</article>`),
    page('/note-legali/', 'Note legali', 'Titolare, hosting e licenze del software usato da Varco.', html`
<article class="wrap prose narrow">
  <p class="eyebrow">Note legali</p>
  <h1>Note legali</h1>
  <h2>Titolare del sito</h2>
  ${owner}
  <h2>Hosting</h2>
  <p>GitHub Pages, servizio di GitHub, Inc.</p>
  <h2>Software di terze parti</h2>
  <ul>
    <li>axe-core ${ctx.axeVersion} di Deque Systems, licenza <a href="${ctx.url('/vendor/axe-core-LICENSE.txt')}">Mozilla Public License 2.0</a>.</li>
    <li>Caratteri Atkinson Hyperlegible Next e Atkinson Hyperlegible Mono (Braille Institute) e Overpass, licenza SIL Open Font License 1.1.</li>
  </ul>
  <p>WCAG è una specifica del W3C. Varco non è affiliato al W3C, ad AgID o a Deque Systems.</p>
</article>`),
  ];
};

import { html } from '../js/lib/escape.js';

const PAY_FAQ = [
  ['Chi gestisce il pagamento?', "Polar (polar.sh), che agisce come rivenditore autorizzato (merchant of record): calcola l'IVA in base al tuo paese, emette la ricevuta e gestisce rinnovi e cancellazioni."],
  ['Come si attiva il piano?', "Dopo l'acquisto ricevi via email una chiave di licenza. Incollala nella pagina «Attiva licenza»: il piano si attiva nel browser in cui la inserisci, e puoi usarla anche sugli altri tuoi dispositivi."],
  ['Posso disdire?', "Sì, in qualsiasi momento dal portale clienti di Polar. Il piano resta attivo fino alla fine dell'anno già pagato."],
  ['E se non fa per me?', "Scrivici entro 14 giorni dall'acquisto e ti rimborsiamo l'intero importo."],
  ['A chi sono rivolti i piani a pagamento?', 'A imprese, professionisti e web agency. Le funzioni gratuite restano disponibili a tutti.'],
];

export default (ctx) => {
  const p = ctx.config.payments;
  const live = (plan) => Boolean(p.organizationId && p.checkout[plan] && p.benefits[plan]);
  const anyLive = live('pro') || live('agenzia');
  const buy = (plan, label) => (live(plan)
    ? html`<a class="button button--primary" href="${ctx.url(`/acquista/${plan}/`)}">${label}</a>`
    : html`<p class="soon">Disponibile a breve</p>`);
  const plans = [
    {
      id: 'gratis', name: 'Gratis', price: '€0', per: 'per sempre',
      features: ['Verifiche illimitate, una pagina alla volta', 'Report con criteri WCAG e clausole EN 301 549', "Verifica dell'obbligo EAA", 'Checklist manuale guidata', 'Generatore delle informazioni di accessibilità, con una citazione di Varco', 'Fino a 5 report salvati'],
      cta: html`<a class="button" href="${ctx.url('/verifica/')}">Inizia ora</a>`,
    },
    {
      id: 'pro', name: 'Pro', price: `€${p.prices.pro}`, per: "all'anno, IVA esclusa", featured: true,
      features: ['Tutto il piano Gratis', 'Report salvati illimitati', 'Confronto prima/dopo tra due analisi', 'Esportazione CSV e JSON', 'Informazioni di accessibilità senza citazione di Varco', "Per un'impresa e i suoi siti"],
      cta: buy('pro', 'Acquista Pro'),
    },
    {
      id: 'agenzia', name: 'Agenzia', price: `€${p.prices.agenzia}`, per: "all'anno, IVA esclusa",
      features: ['Tutto il piano Pro', 'Report in PDF con il tuo logo e il nome del cliente', 'Nessun marchio Varco sui documenti', 'Clienti e progetti illimitati', 'Pensato per web agency e freelance'],
      cta: buy('agenzia', 'Acquista Agenzia'),
    },
  ];
  return {
    path: '/prezzi/',
    nav: 'prezzi',
    title: 'Prezzi',
    description: `Varco è gratuito per verificare singole pagine. Pro a €${p.prices.pro} all'anno e Agenzia a €${p.prices.agenzia} all'anno per progetti illimitati, esportazioni e report con il tuo marchio.`,
    jsonLd: [{
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: PAY_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    }],
    body: html`
<div class="wrap page-head">
  <p class="eyebrow">Prezzi</p>
  <h1>Gratis per verificare. A pagamento per lavorare in grande.</h1>
  <p class="lead">Tutte le funzioni che servono a trovare e capire i problemi sono gratuite. I piani a pagamento aggiungono ciò che serve a chi gestisce più siti o consegna report ai clienti.</p>
  ${anyLive ? '' : html`<p class="callout" role="note">Gli acquisti non sono ancora attivi: stiamo completando la configurazione dei pagamenti. Nel frattempo tutte le funzioni gratuite sono disponibili. Vuoi un piano a pagamento appena esce, o ti serve qualcosa in più? <a href="${ctx.config.site.feedback}">Diccelo nelle discussioni del progetto</a>.</p>`}
  <p>Lavori in una web agency? <a href="${ctx.url('/agenzie/')}">Ecco come usare Varco con i tuoi clienti</a>.</p>
</div>
<div class="wrap plans">
  ${plans.map((pl) => html`<section class="plan card${pl.featured ? ' plan--featured' : ''}" aria-labelledby="piano-${pl.id}">
    <h2 id="piano-${pl.id}">${pl.name}</h2>
    <p class="price"><span class="price-n">${pl.price}</span> <span class="price-per">${pl.per}</span></p>
    <ul class="feature-list">${pl.features.map((f) => html`<li>${f}</li>`)}</ul>
    <div class="plan-cta">${pl.cta}</div>
  </section>`)}
</div>
<section class="wrap section" aria-labelledby="faq-pagamenti">
  <h2 id="faq-pagamenti">Pagamenti e licenze</h2>
  <div class="faq">${PAY_FAQ.map(([q, a]) => html`<details class="disclosure"><summary>${q}</summary><p>${a}</p></details>`)}</div>
  <p>Hai già una chiave? <a href="${ctx.url('/licenza/')}">Attiva la licenza</a>.</p>
</section>
`,
  };
};

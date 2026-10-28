import { html } from '../js/lib/escape.js';
import { SERVICES } from '../js/lib/wizard.js';

const radio = (name, value, label, required = false) => html`<label class="choice"><input type="radio" name="${name}" value="${value}"${required ? html` required` : ''}> <span>${label}</span></label>`;

export default (ctx) => ({
  path: '/obbligo/',
  nav: 'obbligo',
  title: "Sei obbligato dall'European Accessibility Act?",
  description: "Scopri in due minuti se la tua impresa deve rispettare l'European Accessibility Act (D.Lgs. 82/2022): servizi coperti, esenzione per le microimprese, prossimi passi.",
  scripts: ['js/pages/obbligo.js'],
  body: html`
<div class="wrap page-head">
  <p class="eyebrow">Verifica dell'obbligo</p>
  <h1>Sei obbligato dall'European Accessibility Act?</h1>
  <p class="lead">Rispondi a sette domande. Ti diciamo se l'EAA si applica probabilmente ai tuoi servizi, perché, e cosa fare adesso. Le risposte restano nel tuo browser.</p>
</div>

<div class="wrap form-layout">
  <form class="card wizard" data-wizard novalidate>
    <fieldset>
      <legend>1. Quali di questi servizi offri online?</legend>
      ${Object.entries(SERVICES).map(([v, l]) => html`<label class="choice"><input type="checkbox" name="services" value="${v}"> <span>${l}</span></label>`)}
      <label class="choice"><input type="checkbox" name="services" value="nessuno"> <span>Nessuno di questi (sito vetrina, blog, servizi solo tra aziende…)</span></label>
    </fieldset>
    <fieldset>
      <legend>2. A chi li offri?</legend>
      ${radio('clienti', 'consumatori', 'A consumatori (privati)')}
      ${radio('clienti', 'entrambi', 'Sia a consumatori sia ad aziende')}
      ${radio('clienti', 'aziende', 'Solo ad aziende e professionisti')}
    </fieldset>
    <fieldset>
      <legend>3. Quante persone lavorano nella tua impresa?</legend>
      ${radio('persone', '<10', 'Meno di 10')}
      ${radio('persone', '10+', '10 o più')}
    </fieldset>
    <fieldset>
      <legend>4. Fatturato annuo</legend>
      ${radio('fatturato', '<=2', 'Fino a 2 milioni di euro')}
      ${radio('fatturato', '>2', 'Oltre 2 milioni di euro')}
      ${radio('fatturato', 'nonso', 'Non lo so')}
    </fieldset>
    <fieldset>
      <legend>5. Totale di bilancio annuo</legend>
      ${radio('bilancio', '<=2', 'Fino a 2 milioni di euro')}
      ${radio('bilancio', '>2', 'Oltre 2 milioni di euro')}
      ${radio('bilancio', 'nonso', 'Non lo so')}
    </fieldset>
    <fieldset>
      <legend>6. Sei una pubblica amministrazione?</legend>
      ${radio('pa', 'no', 'No')}
      ${radio('pa', 'si', 'Sì')}
    </fieldset>
    <fieldset>
      <legend>7. Fatturato medio degli ultimi tre anni oltre 500 milioni di euro?</legend>
      ${radio('fatturato500', 'no', 'No')}
      ${radio('fatturato500', 'si', 'Sì')}
    </fieldset>
    <p class="field-error" data-wizard-error role="alert"></p>
    <button class="button button--primary" type="submit">Mostra il risultato</button>
  </form>

  <aside class="side-note" aria-labelledby="come-valutiamo">
    <h2 id="come-valutiamo">Come valutiamo</h2>
    <p>Applichiamo le definizioni della Direttiva (UE) 2019/882: i servizi coperti (art. 2), la definizione di microimpresa (art. 3, punto 23) e la sua esenzione per i servizi (art. 4, paragrafo 5), più la Legge 4/2004 per le imprese molto grandi.</p>
    <p>Dubbi sulle soglie? Leggi gli <a href="${ctx.url('/guida/eaa-microimprese/')}">esempi di calcolo per le microimprese</a>.</p>
    <p>È una prima valutazione, non una consulenza legale: nei casi dubbi confrontati con un professionista.</p>
  </aside>
</div>

<section class="wrap section" aria-live="polite" data-wizard-result tabindex="-1"></section>
`,
});

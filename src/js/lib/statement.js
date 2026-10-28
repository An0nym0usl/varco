// Builds the "Informazioni sull'accessibilità del servizio" a service provider must publish in its
// general terms or an equivalent document (Directive (EU) 2019/882, art. 13(2) and Annex V).
import { html, esc, safeUrl } from './escape.js';

export const STATUS = {
  conforme: 'Il servizio è conforme ai requisiti di accessibilità applicabili, sulla base della valutazione descritta in questa pagina.',
  parziale: 'Il servizio è parzialmente conforme ai requisiti di accessibilità applicabili: alcune parti presentano le limitazioni elencate di seguito, che stiamo correggendo.',
  'non-conforme': 'Il servizio non è ancora conforme ai requisiti di accessibilità applicabili. Di seguito trovi le principali limitazioni note e le alternative disponibili.',
};

export const METHODS = {
  autovalutazione: 'autovalutazione, con test automatici (axe-core) e controlli manuali guidati',
  'terza-parte': 'valutazione effettuata da un soggetto terzo',
};

export function formatDateIt(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(t));
}

const clean = (v, max = 4000) => String(v ?? '').trim().slice(0, max);
const paragraphs = (text) => clean(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export function statementModel(input = {}) {
  const status = STATUS[input.stato] ? input.stato : 'parziale';
  const method = METHODS[input.metodo] ? input.metodo : 'autovalutazione';
  return {
    azienda: clean(input.azienda, 200),
    servizio: clean(input.servizio, 200) || 'il nostro servizio online',
    sito: safeUrl(input.sito),
    descrizione: paragraphs(input.descrizione),
    funzionamento: paragraphs(input.funzionamento),
    status,
    misure: paragraphs(input.misure),
    standard: clean(input.standard, 200) || 'norma europea EN 301 549, che richiama le WCAG 2.1 livello AA',
    problemi: (Array.isArray(input.problemi) ? input.problemi : []).map((p) => clean(p, 300)).filter(Boolean).slice(0, 40),
    alternative: paragraphs(input.alternative),
    email: clean(input.email, 200),
    telefono: clean(input.telefono, 60),
    tempi: clean(input.tempi, 60) || '30 giorni',
    data: formatDateIt(input.data) || formatDateIt(new Date().toISOString()),
    method,
  };
}

export function buildStatementHtml(input, { credit = true, creditUrl = '' } = {}) {
  const m = statementModel(input);
  const p = (list) => list.map((t) => html`<p>${t}</p>`);
  const who = m.azienda ? html` fornito da ${m.azienda}` : '';
  const site = m.sito ? html` (<a href="${m.sito}">${m.sito}</a>)` : '';
  const contacts = [
    m.email && html`<li>Email: <a href="mailto:${m.email}">${m.email}</a></li>`,
    m.telefono && html`<li>Telefono: ${m.telefono}</li>`,
  ].filter(Boolean);
  const out = html`<section class="varco-accessibilita" lang="it">
<h2>Informazioni sull'accessibilità del servizio</h2>
<p>Queste informazioni riguardano ${m.servizio}${who}${site} e sono pubblicate ai sensi della Direttiva (UE) 2019/882 (European Accessibility Act) e del D.Lgs. 82/2022.</p>
<h3>Descrizione generale del servizio</h3>
${m.descrizione.length ? p(m.descrizione) : html`<p>[Descrivi in poche frasi il servizio offerto.]</p>`}
<h3>Come funziona il servizio</h3>
${m.funzionamento.length ? p(m.funzionamento) : html`<p>[Spiega i passaggi principali: ricerca, scelta, acquisto o prenotazione, pagamento, assistenza.]</p>`}
<h3>Come il servizio soddisfa i requisiti di accessibilità</h3>
<p>${STATUS[m.status]}</p>
<p>Il riferimento tecnico adottato è la ${m.standard}.</p>
${p(m.misure)}
${m.problemi.length ? html`<h3>Limitazioni note</h3>
<ul>${m.problemi.map((t) => html`<li>${t}</li>`)}</ul>` : ''}
${m.alternative.length ? html`<h3>Alternative accessibili</h3>
${p(m.alternative)}` : ''}
<h3>Segnalazioni e richieste</h3>
<p>Se incontri un ostacolo o vuoi ricevere le informazioni in un formato diverso, contattaci. Rispondiamo entro ${m.tempi}.</p>
${contacts.length ? html`<ul>${contacts}</ul>` : html`<p>[Inserisci almeno un contatto.]</p>`}
<p>Se la risposta non è soddisfacente puoi rivolgerti all'autorità di vigilanza competente: per la maggior parte dei servizi digitali è l'Agenzia per l'Italia Digitale (AgID, <a href="https://www.agid.gov.it/">www.agid.gov.it</a>).</p>
<h3>Valutazione</h3>
<p>Ultima valutazione: ${m.data}. Metodo: ${METHODS[m.method]}.</p>
${credit ? html`<p><small>Verifica preparata con <a href="${creditUrl}">Varco</a>.</small></p>` : ''}
</section>`;
  return out.value;
}

export function buildStatementText(input, { credit = true } = {}) {
  const m = statementModel(input);
  const lines = [];
  const add = (...l) => lines.push(...l);
  add("INFORMAZIONI SULL'ACCESSIBILITÀ DEL SERVIZIO", '');
  add(`Queste informazioni riguardano ${m.servizio}${m.azienda ? ` fornito da ${m.azienda}` : ''}${m.sito ? ` (${m.sito})` : ''} e sono pubblicate ai sensi della Direttiva (UE) 2019/882 (European Accessibility Act) e del D.Lgs. 82/2022.`, '');
  add('Descrizione generale del servizio', ...(m.descrizione.length ? m.descrizione : ['[Descrivi il servizio.]']), '');
  add('Come funziona il servizio', ...(m.funzionamento.length ? m.funzionamento : ['[Spiega i passaggi principali.]']), '');
  add('Come il servizio soddisfa i requisiti di accessibilità', STATUS[m.status], `Il riferimento tecnico adottato è la ${m.standard}.`, ...m.misure, '');
  if (m.problemi.length) add('Limitazioni note', ...m.problemi.map((t) => `- ${t}`), '');
  if (m.alternative.length) add('Alternative accessibili', ...m.alternative, '');
  add('Segnalazioni e richieste', `Se incontri un ostacolo o vuoi ricevere le informazioni in un formato diverso, contattaci. Rispondiamo entro ${m.tempi}.`);
  if (m.email) add(`Email: ${m.email}`);
  if (m.telefono) add(`Telefono: ${m.telefono}`);
  add("Se la risposta non è soddisfacente puoi rivolgerti all'autorità di vigilanza competente: per la maggior parte dei servizi digitali è l'Agenzia per l'Italia Digitale (AgID, www.agid.gov.it).", '');
  add('Valutazione', `Ultima valutazione: ${m.data}. Metodo: ${METHODS[m.method]}.`);
  if (credit) add('', 'Verifica preparata con Varco.');
  return lines.join('\n');
}

export { esc };

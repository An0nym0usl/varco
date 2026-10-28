import { $ } from '../lib/ui.js';
import { html } from '../lib/escape.js';
import { assessEaa } from '../lib/wizard.js';
import { read, write } from '../lib/store.js';

const form = $('[data-wizard]');
const out = $('[data-wizard-result]');
const err = $('[data-wizard-error]');
const base = JSON.parse(document.getElementById('varco-config').textContent).base;

function answers() {
  const f = new FormData(form);
  return {
    services: f.getAll('services'),
    clienti: f.get('clienti'), persone: f.get('persone'), fatturato: f.get('fatturato'),
    bilancio: f.get('bilancio'), pa: f.get('pa'), fatturato500: f.get('fatturato500') ?? 'no',
  };
}

function missing(a) {
  if (a.pa === 'si') return '';
  if (!a.services.length) return 'Rispondi alla domanda 1: scegli almeno un servizio, oppure «Nessuno di questi».';
  if (!a.pa) return 'Rispondi alla domanda 6.';
  const none = a.services.length === 1 && a.services[0] === 'nessuno';
  if (!none && !a.clienti) return 'Rispondi alla domanda 2: a chi offri i servizi.';
  if (!none && !a.persone) return 'Rispondi alla domanda 3: quante persone lavorano nella tua impresa.';
  return '';
}

function restore() {
  const saved = read('wizard', null);
  if (!saved) return;
  for (const el of form.elements) {
    if (el.type === 'checkbox') el.checked = (saved.services ?? []).includes(el.value);
    else if (el.type === 'radio') el.checked = saved[el.name] === el.value;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const a = answers();
  const problem = missing(a);
  err.textContent = problem;
  if (problem) return;
  write('wizard', a);
  const r = assessEaa(a);
  out.innerHTML = html`<div class="card result result--${r.outcome}">
    <p class="eyebrow">Risultato</p>
    <h2>${r.title}</h2>
    <h3>Perché</h3>
    <ul>${r.reasons.map((t) => html`<li>${t}</li>`)}</ul>
    <h3>Cosa fare adesso</h3>
    <ol>${r.next.map((t) => html`<li>${t}</li>`)}</ol>
    <div class="cta-row">
      <a class="button button--primary" href="${base}/verifica/">Verifica le tue pagine</a>
      <a class="button" href="${base}/guida/european-accessibility-act/">Leggi la guida all'EAA</a>
    </div>
    <h3>Riferimenti</h3>
    <ul>${r.refs.map((ref) => html`<li><a href="${ref.url}">${ref.label}</a></li>`)}</ul>
    <p class="hint">Valutazione indicativa basata sulle tue risposte. Non è una consulenza legale.</p>
  </div>`.value;
  out.focus();
});

restore();

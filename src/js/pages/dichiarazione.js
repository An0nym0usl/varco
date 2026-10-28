import { $, getConfig, currentPlan, copyText, download } from '../lib/ui.js';
import { html } from '../lib/escape.js';
import { read, write, getLastScan, getProjects } from '../lib/store.js';
import { limits } from '../lib/plan.js';
import { ruleTitle } from '../lib/report-view.js';
import { buildStatementHtml, buildStatementText } from '../lib/statement.js';
import CHECKLIST from '../../data/checklist.it.js';
import { track } from '../lib/analytics.js';

const cfg = getConfig();
const form = $('[data-statement-form]');
const preview = $('[data-statement-preview]');
const statusEl = $('[data-statement-status]');
const lim = limits(currentPlan());
const creditUrl = `${cfg.origin}${cfg.base}/`;

// Known issues: every rule failed in the last scan or in saved reports, with the pages it affects.
function knownIssues() {
  const scans = [getLastScan(), ...getProjects().flatMap((p) => p.scans)].filter(Boolean);
  const seen = new Map();
  for (const s of scans) for (const r of s.violations) {
    const k = r.id;
    if (!seen.has(k)) seen.set(k, { id: k, title: ruleTitle(r), elements: 0, pages: new Set() });
    const item = seen.get(k);
    item.elements += r.nodeCount;
    item.pages.add(s.url || s.title || s.id);
  }
  return [...seen.values()];
}

const issues = knownIssues();
const checklist = read('checklist', {});
const failedChecks = CHECKLIST.filter((c) => checklist[c.id] === 'ko');

function renderIssueChoices(selected) {
  const box = $('[data-known-issues]');
  const items = [
    ...issues.map((i) => ({ key: `r:${i.id}`, label: `${i.title} (${i.elements} elementi${i.pages.size > 1 ? `, ${i.pages.size} pagine` : ''})`, text: i.title })),
    ...failedChecks.map((c) => ({ key: `c:${c.id}`, label: `Controllo manuale non superato: ${c.t}`, text: c.t })),
  ];
  if (!items.length) return;
  box.innerHTML = html`<p class="hint">Problemi trovati nelle tue analisi e nella checklist. Togli la spunta a quelli già risolti.</p>
    ${items.map((it) => html`<label class="choice"><input type="checkbox" name="problema" value="${it.key}" data-text="${it.text}"${selected === null || selected.includes(it.key) ? html` checked` : ''}> <span>${it.label}</span></label>`)}`.value;
}

function values() {
  const f = new FormData(form);
  const chosen = [...form.querySelectorAll('input[name="problema"]:checked')].map((i) => i.dataset.text);
  const extra = String(f.get('altriProblemi') ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
  return {
    azienda: f.get('azienda'), servizio: f.get('servizio'), sito: f.get('sito'), descrizione: f.get('descrizione'),
    funzionamento: f.get('funzionamento'), stato: f.get('stato'), misure: f.get('misure'), problemi: [...chosen, ...extra],
    alternative: f.get('alternative'), email: f.get('email'), telefono: f.get('telefono'), tempi: f.get('tempi'),
    data: f.get('data'), metodo: f.get('metodo'),
  };
}

function save() {
  const f = new FormData(form);
  const draft = Object.fromEntries([...f.entries()].filter(([k]) => k !== 'problema'));
  draft.problemiScelti = f.getAll('problema');
  write('statement', draft);
}

function render() {
  preview.innerHTML = buildStatementHtml(values(), { credit: lim.statementCredit, creditUrl });
}

function restore() {
  const d = read('statement', null);
  renderIssueChoices(d ? d.problemiScelti ?? [] : null);
  if (!d) {
    form.elements.data.value = new Date().toISOString().slice(0, 10);
    return;
  }
  for (const el of form.elements) {
    if (!el.name || el.name === 'problema' || !(el.name in d)) continue;
    if (el.type === 'radio') el.checked = d[el.name] === el.value;
    else el.value = d[el.name];
  }
}

restore();
const suggestion = $('[data-status-suggestion]');
if (issues.length || failedChecks.length) suggestion.textContent = `Dalle tue analisi risultano ${issues.length} tipi di problema e ${failedChecks.length} controlli manuali non superati: lo stato corretto è «parzialmente conforme» o «non conforme».`;
else suggestion.textContent = "Scegli «conforme» solo se l'analisi automatica e tutti i controlli manuali sono superati.";
$('[data-credit-note]').textContent = lim.statementCredit
  ? 'Con il piano Gratis il testo termina con una breve citazione di Varco. I piani Pro e Agenzia la rimuovono.'
  : '';
render();

form.addEventListener('input', () => { save(); render(); });
form.addEventListener('change', () => { save(); render(); });

const done = (msg) => { statusEl.textContent = msg; };
const used = (format) => track('statement_export', { format, issues: issues.length, plan: lim.plan });
$('[data-copy-html]').addEventListener('click', async () => { used('html'); done(await copyText(buildStatementHtml(values(), { credit: lim.statementCredit, creditUrl })) ? 'HTML copiato.' : 'Copia non riuscita.'); });
$('[data-copy-text]').addEventListener('click', async () => { used('text'); done(await copyText(buildStatementText(values(), { credit: lim.statementCredit })) ? 'Testo copiato.' : 'Copia non riuscita.'); });
$('[data-download]').addEventListener('click', () => {
  used('file');
  const body = buildStatementHtml(values(), { credit: lim.statementCredit, creditUrl });
  download('informazioni-accessibilita.html', `<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Informazioni sull'accessibilità del servizio</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`, 'text/html;charset=utf-8');
  done('File scaricato.');
});

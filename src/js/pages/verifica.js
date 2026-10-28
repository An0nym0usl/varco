import { $, $$, copyText, getConfig } from '../lib/ui.js';
import { runDemo, runPaste, reportUrl, setStatus } from './scan-actions.js';
import { scanUrl, PSI_ERRORS } from '../lib/psi.js';
import { setLastScan } from '../lib/store.js';
import { track } from '../lib/analytics.js';
import { summarize } from '../lib/normalize.js';

const cfg = getConfig();
const hint = $('[data-bookmarklet-hint]');
const bm = $('[data-bookmarklet]');
bm?.addEventListener('click', (e) => {
  e.preventDefault();
  hint.textContent = 'Non cliccarlo qui: trascinalo nella barra dei preferiti, poi usalo sulla pagina da controllare.';
});
// Dragging the button is the clearest signal of an install attempt.
bm?.addEventListener('dragstart', () => track('bookmarklet_drag'));

$('[data-copy-bookmarklet]')?.addEventListener('click', async () => {
  const ok = await copyText($('#codice-pulsante').value);
  track('bookmarklet_copy');
  hint.textContent = ok ? 'Codice copiato. Ora crea un nuovo preferito e incollalo nel campo dell\'indirizzo.' : 'Copia non riuscita: seleziona il codice nel riquadro e copialo a mano.';
});

const demoButtons = $$('[data-demo-run]');
demoButtons.forEach((b) => b.addEventListener('click', async () => {
  if (await runDemo(demoButtons)) location.assign(reportUrl());
}));

function fieldError(form, name, inputName, msg) {
  const input = form.elements[inputName];
  $(`[data-error-for="${name}"]`, form).textContent = msg;
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}

const urlForm = $('[data-url-form]');
urlForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = urlForm.querySelector('button[type="submit"]');
  const value = urlForm.elements.url.value.trim();
  const withScheme = value && !/^https?:\/\//i.test(value) ? `https://${value}` : value;
  if (!fieldError(urlForm, 'scanurl', 'url', withScheme ? '' : PSI_ERRORS.invalid_url)) { urlForm.elements.url.focus(); return; }
  button.disabled = true;
  setStatus('Analisi in corso con Google PageSpeed Insights: può richiedere 20–40 secondi…');
  track('url_scan_start');
  const res = await scanUrl(withScheme, cfg.psi?.key);
  button.disabled = false;
  if (!res.ok) {
    track('url_scan_error', { reason: res.reason });
    setStatus('');
    fieldError(urlForm, 'scanurl', 'url', PSI_ERRORS[res.reason] ?? PSI_ERRORS.failed);
    urlForm.elements.url.focus();
    return;
  }
  setLastScan(res.scan);
  track('scan_completed', { source: 'url', rules_failed: summarize(res.scan).rulesFailed });
  location.assign(reportUrl());
});

const form = $('[data-paste-form]');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const source = form.elements.html.value.trim();
  const pageUrl = form.elements.url.value.trim();
  let ok = fieldError(form, 'html', 'html', source.length < 20 ? 'Incolla il codice HTML della pagina (almeno qualche riga).' : '');
  let urlOk = true;
  if (pageUrl) {
    try { urlOk = ['http:', 'https:'].includes(new URL(pageUrl).protocol); } catch { urlOk = false; }
  }
  ok = fieldError(form, 'url', 'url', urlOk ? '' : "Scrivi l'indirizzo completo, per esempio https://www.esempio.it/pagina") && ok;
  if (!ok) {
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  if (await runPaste(source, pageUrl, [form.querySelector('button[type="submit"]')])) location.assign(reportUrl());
});

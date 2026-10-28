import { $, $$, copyText } from '../lib/ui.js';
import { runDemo, runPaste, reportUrl } from './scan-actions.js';

const hint = $('[data-bookmarklet-hint]');
const bm = $('[data-bookmarklet]');
bm?.addEventListener('click', (e) => {
  e.preventDefault();
  hint.textContent = 'Non cliccarlo qui: trascinalo nella barra dei preferiti, poi usalo sulla pagina da controllare.';
});

$('[data-copy-bookmarklet]')?.addEventListener('click', async () => {
  const ok = await copyText($('#codice-pulsante').value);
  hint.textContent = ok ? 'Codice copiato. Ora crea un nuovo preferito e incollalo nel campo dell\'indirizzo.' : 'Copia non riuscita: seleziona il codice nel riquadro e copialo a mano.';
});

const demoButtons = $$('[data-demo-run]');
demoButtons.forEach((b) => b.addEventListener('click', async () => {
  if (await runDemo(demoButtons)) location.assign(reportUrl());
}));

const form = $('[data-paste-form]');
const errorFor = (name) => $(`[data-error-for="${name}"]`, form);
function fieldError(name, msg) {
  const input = form.elements[name];
  errorFor(name).textContent = msg;
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const source = form.elements.html.value.trim();
  const pageUrl = form.elements.url.value.trim();
  let ok = fieldError('html', source.length < 20 ? 'Incolla il codice HTML della pagina (almeno qualche riga).' : '');
  let urlOk = true;
  if (pageUrl) {
    try { urlOk = ['http:', 'https:'].includes(new URL(pageUrl).protocol); } catch { urlOk = false; }
  }
  ok = fieldError('url', urlOk ? '' : "Scrivi l'indirizzo completo, per esempio https://www.esempio.it/pagina") && ok;
  if (!ok) {
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  if (await runPaste(source, pageUrl, [form.querySelector('button[type="submit"]')])) location.assign(reportUrl());
});

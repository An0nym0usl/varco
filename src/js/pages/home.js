import { $, $$ } from '../lib/ui.js';
import { html } from '../lib/escape.js';
import { countsHtml, summaryText } from '../lib/report-view.js';
import { runDemo, setStatus, reportUrl } from './scan-actions.js';

const buttons = $$('[data-demo-run]');
const out = $('[data-demo-result]');

buttons.forEach((b) => b.addEventListener('click', async () => {
  out.hidden = true;
  const scan = await runDemo(buttons);
  if (!scan) return;
  setStatus('Analisi completata.');
  out.innerHTML = html`<h3>Risultato</h3>${countsHtml(scan)}<p>${summaryText(scan)}</p>
    <p><a class="button button--primary" href="${reportUrl()}">Apri il report completo</a></p>`.value;
  out.hidden = false;
  $('a', out).focus();
}));

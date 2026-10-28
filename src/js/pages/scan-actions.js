// Demo and paste scans, shared by the home page and the verification page.
import { $, getConfig } from '../lib/ui.js';
import { scanInFrame, buildSrcdoc } from '../lib/scan-frame.js';
import { setLastScan } from '../lib/store.js';
import { summarize } from '../lib/normalize.js';
import { track } from '../lib/analytics.js';

const cfg = getConfig();
const ERR = {
  timeout: "L'analisi ha impiegato troppo tempo. Riprova; se la pagina è molto pesante usa il pulsante Varco.",
};

export function setStatus(msg) {
  const el = $('[data-scan-status]');
  if (el) el.textContent = msg;
}

function busy(buttons, on) {
  buttons.forEach((b) => { b.disabled = on; b.setAttribute('aria-busy', String(on)); });
}

export async function runDemo(buttons = []) {
  busy(buttons, true);
  setStatus("Analisi del negozio di esempio in corso…");
  track('demo_run', { page: location.pathname.includes('/verifica/') ? 'verifica' : 'home' });
  try {
    const scan = await scanInFrame({ src: `${cfg.base}/demo/negozio/?varco-run=1`, source: 'demo', container: $('[data-scan-stage]') });
    setLastScan(scan);
    track('scan_completed', { source: 'demo', rules_failed: summarize(scan).rulesFailed });
    return scan;
  } catch (e) {
    setStatus(ERR[e.message] ?? `Analisi non riuscita: ${e.message}`);
    return null;
  } finally {
    busy(buttons, false);
  }
}

export async function runPaste(source, pageUrl, buttons = []) {
  busy(buttons, true);
  setStatus('Analisi del codice in corso…');
  try {
    const root = `${location.origin}${cfg.base}`;
    const srcdoc = buildSrcdoc(source, { pageUrl, scriptUrls: [`${root}/vendor/axe.min.js?v=${cfg.build}`, `${root}/js/runner-frame.js?v=${cfg.build}`] });
    const scan = await scanInFrame({ srcdoc, source: 'paste', container: $('[data-scan-stage]') });
    setLastScan(scan);
    track('scan_completed', { source: 'paste', rules_failed: summarize(scan).rulesFailed });
    return scan;
  } catch (e) {
    setStatus(ERR[e.message] ?? `Analisi non riuscita: ${e.message}`);
    return null;
  } finally {
    busy(buttons, false);
  }
}

export const reportUrl = () => `${cfg.base}/report/`;

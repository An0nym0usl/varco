import { $, getConfig, currentPlan, download, formatDateTime, hostOf } from '../lib/ui.js';
import { html } from '../lib/escape.js';
import { normalizeScan, reviveScan, summarize } from '../lib/normalize.js';
import { track } from '../lib/analytics.js';
import { getLastScan, setLastScan, getProjects, saveScan, deleteScan, findScan, read, write } from '../lib/store.js';
import { limits } from '../lib/plan.js';
import { reportHtml, summaryText, ruleTitle } from '../lib/report-view.js';
import { scanToCsv, scanToJson, parseImport, compareScans } from '../lib/export.js';

const cfg = getConfig();
const base = cfg.base;
const statusEl = $('[data-report-status]');
const body = $('[data-report-body]');
const empty = $('[data-report-empty]');
let current = null;

const status = (msg) => { statusEl.textContent = msg; };
const actionStatus = (msg) => { const el = $('[data-action-status]'); if (el) el.textContent = msg; };
const upsell = (what) => `${what} è incluso nei piani Pro e Agenzia.`;

function slug(scan) {
  const host = hostOf(scan.url) || 'pagina';
  return `varco-${host}-${scan.scannedAt.slice(0, 10)}`;
}

function brandingSlot() {
  const slot = $('[data-branding-slot]');
  const lim = limits(currentPlan());
  const b = read('agency', {});
  slot.innerHTML = html`<details class="disclosure"><summary>Personalizza il report per il cliente</summary>
    ${lim.whiteLabel ? html`<form data-branding-form>
      <label for="b-agency">Nome dell'agenzia</label><input id="b-agency" name="agency" value="${b.agency ?? ''}">
      <label for="b-client">Nome del cliente</label><input id="b-client" name="client" value="${b.client ?? ''}">
      <label for="b-logo">Logo (PNG o JPG, massimo 300 KB)</label><input id="b-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp">
      <p><button class="button" type="submit">Applica al report</button></p>
    </form>` : html`<p class="upsell">${upsell('Il report con il tuo logo e il nome del cliente')} <a href="${base}/prezzi/">Scopri il piano Agenzia</a>.</p>`}
  </details>`.value;
  const form = $('[data-branding-form]', slot);
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const next = { agency: form.elements.agency.value.trim().slice(0, 120), client: form.elements.client.value.trim().slice(0, 120), logo: b.logo ?? '' };
    const file = form.elements.logo.files[0];
    const done = () => { write('agency', next); render(current); actionStatus('Personalizzazione applicata: la vedrai nella versione stampata.'); };
    if (!file) return done();
    if (file.size > 300 * 1024) { actionStatus('Il logo supera i 300 KB: usa un file più leggero.'); return; }
    const reader = new FileReader();
    reader.onload = () => { next.logo = String(reader.result); done(); };
    reader.readAsDataURL(file);
  });
}

function compareSlot(scan) {
  const slot = $('[data-compare-slot]');
  const others = getProjects().flatMap((p) => p.scans).filter((s) => s.id !== scan.id && s.url && s.url === scan.url);
  if (!others.length) { slot.innerHTML = ''; return; }
  if (!limits(currentPlan()).compare) {
    slot.innerHTML = html`<p class="upsell">Hai ${others.length} analisi precedenti di questa pagina. ${upsell('Il confronto prima/dopo')} <a href="${base}/prezzi/">Vedi i piani</a>.</p>`.value;
    return;
  }
  const prev = others.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt))[0];
  const c = compareScans(prev, scan);
  const title = (id) => ruleTitle(prev.violations.find((r) => r.id === id) ?? scan.violations.find((r) => r.id === id) ?? { id });
  slot.innerHTML = html`<section class="card compare" aria-labelledby="confronto">
    <h2 id="confronto">Confronto con l'analisi del ${formatDateTime(prev.scannedAt)}</h2>
    <p>Elementi con problemi: da ${c.elementsBefore} a ${c.elementsAfter}.</p>
    ${c.fixed.length ? html`<h3>Risolti</h3><ul>${c.fixed.map((id) => html`<li>${title(id)}</li>`)}</ul>` : ''}
    ${c.added.length ? html`<h3>Nuovi</h3><ul>${c.added.map((id) => html`<li>${title(id)}</li>`)}</ul>` : ''}
    ${c.changed.length ? html`<h3>Cambiati</h3><ul>${c.changed.map((x) => html`<li>${title(x.id)}: da ${x.before} a ${x.after} elementi</li>`)}</ul>` : ''}
  </section>`.value;
}

function render(scan) {
  current = scan;
  empty.hidden = true;
  $('[data-report-title]').textContent = scan.title ? `Report: ${scan.title}` : 'Report di accessibilità';
  $('[data-report-lead]').textContent = summaryText(scan);
  body.innerHTML = reportHtml(scan, { base, branding: limits(currentPlan()).whiteLabel ? read('agency', {}) : null, dateText: formatDateTime(scan.scannedAt) }).value;
  brandingSlot();
  compareSlot(scan);
}

function onAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn || !current) return;
  const lim = limits(currentPlan());
  const act = btn.dataset.action;
  if (act === 'save') {
    const res = saveScan(current, { projectName: hostOf(current.url) || 'Analisi senza indirizzo', maxSaved: lim.maxSavedScans });
    track('report_saved', { result: res.ok ? 'ok' : res.reason, plan: lim.plan });
    if (res.ok) actionStatus(res.already ? 'Questo report è già salvato.' : 'Report salvato in questo browser.');
    else if (res.reason === 'limit') actionStatus(`Hai raggiunto il limite di ${lim.maxSavedScans} report salvati del piano Gratis. Elimina un report o passa a Pro.`);
    else actionStatus('Il browser non permette di salvare (memoria piena o navigazione privata).');
    renderProjects();
  } else if (act === 'print') {
    track('report_print', { branded: lim.whiteLabel });
    const closed = [...document.querySelectorAll('details:not([open])')];
    closed.forEach((d) => { d.open = true; });
    window.print();
    closed.forEach((d) => { d.open = false; });
  } else if (act === 'csv' || act === 'json') {
    track('export', { format: act, allowed: lim.exportData });
    if (!lim.exportData) { actionStatus(`${upsell("L'esportazione")} Puoi comunque stampare il report o salvarlo in PDF.`); return; }
    if (act === 'csv') download(`${slug(current)}.csv`, `﻿${scanToCsv(current, ruleTitle)}`, 'text/csv;charset=utf-8');
    else download(`${slug(current)}.json`, scanToJson(current), 'application/json');
    actionStatus('File scaricato.');
  }
}

function renderProjects() {
  const host = $('[data-projects]');
  const projects = getProjects();
  if (!projects.length) { host.innerHTML = html`<p class="hint">Nessun report salvato. Usa «Salva nel progetto» dopo un'analisi.</p>`.value; return; }
  host.innerHTML = projects.map((p) => html`<h3>${p.name}</h3><ul class="project-list">${p.scans.map((s) => html`<li>
      <span class="p-title">${s.title || s.url || 'Pagina senza titolo'}</span>
      <span class="hint">${formatDateTime(s.scannedAt)} · ${s.violations.length} tipi di problema</span>
      <a class="button button--small" href="${base}/report/?id=${encodeURIComponent(s.id)}">Apri</a>
      <button class="button button--small" type="button" data-delete="${s.id}">Elimina<span class="visually-hidden"> ${s.title || s.url}</span></button>
    </li>`)}</ul>`.value).join('');
}

$('[data-projects]').addEventListener('click', (e) => {
  const id = e.target.closest('[data-delete]')?.dataset.delete;
  if (!id) return;
  deleteScan(id);
  renderProjects();
  status('Report eliminato.');
});

$('[data-import-form]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const file = form.elements.file.files[0];
  const text = file ? await file.text() : form.elements.text.value;
  try {
    const data = parseImport(text);
    const scan = data && data.id && data.v === 1 ? reviveScan(data) : normalizeScan(data, 'import');
    setLastScan(scan);
    render(scan);
    track('scan_imported');
    status('Risultati importati.');
    $('h1').scrollIntoView();
  } catch {
    status('Non riesco a leggere questi risultati: incolla il testo copiato dal pulsante Varco o un file .json esportato da Varco.');
  }
});

body.addEventListener('click', onAction);

function receiveFromAgent() {
  status('In attesa dei risultati dal pulsante Varco…');
  let received = false;
  const ping = () => { try { window.opener.postMessage({ type: 'varco:ready' }, '*'); } catch { /* opener gone */ } };
  const timer = setInterval(ping, 400);
  window.addEventListener('message', function onMessage(ev) {
    if (ev.source !== window.opener || !ev.data || ev.data.type !== 'varco:scan' || received) return;
    received = true;
    clearInterval(timer);
    window.removeEventListener('message', onMessage);
    try {
      const scan = normalizeScan(ev.data.scan, 'bookmarklet');
      setLastScan(scan);
      track('scan_completed', { source: 'bookmarklet', rules_failed: summarize(scan).rulesFailed });
      history.replaceState(null, '', location.pathname);
      render(scan);
      status('Risultati ricevuti dal pulsante Varco.');
    } catch {
      status('I risultati ricevuti non sono validi.');
    }
  });
  ping();
  setTimeout(() => {
    clearInterval(timer);
    if (!received) { status('Nessun risultato ricevuto. Torna sulla pagina analizzata e usa «Copia risultati», poi importali qui sotto.'); showFallback(); }
  }, 15000);
}

function showFallback() {
  const last = getLastScan();
  if (last) render(last);
  else empty.hidden = false;
}

const id = new URLSearchParams(location.search).get('id');
renderProjects();
if (location.hash === '#agent' && window.opener) receiveFromAgent();
else if (id) {
  const s = findScan(id);
  if (s) render(s);
  else { status('Report non trovato in questo browser.'); showFallback(); }
} else showFallback();

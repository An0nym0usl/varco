/* Varco bookmarklet agent. Runs axe-core on the page the user is looking at, shows a summary
   panel and hands the results to the Varco report through postMessage. Nothing goes to a server.
   Built into dist/agent.js after axe-core, its Italian locale and compact.js. */
(function () {
  'use strict';
  var ORIGIN = '__VARCO_ORIGIN__';
  var BASE = '__VARCO_BASE__';
  var REPORT_URL = ORIGIN + BASE + '/report/#agent';
  var IMPACT_IT = { critical: 'Critico', serious: 'Grave', moderate: 'Moderato', minor: 'Lieve' };

  if (window.__varcoAgent) { window.__varcoAgent.show(); return; }

  var host, root, panel, statusEl, listEl, countsEl, actionsEl, lastScan = null, flagged = [], flagStyle = null;

  var CSS = [
    ':host{all:initial}',
    '.panel{position:fixed;right:16px;bottom:16px;z-index:2147483647;width:min(380px,calc(100vw - 32px));max-height:min(78vh,640px);overflow:auto;',
    'background:#15181b;color:#f3f4f1;border:3px solid #ffc20e;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.45);',
    'font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:14px 16px 16px}',
    '.top{display:flex;align-items:center;gap:10px;margin-bottom:8px}',
    '.logo{width:28px;height:28px;flex:none}',
    'h2{font-size:17px;margin:0;flex:1;font-weight:800;letter-spacing:.01em}',
    'button{font:inherit;cursor:pointer;border-radius:8px;border:2px solid #f3f4f1;background:transparent;color:#f3f4f1;padding:7px 11px;min-height:36px}',
    'button.primary{background:#ffc20e;border-color:#ffc20e;color:#15181b;font-weight:700}',
    'button.icon{padding:4px 9px;min-width:36px}',
    'button:focus-visible{outline:3px solid #ffc20e;outline-offset:2px}',
    'button.primary:focus-visible{outline-color:#f3f4f1}',
    '.status{margin:0 0 10px}',
    '.counts{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 12px;padding:0;list-style:none}',
    '.counts li{background:#23282d;border-radius:8px;padding:6px 4px;text-align:center;font-size:12px}',
    '.counts b{display:block;font-size:19px;color:#ffc20e}',
    'ol{margin:0 0 12px;padding:0;list-style:none}',
    'ol li{display:flex;gap:8px;align-items:flex-start;border-top:1px solid #2e343a;padding:8px 0}',
    'ol li span{flex:1}',
    'small{color:#c4c9cf}',
    '.actions{display:flex;flex-wrap:wrap;gap:8px}',
    '.note{margin:12px 0 0;font-size:13px;color:#c4c9cf}',
    'textarea{width:100%;min-height:90px;margin-top:8px;font:12px/1.4 ui-monospace,monospace;background:#0f1215;color:#f3f4f1;border:1px solid #4a525a;border-radius:6px}'
  ].join('');

  function node(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function setStatus(msg) { statusEl.textContent = msg; }

  function logo() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 32 32'); svg.setAttribute('class', 'logo'); svg.setAttribute('aria-hidden', 'true');
    var r = document.createElementNS(ns, 'rect');
    r.setAttribute('width', '32'); r.setAttribute('height', '32'); r.setAttribute('rx', '7'); r.setAttribute('fill', '#ffc20e');
    var p = document.createElementNS(ns, 'path');
    p.setAttribute('d', 'M10 27V15a6 6 0 0 1 12 0v12z'); p.setAttribute('fill', '#15181b');
    svg.appendChild(r); svg.appendChild(p);
    return svg;
  }

  function build() {
    host = node('div', { id: 'varco-agent-host' });
    root = host.attachShadow({ mode: 'open' });
    var style = node('style'); style.textContent = CSS; root.appendChild(style);
    panel = node('section', { class: 'panel', role: 'dialog', 'aria-labelledby': 'varco-title', tabindex: '-1' });
    var top = node('div', { class: 'top' });
    top.appendChild(logo());
    top.appendChild(node('h2', { id: 'varco-title' }, 'Varco · accessibilità'));
    var close = node('button', { class: 'icon', type: 'button', 'aria-label': 'Chiudi Varco' }, '✕');
    close.addEventListener('click', hide);
    top.appendChild(close);
    statusEl = node('p', { class: 'status', role: 'status' }, 'Analisi della pagina in corso…');
    countsEl = node('ul', { class: 'counts', 'aria-label': 'Problemi per gravità' });
    listEl = node('ol', { 'aria-label': 'Problemi principali' });
    actionsEl = node('div', { class: 'actions' });
    var note = node('p', { class: 'note' }, 'I test automatici trovano solo una parte dei problemi: completa i controlli manuali su Varco.');
    [top, statusEl, countsEl, listEl, actionsEl, note].forEach(function (c) { panel.appendChild(c); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
    root.appendChild(panel);
    document.documentElement.appendChild(host);
    panel.focus();
  }

  function clearFlags() {
    flagged.forEach(function (e) { e.removeAttribute('data-varco-flag'); });
    flagged = [];
  }

  function flag(selector) {
    if (!selector || selector.indexOf(' | ') !== -1 || selector.indexOf(' >>> ') !== -1) return null;
    var e = null;
    try { e = document.querySelector(selector); } catch (err) { return null; }
    if (!e) return null;
    if (!flagStyle) {
      flagStyle = node('style', { 'data-varco': '' });
      flagStyle.textContent = '[data-varco-flag]{outline:3px solid #b42318!important;outline-offset:2px!important;box-shadow:0 0 0 6px rgba(255,194,14,.55)!important}';
      document.head.appendChild(flagStyle);
    }
    e.setAttribute('data-varco-flag', '');
    flagged.push(e);
    return e;
  }

  function showRule(rule) {
    clearFlags();
    var first = null;
    rule.nodes.forEach(function (n) { var e = flag(n.target); if (e && !first) first = e; });
    if (first) {
      first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setStatus('Evidenziati ' + flagged.length + ' elementi per: ' + rule.help);
    } else {
      setStatus('Questi elementi non si possono evidenziare qui (sono in frame o shadow DOM): li trovi nel report.');
    }
  }

  function copyResults() {
    var text = JSON.stringify({ format: 'varco-scan', version: 1, scan: lastScan });
    var done = function () { setStatus('Risultati copiati. Incollali nella pagina Report di Varco (Importa risultati).'); };
    var fallback = function () {
      var ta = node('textarea', { 'aria-label': 'Risultati in formato JSON', readonly: '' });
      ta.value = text; actionsEl.appendChild(ta); ta.focus(); ta.select();
      setStatus('Copia manualmente il testo selezionato (Ctrl+C) e incollalo nel Report di Varco.');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  function openReport() {
    var w = window.open(REPORT_URL, '_blank');
    if (!w) { setStatus('Il browser ha bloccato la nuova scheda. Consenti i popup per questo sito oppure usa «Copia risultati».'); return; }
    var sent = false;
    function onMessage(ev) {
      if (ev.source !== w || ev.origin !== ORIGIN || !ev.data || ev.data.type !== 'varco:ready' || sent) return;
      sent = true;
      w.postMessage({ type: 'varco:scan', scan: lastScan }, ORIGIN);
      window.removeEventListener('message', onMessage);
      setStatus('Report completo aperto in una nuova scheda.');
    }
    window.addEventListener('message', onMessage);
    setTimeout(function () {
      if (sent) return;
      window.removeEventListener('message', onMessage);
      setStatus('Il report non ha risposto (il sito potrebbe isolare le finestre). Usa «Copia risultati» e importali nel Report di Varco.');
    }, 20000);
  }

  function render(scan) {
    var counts = { critical: 0, serious: 0, moderate: 0, minor: 0 }, elements = 0;
    scan.violations.forEach(function (r) { counts[r.impact] = (counts[r.impact] || 0) + 1; elements += r.nodeCount; });
    setStatus(scan.violations.length
      ? 'Trovati ' + scan.violations.length + ' tipi di problema su ' + elements + ' elementi. Regole superate: ' + scan.passes.length + '.'
      : 'Nessun problema rilevato automaticamente (' + scan.passes.length + ' regole superate). Completa comunque i controlli manuali.');
    ['critical', 'serious', 'moderate', 'minor'].forEach(function (k) {
      var li = node('li'); var b = node('b', null, String(counts[k])); li.appendChild(b); li.appendChild(document.createTextNode(IMPACT_IT[k])); countsEl.appendChild(li);
    });
    scan.violations.slice(0, 8).forEach(function (r) {
      var li = node('li');
      var span = node('span'); span.appendChild(document.createTextNode(r.help + ' '));
      span.appendChild(node('small', null, IMPACT_IT[r.impact] + ' · ' + r.nodeCount + (r.nodeCount === 1 ? ' elemento' : ' elementi')));
      var b = node('button', { type: 'button', 'aria-label': 'Mostra nella pagina: ' + r.help }, 'Mostra');
      b.addEventListener('click', function () { showRule(r); });
      li.appendChild(span); li.appendChild(b); listEl.appendChild(li);
    });
    var open = node('button', { class: 'primary', type: 'button' }, 'Apri il report completo');
    open.addEventListener('click', openReport);
    var copy = node('button', { type: 'button' }, 'Copia risultati');
    copy.addEventListener('click', copyResults);
    actionsEl.appendChild(open); actionsEl.appendChild(copy);
  }

  function run() {
    try { if (window.VARCO_AXE_LOCALE) axe.configure({ locale: window.VARCO_AXE_LOCALE }); } catch (e) { /* keep English messages */ }
    axe.run({ exclude: [['#varco-agent-host']] }, VarcoScan.options()).then(function (results) {
      lastScan = VarcoScan.compact(results, { url: location.href, title: document.title });
      render(lastScan);
    }).catch(function (err) {
      setStatus('Analisi non riuscita: ' + (err && err.message ? err.message : String(err)));
    });
  }

  function hide() { clearFlags(); host.style.display = 'none'; }
  function show() { host.style.display = ''; panel.focus(); }

  window.__varcoAgent = { show: show, hide: hide };
  build();
  run();
})();

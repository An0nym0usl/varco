/* Runs axe-core inside Varco's sandboxed frame (demo shop and pasted HTML) and posts the result
   to the parent page. The frame has an opaque origin, so it cannot read Varco's storage. */
(function () {
  'use strict';
  if (window.parent === window) return;
  var html = document.documentElement;
  if (html.hasAttribute('data-varco-demo') && location.search.indexOf('varco-run') === -1) return;
  var started = false;

  function go() {
    if (started) return;
    started = true;
    try { if (window.VARCO_AXE_LOCALE) axe.configure({ locale: window.VARCO_AXE_LOCALE }); } catch (e) { /* English fallback */ }
    var url = html.getAttribute('data-varco-url') || (html.hasAttribute('data-varco-demo') ? location.href.split(/[?#]/)[0] : '');
    axe.run(document, VarcoScan.options()).then(function (results) {
      window.parent.postMessage({ type: 'varco:frame-scan', scan: VarcoScan.compact(results, { url: url, title: document.title }) }, '*');
    }).catch(function (err) {
      window.parent.postMessage({ type: 'varco:frame-error', message: String((err && err.message) || err) }, '*');
    });
  }

  if (document.readyState === 'complete') setTimeout(go, 50);
  else window.addEventListener('load', function () { setTimeout(go, 50); });
  setTimeout(go, 8000); // images or styles that never finish loading must not block the scan
})();

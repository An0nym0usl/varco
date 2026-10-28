// Runs a scan of the demo shop or of pasted HTML inside a sandboxed iframe (allow-scripts only:
// opaque origin, no access to Varco's storage) and resolves with a normalised scan.
import { normalizeScan } from './normalize.js';

const absolute = (value, pageUrl) => {
  try { return new URL(value.trim(), pageUrl).href; } catch { return value; }
};
const CSS_URL = /url\(\s*(['"]?)(?!data:|https?:|blob:|#)([^'")]+)\1\s*\)/gi;
const CSS_IMPORT = /@import\s+(['"])(?!https?:)([^'"]+)\1/gi;
export const absoluteCss = (css, pageUrl) => css
  .replace(CSS_URL, (m, q, u) => `url(${q}${absolute(u, pageUrl)}${q})`)
  .replace(CSS_IMPORT, (m, q, u) => `@import ${q}${absolute(u, pageUrl)}${q}`);
const absoluteSrcset = (value, pageUrl) => value.split(',').map((part) => {
  const [u, ...rest] = part.trim().split(/\s+/);
  return u ? [absolute(u, pageUrl), ...rest].join(' ') : '';
}).filter(Boolean).join(', ');

// Pasted HTML is untrusted: scripts and handlers are removed, and because Varco's CSP (inherited
// by srcdoc frames) forbids <base>, relative URLs are rewritten against the page URL instead.
export function buildSrcdoc(source, { pageUrl = '', scriptUrls = [] } = {}) {
  const doc = new DOMParser().parseFromString(String(source), 'text/html');
  doc.querySelectorAll('script, noscript, base, meta[http-equiv], object, embed').forEach((n) => n.remove());
  for (const el of doc.querySelectorAll('*')) {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || name === 'srcdoc') el.removeAttribute(attr.name);
      else if (/^(href|src|action|formaction|xlink:href|poster)$/.test(name) && /^\s*javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
      else if (pageUrl && /^(href|src|poster)$/.test(name) && !/^\s*(#|data:|mailto:|tel:)/i.test(attr.value)) el.setAttribute(attr.name, absolute(attr.value, pageUrl));
      else if (pageUrl && name === 'srcset') el.setAttribute(attr.name, absoluteSrcset(attr.value, pageUrl));
      else if (pageUrl && name === 'style') el.setAttribute(attr.name, absoluteCss(attr.value, pageUrl));
    }
  }
  if (pageUrl) {
    doc.querySelectorAll('style').forEach((s) => { s.textContent = absoluteCss(s.textContent, pageUrl); });
    doc.documentElement.setAttribute('data-varco-url', pageUrl);
  }
  for (const url of scriptUrls) {
    const s = doc.createElement('script');
    s.src = url;
    doc.body.appendChild(s);
  }
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

export function scanInFrame({ src, srcdoc, source, container, timeoutMs = 30000 }) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('title', source === 'demo' ? 'Anteprima del negozio di esempio in analisi' : 'Anteprima della pagina in analisi');
    frame.className = 'scan-frame';
    frame.width = '1280';
    frame.height = '800';
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
    };
    function onMessage(ev) {
      if (ev.source !== frame.contentWindow || !ev.data) return;
      if (ev.data.type === 'varco:frame-scan') {
        cleanup();
        try { resolve(normalizeScan(ev.data.scan, source)); } catch (e) { reject(e); }
      } else if (ev.data.type === 'varco:frame-error') {
        cleanup();
        reject(new Error(String(ev.data.message).slice(0, 300)));
      }
    }
    window.addEventListener('message', onMessage);
    timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, timeoutMs);
    if (srcdoc != null) frame.srcdoc = srcdoc;
    else frame.src = src;
    (container ?? document.body).appendChild(frame);
  });
}

// Measurement, off unless configured in src/config.json → analytics.
// - "cloudflare": Cloudflare Web Analytics beacon (loaded by the layout). Page views and referrers only.
// - "posthog": page views + product events posted with fetch to PostHog (EU host by default). No SDK, no
//   cookies, nothing stored on the device: a random id per page load, anonymous events, coarse properties.
//   Never sent: scanned page URLs, scan content, form inputs, license keys.
let cfg = { provider: 'none' };
let pageId = '';
const EVENT = /^[a-z][a-z0-9_]{1,39}$/;
const PROP = /^[a-z][a-z0-9_]{0,29}$/;

function randomId() {
  const c = globalThis.crypto;
  return c && typeof c.randomUUID === 'function' ? c.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

// Only short strings, numbers and booleans under simple names survive.
export function sanitize(props = {}) {
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    if (!PROP.test(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string' && v.length <= 40) out[k] = v;
  }
  return out;
}

export function attribution(loc = globalThis.location, ref = globalThis.document?.referrer ?? '') {
  const out = {};
  try {
    const q = new URLSearchParams(loc.search);
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) if (q.get(k)) out[k] = q.get(k).slice(0, 40);
  } catch { /* no query */ }
  try {
    const r = new URL(ref);
    if (r.host && r.host !== loc.host) out.referrer_host = r.host.slice(0, 60);
  } catch { /* direct visit */ }
  return out;
}

function send(event, properties) {
  const host = (cfg.host || 'https://eu.i.posthog.com').replace(/\/$/, '');
  const body = JSON.stringify({
    api_key: cfg.key,
    event,
    properties: { distinct_id: pageId, $process_person_profile: false, $lib: 'varco', path: globalThis.location?.pathname ?? '', ...properties },
  });
  try {
    globalThis.fetch?.(`${host}/capture/`, { method: 'POST', mode: 'cors', keepalive: true, headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  } catch { /* measurement must never break the page */ }
}

export function initAnalytics(config) {
  cfg = config && config.provider ? config : { provider: 'none' };
  if (cfg.provider !== 'posthog' || !cfg.key) return;
  pageId = randomId();
  send('$pageview', attribution());
}

export function track(event, props = {}) {
  if (cfg.provider !== 'posthog' || !cfg.key || !EVENT.test(event)) return;
  send(event, sanitize(props));
}

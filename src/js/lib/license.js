// License keys sold through Polar (merchant of record). The customer-portal endpoints need no secret and
// allow browser calls (CORS verified), so no backend is required.
// Docs: https://polar.sh/docs/features/benefits/license-keys
//
// Threat model (accepted, documented in SECURITY.md): gating runs in the browser, so a technical user can
// bypass it by editing JavaScript. Controls that still hold without a server:
// - activations per device, capped by the benefit's activation limit → one key cannot be shared freely;
// - daily re-validation → keys revoked by Polar (subscription ended, refund + revoke) stop working within 24 h;
// - benefit_id check → only keys from Varco products unlock anything.
export const API = {
  live: 'https://api.polar.sh/v1/customer-portal/license-keys',
  sandbox: 'https://sandbox-api.polar.sh/v1/customer-portal/license-keys',
};

export const REVALIDATE_MS = 24 * 3600e3; // re-check daily when online
export const GRACE_MS = 14 * 864e5; // keep working offline for 14 days after the last good check

export const REASONS_IT = {
  not_configured: 'Gli acquisti non sono ancora attivi, quindi non è possibile verificare licenze.',
  invalid_format: 'Il codice non ha un formato valido. Copialo di nuovo dalla email di conferma di Polar.',
  not_found: 'Licenza non trovata, scaduta o revocata.',
  expired: "Licenza scaduta: rinnova l'abbonamento per riattivare le funzioni a pagamento.",
  wrong_product: 'Questa licenza non appartiene a un piano Varco.',
  activation_limit: 'Hai raggiunto il numero massimo di dispositivi per questa licenza. Rimuovila da un dispositivo che non usi più, oppure gestisci i dispositivi dal portale clienti di Polar.',
  network: 'Connessione non riuscita. Controlla la rete e riprova.',
  server: 'Il servizio di verifica non risponde. Riprova tra qualche minuto.',
};

export function planForBenefit(benefitId, benefits = {}) {
  if (benefitId && benefitId === benefits.agenzia) return 'agenzia';
  if (benefitId && benefitId === benefits.pro) return 'pro';
  return null;
}

export function paymentsReady(payments) {
  return Boolean(payments && payments.organizationId && payments.benefits && (payments.benefits.pro || payments.benefits.agenzia));
}

const url = (payments, action) => `${payments.sandbox ? API.sandbox : API.live}/${action}`;

async function post(payments, action, body, fetchImpl) {
  try {
    const res = await fetchImpl(url(payments, action), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ organization_id: payments.organizationId, ...body }),
    });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, ok: res.ok, data };
  } catch {
    return { status: 0, ok: false, data: null };
  }
}

const failure = (status) => {
  if (status === 0) return { ok: false, reason: 'network' };
  if (status === 404) return { ok: false, reason: 'not_found' };
  if (status === 400 || status === 422) return { ok: false, reason: 'invalid_format' };
  return { ok: false, reason: 'server', status };
};

// Turns a granted Polar license key object into what Varco stores.
function toLicense(key, licenseKey, activationId, payments) {
  if (!licenseKey || licenseKey.status !== 'granted') return { ok: false, reason: 'not_found' };
  if (licenseKey.expires_at && Date.parse(licenseKey.expires_at) < Date.now()) return { ok: false, reason: 'expired' };
  const plan = planForBenefit(licenseKey.benefit_id, payments.benefits);
  if (!plan) return { ok: false, reason: 'wrong_product' };
  return {
    ok: true,
    license: {
      key,
      plan,
      activationId: activationId ?? null,
      displayKey: String(licenseKey.display_key ?? '').slice(0, 40),
      expiresAt: typeof licenseKey.expires_at === 'string' ? licenseKey.expires_at : null,
      validatedAt: new Date().toISOString(),
    },
  };
}

function cleanKey(key) {
  const k = String(key ?? '').trim();
  return k.length < 8 || k.length > 200 || /\s/.test(k) ? null : k;
}

// First activation on this device. If the benefit has no activation limit, Polar answers 403 to /activate
// and the key is checked with /validate instead.
export async function activateLicense(key, payments, { label = 'Varco', fetchImpl = globalThis.fetch } = {}) {
  if (!paymentsReady(payments)) return { ok: false, reason: 'not_configured' };
  const k = cleanKey(key);
  if (!k) return { ok: false, reason: 'invalid_format' };
  const act = await post(payments, 'activate', { key: k, label: String(label).slice(0, 100), meta: { app: 'varco' } }, fetchImpl);
  if (act.ok && act.data) return toLicense(k, act.data.license_key, act.data.id, payments);
  if (act.status !== 403) return failure(act.status);
  const val = await post(payments, 'validate', { key: k }, fetchImpl);
  if (!val.ok) return failure(val.status);
  if (val.data && val.data.limit_activations != null) return { ok: false, reason: 'activation_limit' };
  return toLicense(k, val.data, null, payments);
}

// Periodic re-check of a stored license (with its activation, when there is one).
export async function checkLicense(license, payments, fetchImpl = globalThis.fetch) {
  if (!paymentsReady(payments)) return { ok: false, reason: 'not_configured' };
  if (!license || !cleanKey(license.key)) return { ok: false, reason: 'invalid_format' };
  const body = { key: license.key, ...(license.activationId ? { activation_id: license.activationId } : {}) };
  const val = await post(payments, 'validate', body, fetchImpl);
  if (!val.ok) return failure(val.status);
  return toLicense(license.key, val.data, license.activationId, payments);
}

// Frees this device's activation slot. Best effort: the license is removed locally either way.
export async function deactivateLicense(license, payments, fetchImpl = globalThis.fetch) {
  if (!license?.activationId || !paymentsReady(payments)) return { ok: true, skipped: true };
  const res = await post(payments, 'deactivate', { key: license.key, activation_id: license.activationId }, fetchImpl);
  return { ok: res.ok || res.status === 404 };
}

export function effectivePlan(license, now = Date.now()) {
  if (!license || !license.plan || !license.validatedAt) return 'gratis';
  if (license.expiresAt && Date.parse(license.expiresAt) < now) return 'gratis';
  if (now - Date.parse(license.validatedAt) > GRACE_MS) return 'gratis';
  return license.plan === 'agenzia' ? 'agenzia' : license.plan === 'pro' ? 'pro' : 'gratis';
}

export function needsRevalidation(license, now = Date.now()) {
  return Boolean(license && license.validatedAt && license.plan !== 'gratis' && now - Date.parse(license.validatedAt) > REVALIDATE_MS);
}

export function deviceLabel(nav = globalThis.navigator) {
  const ua = String(nav?.userAgent ?? '');
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /(iPhone|iPad)/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'dispositivo';
  return `${browser} su ${os} (${new Date().toISOString().slice(0, 10)})`;
}

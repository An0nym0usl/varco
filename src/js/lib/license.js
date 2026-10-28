// License keys sold through Polar (merchant of record). The customer-portal validate endpoint
// needs no secret and allows browser calls (CORS *), so no backend is required.
// Docs: https://polar.sh/docs/api-reference/customer-portal/license-keys/validate
export const ENDPOINTS = {
  live: 'https://api.polar.sh/v1/customer-portal/license-keys/validate',
  sandbox: 'https://sandbox-api.polar.sh/v1/customer-portal/license-keys/validate',
};

export const REVALIDATE_MS = 7 * 864e5; // re-check weekly when online
export const GRACE_MS = 30 * 864e5; // keep working offline for 30 days after the last good check

export const REASONS_IT = {
  not_configured: 'Gli acquisti non sono ancora attivi, quindi non è possibile verificare licenze.',
  invalid_format: 'Il codice non ha un formato valido. Copialo di nuovo dalla email di conferma di Polar.',
  not_found: 'Licenza non trovata, scaduta o revocata.',
  expired: "Licenza scaduta: rinnova l'abbonamento per riattivare le funzioni a pagamento.",
  wrong_product: 'Questa licenza non appartiene a un piano Varco.',
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

export async function validateLicense(key, payments, fetchImpl = globalThis.fetch) {
  const k = String(key ?? '').trim();
  if (!paymentsReady(payments)) return { ok: false, reason: 'not_configured' };
  if (k.length < 8 || k.length > 200 || /\s/.test(k)) return { ok: false, reason: 'invalid_format' };
  let res;
  try {
    res = await fetchImpl(payments.sandbox ? ENDPOINTS.sandbox : ENDPOINTS.live, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ key: k, organization_id: payments.organizationId }),
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 404) return { ok: false, reason: 'not_found' };
  if (res.status === 400 || res.status === 422) return { ok: false, reason: 'invalid_format' };
  if (!res.ok) return { ok: false, reason: 'server', status: res.status };
  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: 'server' };
  }
  if (!data || data.status !== 'granted') return { ok: false, reason: 'not_found' };
  if (data.expires_at && Date.parse(data.expires_at) < Date.now()) return { ok: false, reason: 'expired' };
  const plan = planForBenefit(data.benefit_id, payments.benefits);
  if (!plan) return { ok: false, reason: 'wrong_product' };
  return {
    ok: true,
    license: {
      key: k,
      plan,
      displayKey: String(data.display_key ?? '').slice(0, 40),
      expiresAt: typeof data.expires_at === 'string' ? data.expires_at : null,
      validatedAt: new Date().toISOString(),
    },
  };
}

export function effectivePlan(license, now = Date.now()) {
  if (!license || !license.plan || !license.validatedAt) return 'gratis';
  if (license.expiresAt && Date.parse(license.expiresAt) < now) return 'gratis';
  if (now - Date.parse(license.validatedAt) > GRACE_MS) return 'gratis';
  return license.plan === 'agenzia' ? 'agenzia' : license.plan === 'pro' ? 'pro' : 'gratis';
}

export function needsRevalidation(license, now = Date.now()) {
  return Boolean(license && license.validatedAt && now - Date.parse(license.validatedAt) > REVALIDATE_MS);
}

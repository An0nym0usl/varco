import { $, getConfig } from '../lib/ui.js';
import { html } from '../lib/escape.js';
import { read, write, remove } from '../lib/store.js';
import { validateLicense, effectivePlan, REASONS_IT } from '../lib/license.js';
import { PLAN_NAMES } from '../lib/plan.js';

const cfg = getConfig();
const form = $('[data-license-form]');
const msg = $('[data-license-msg]');
const removeBtn = $('[data-license-remove]');

function renderCurrent() {
  const lic = read('license', null);
  const plan = effectivePlan(lic);
  const box = $('[data-current-plan]');
  box.innerHTML = html`<h2>Piano attuale: ${PLAN_NAMES[plan]}</h2>
    ${plan !== 'gratis' && lic ? html`<p>Licenza ${lic.displayKey || ''}${lic.expiresAt ? html`, valida fino al ${new Date(lic.expiresAt).toLocaleDateString('it-IT')}` : ''}. Ultima verifica: ${new Date(lic.validatedAt).toLocaleDateString('it-IT')}.</p>` : html`<p>Stai usando le funzioni gratuite.</p>`}`.value;
  removeBtn.hidden = !lic;
  const badge = $('[data-plan-badge]');
  if (badge) { badge.hidden = plan === 'gratis'; badge.textContent = `Piano ${PLAN_NAMES[plan]}`; }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = form.elements.key;
  const button = form.querySelector('button');
  button.disabled = true;
  msg.textContent = '';
  msg.classList.remove('is-ok');
  const res = await validateLicense(input.value, cfg.payments);
  button.disabled = false;
  if (res.ok) {
    write('license', res.license);
    input.value = '';
    input.setAttribute('aria-invalid', 'false');
    renderCurrent();
    $('[data-current-plan] h2').focus?.();
    msg.textContent = '';
    $('[data-current-plan]').insertAdjacentHTML('beforeend', html`<p class="callout" role="status">Licenza attivata: piano ${PLAN_NAMES[res.license.plan]}.</p>`.value);
  } else {
    input.setAttribute('aria-invalid', 'true');
    msg.textContent = REASONS_IT[res.reason] ?? REASONS_IT.server;
    input.focus();
  }
});

removeBtn.addEventListener('click', () => {
  remove('license');
  renderCurrent();
});

renderCurrent();

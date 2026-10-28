// Runs on every page: mobile navigation, plan badge, daily license re-check.
import { $, getConfig } from './lib/ui.js';
import { read, write } from './lib/store.js';
import { effectivePlan, needsRevalidation, checkLicense } from './lib/license.js';
import { PLAN_NAMES } from './lib/plan.js';
import { initAnalytics } from './lib/analytics.js';

initAnalytics(getConfig().analytics);

const toggle = $('.nav-toggle');
const nav = $('#menu-principale');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
}

function showBadge() {
  const badge = $('[data-plan-badge]');
  const plan = effectivePlan(read('license', null));
  if (!badge) return;
  badge.hidden = plan === 'gratis';
  badge.textContent = `Piano ${PLAN_NAMES[plan]}`;
}

showBadge();

const license = read('license', null);
if (license && needsRevalidation(license) && navigator.onLine !== false) {
  checkLicense(license, getConfig().payments).then((res) => {
    if (res.ok) write('license', res.license);
    else if (['not_found', 'expired', 'wrong_product'].includes(res.reason)) write('license', { ...license, plan: 'gratis', revokedAt: new Date().toISOString() });
    showBadge();
  });
}

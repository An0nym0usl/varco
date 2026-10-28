// Sends the visitor to the Polar checkout after the page view has been counted.
import { $ } from '../lib/ui.js';
import { safeUrl } from '../lib/escape.js';

const target = safeUrl($('[data-checkout]')?.dataset.checkout ?? '');
if (target && new URL(target).hostname.endsWith('polar.sh')) setTimeout(() => location.assign(target), 900);

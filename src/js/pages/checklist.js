import { $, $$ } from '../lib/ui.js';
import { read, write, remove } from '../lib/store.js';

const form = $('[data-checklist]');
const progress = $('[data-checklist-progress]');
const checks = $$('[data-check]', form);

function update() {
  const state = read('checklist', {});
  let done = 0;
  let failed = 0;
  for (const fs of checks) {
    const v = state[fs.dataset.check];
    fs.dataset.state = v ?? '';
    for (const input of $$('input', fs)) input.checked = input.value === v;
    if (v) done += 1;
    if (v === 'ko') failed += 1;
  }
  progress.textContent = `${done} controlli completati su ${checks.length}${failed ? `, ${failed} non superati` : ''}.`;
}

form.addEventListener('change', (e) => {
  if (e.target.type !== 'radio') return;
  const state = read('checklist', {});
  state[e.target.name] = e.target.value;
  write('checklist', state);
  update();
});

$('[data-checklist-reset]').addEventListener('click', () => {
  if (!window.confirm('Vuoi davvero azzerare tutte le risposte della checklist?')) return;
  remove('checklist');
  update();
});

update();

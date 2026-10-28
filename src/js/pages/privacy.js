import { $ } from '../lib/ui.js';

$('[data-clear-data]').addEventListener('click', () => {
  const status = $('[data-clear-status]');
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('varco:'));
    keys.forEach((k) => localStorage.removeItem(k));
    status.textContent = keys.length ? `Eliminati ${keys.length} elementi salvati da Varco.` : 'Non c\'erano dati di Varco salvati in questo browser.';
  } catch {
    status.textContent = 'Il browser non consente di accedere alla memoria locale: non ci sono dati da cancellare.';
  }
});

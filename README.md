# Varco

Verifica di accessibilità e strumenti per l'European Accessibility Act, in italiano.
**Sito: https://an0nym0usl.github.io/varco/**

- **Verifica**: un pulsante da mettere nei preferiti esegue [axe-core](https://github.com/dequelabs/axe-core)
  sulla pagina che stai guardando (anche carrello e checkout) e apre un report in italiano con criteri
  WCAG 2.2 e clausole EN 301 549.
- **Sei obbligato?**: valutazione dell'ambito EAA (servizi coperti, esenzione delle microimprese).
- **Checklist manuale**: i controlli che nessuno strumento automatico può fare.
- **Informazioni di accessibilità**: generatore del testo richiesto dall'art. 13 e dall'Allegato V
  della Direttiva (UE) 2019/882.

## Privacy by design
Varco è un sito statico. Le analisi avvengono nel browser di chi lo usa; report, progetti e
checklist restano nel `localStorage` del browser. Nessun server riceve le pagine analizzate.

## Sviluppo
```bash
npm install
npm run dev          # build + server locale su http://127.0.0.1:4173/varco/
npm test             # unit test (node:test)
npm run test:e2e     # Playwright: flussi, accessibilità di ogni pagina, mobile
```
Il deploy su GitHub Pages avviene a ogni push su `main` dopo che i test sono passati
(`.github/workflows/ci.yml`). `health.yml` controlla la produzione ogni 6 ore e apre una issue
se qualcosa non risponde.

Configurazione pubblica (pagamenti Polar, statistiche, dati del titolare): `src/config.json`.
Nessun segreto va mai in questo repository.

## Licenza
Vedi [LICENSE](LICENSE). axe-core è distribuito con licenza MPL-2.0.

// European Accessibility Act applicability check. Pure function: answers in, outcome out.
// Based on Directive (EU) 2019/882 (art. 2, 3(23), 4(5), 13, 32) as transposed by D.Lgs. 82/2022,
// and on Legge 4/2004 art. 3 c. 1-bis for very large private companies. Not legal advice.

export const SERVICES = {
  ecommerce: 'Vendita online di prodotti o servizi a consumatori (e-commerce)',
  banca: 'Servizi bancari o finanziari per consumatori',
  trasporto: 'Trasporto passeggeri: biglietti, prenotazioni, informazioni di viaggio',
  ebook: 'E-book o software di lettura dedicato',
  comunicazioni: 'Servizi di comunicazione elettronica (telefonia, internet, messaggistica)',
  media: 'Accesso a servizi di media audiovisivi (TV, streaming)',
};

export const REFS = {
  eaa: { label: 'Direttiva (UE) 2019/882 — European Accessibility Act', url: 'https://eur-lex.europa.eu/eli/dir/2019/882/oj?locale=it' },
  dlgs: { label: 'D.Lgs. 27 maggio 2022, n. 82 (recepimento in Italia)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2022-05-27;82' },
  stanca: { label: 'Legge 9 gennaio 2004, n. 4 (Legge Stanca)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2004-01-09;4' },
  agid: { label: 'AgID — Agenzia per l\'Italia Digitale', url: 'https://www.agid.gov.it/' },
};

export const OUTCOMES = {
  obbligato: 'Probabilmente sei obbligato',
  esente: 'Probabilmente sei esente (microimpresa)',
  'fuori-ambito': "Probabilmente l'EAA non si applica ai tuoi servizi",
  'da-verificare': 'Servono altre informazioni',
  pa: 'Sei soggetto alle regole per la pubblica amministrazione',
};

export function classifyMicro(persone, fatturato, bilancio) {
  // Microimpresa (EAA art. 3, punto 23): meno di 10 persone E fatturato annuo OPPURE totale di bilancio ≤ 2 milioni.
  if (persone === '10+') return 'no';
  if (persone !== '<10') return 'incerto';
  if (fatturato === '<=2' || bilancio === '<=2') return 'si';
  if (fatturato === '>2' && bilancio === '>2') return 'no';
  return 'incerto';
}

export function assessEaa(answers = {}) {
  const services = (answers.services ?? []).filter((s) => s in SERVICES);
  const consumers = answers.clienti === 'consumatori' || answers.clienti === 'entrambi';
  const micro = classifyMicro(answers.persone, answers.fatturato, answers.bilancio);
  const big = answers.fatturato500 === 'si';
  const reasons = [];
  const next = [];
  const refs = [REFS.eaa, REFS.dlgs];
  let outcome;

  if (answers.pa === 'si') {
    return {
      outcome: 'pa',
      title: OUTCOMES.pa,
      reasons: ["Le pubbliche amministrazioni seguono la Legge 4/2004 e le linee guida AgID sull'accessibilità degli strumenti informatici, non le regole dell'EAA per le imprese."],
      next: ["Pubblica e aggiorna ogni anno la dichiarazione di accessibilità secondo le indicazioni AgID (scadenza annuale: 23 settembre).", 'Usa comunque la verifica e la checklist di Varco per trovare e correggere i problemi.'],
      refs: [REFS.stanca, REFS.agid],
    };
  }

  if (services.length === 0) {
    outcome = 'fuori-ambito';
    reasons.push("Non hai indicato servizi tra quelli elencati dall'EAA (art. 2): e-commerce verso consumatori, banca, trasporto passeggeri, e-book, comunicazioni elettroniche, media audiovisivi.");
    reasons.push('Un sito vetrina o un blog, di per sé, non rientra in queste categorie.');
  } else if (!consumers) {
    outcome = 'fuori-ambito';
    reasons.push("Offri questi servizi solo ad aziende: l'EAA riguarda i servizi forniti ai consumatori (per l'e-commerce: contratti conclusi con consumatori).");
  } else if (micro === 'si') {
    outcome = 'esente';
    reasons.push('Rientri nella definizione di microimpresa: meno di 10 persone e fatturato annuo oppure totale di bilancio annuo non superiore a 2 milioni di euro (art. 3, punto 23).');
    reasons.push("Le microimprese che forniscono servizi sono esentate dai requisiti di accessibilità e dai relativi obblighi (art. 4, paragrafo 5).");
  } else if (micro === 'no') {
    outcome = 'obbligato';
    reasons.push(`Offri ai consumatori servizi elencati dall'EAA: ${services.map((s) => SERVICES[s].toLowerCase()).join('; ')}.`);
    reasons.push('Non rientri nella definizione di microimpresa, quindi l\'esenzione non si applica.');
  } else {
    outcome = 'da-verificare';
    reasons.push('I tuoi servizi rientrano nell\'EAA, ma per sapere se sei una microimpresa servono numero di persone e almeno uno tra fatturato annuo e totale di bilancio.');
  }

  if (big) {
    refs.push(REFS.stanca);
    reasons.push('Con un fatturato medio superiore a 500 milioni di euro negli ultimi tre anni, la Legge 4/2004 (art. 3, comma 1-bis) si applica comunque ai servizi che offri al pubblico tramite siti web e app.');
    if (outcome !== 'obbligato') outcome = 'obbligato';
  }

  if (outcome === 'obbligato') {
    next.push('Verifica le pagine del percorso principale: home, categoria, scheda prodotto o servizio, carrello, accesso o registrazione, pagamento, contatti.');
    next.push('Completa i controlli manuali: la tastiera, lo zoom e i lettori di schermo non si verificano in automatico.');
    next.push('Correggi i problemi partendo da quelli critici e gravi.');
    next.push("Pubblica le informazioni sull'accessibilità del servizio nelle condizioni generali o in un documento equivalente (art. 13 e Allegato V).");
    next.push('Prevedi una procedura per mantenere la conformità quando il sito cambia (art. 13, paragrafo 3). In caso di non conformità vanno adottate misure correttive e informate le autorità competenti (art. 13, paragrafo 4).');
    refs.push(REFS.agid);
  } else if (outcome === 'esente') {
    next.push("L'esenzione vale per i servizi. Se fabbrichi, importi o distribuisci prodotti coperti dall'EAA hai obblighi diversi.");
    next.push('Se superi le soglie (10 persone e 2 milioni), gli obblighi scattano: ripeti la verifica ogni anno.');
    next.push('Un sito accessibile resta un vantaggio: più clienti raggiunti e meno abbandoni nel checkout.');
  } else if (outcome === 'fuori-ambito') {
    next.push('Controlla di non offrire anche servizi ai consumatori (per esempio un negozio online accanto al sito vetrina).');
    next.push("Anche fuori dall'ambito dell'EAA, l'accessibilità migliora l'esperienza di tutti i clienti.");
  } else {
    next.push('Recupera dal bilancio il numero medio di persone occupate, il fatturato annuo e il totale di bilancio, poi ripeti la verifica.');
  }

  return { outcome, title: OUTCOMES[outcome], reasons, next, refs };
}

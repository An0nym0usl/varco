import { html, raw } from './js/lib/escape.js';

export const NAV = [
  ['verifica', '/verifica/', 'Verifica'],
  ['obbligo', '/obbligo/', 'Sei obbligato?'],
  ['checklist', '/checklist/', 'Checklist'],
  ['dichiarazione', '/dichiarazione/', 'Dichiarazione'],
  ['guida', '/guida/european-accessibility-act/', 'Guida EAA'],
  ['agenzie', '/agenzie/', 'Per le agenzie'],
  ['prezzi', '/prezzi/', 'Prezzi'],
];

export const logo = (cls = 'logo') => raw(`<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="7" fill="#ffc20e"/><path d="M10 27V15a6 6 0 0 1 12 0v12z" fill="#15181b"/></svg>`);

// Everything here ends up in every page: only values that are public by design (Polar IDs, the PostHog
// project key, a referrer-restricted PageSpeed key). Secrets never belong in src/config.json.
function publicConfig(ctx) {
  const p = ctx.config.payments;
  const a = ctx.config.analytics;
  return {
    origin: ctx.origin,
    base: ctx.base,
    version: ctx.version,
    build: ctx.buildId,
    repo: ctx.config.site.repo,
    feedback: ctx.config.site.feedback,
    payments: { sandbox: p.sandbox, organizationId: p.organizationId, checkout: p.checkout, benefits: p.benefits, prices: p.prices },
    analytics: a.provider === 'posthog' ? { provider: 'posthog', key: a.key, host: a.host } : { provider: a.provider },
    psi: { key: ctx.config.psi?.apiKey ?? '' },
  };
}

const json = (value) => raw(JSON.stringify(value).replace(/</g, '\\u003c'));

export function layout(page, ctx) {
  const { url, abs, asset } = ctx;
  const title = page.path === '/' ? page.title : `${page.title} · Varco`;
  const canonical = page.path === '/404.html' ? '' : abs(page.path);
  const cf = ctx.config.analytics.provider === 'cloudflare' && ctx.config.analytics.token;
  const navItem = ([key, href, label]) => html`<li><a href="${url(href)}"${page.nav === key ? raw(' aria-current="page"') : ''}>${label}</a></li>`;
  const doc = html`<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${ctx.csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${title}</title>
<meta name="description" content="${page.description}">
${canonical ? html`<link rel="canonical" href="${canonical}">` : ''}
${page.noindex ? raw('<meta name="robots" content="noindex">') : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="Varco">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${page.description}">
${canonical ? html`<meta property="og:url" content="${canonical}">` : ''}
<meta property="og:image" content="${abs('/og.png')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#15181b">
${ctx.config.seo?.googleSiteVerification ? html`<meta name="google-site-verification" content="${ctx.config.seo.googleSiteVerification}">` : ''}
${ctx.config.seo?.bingSiteVerification ? html`<meta name="msvalidate.01" content="${ctx.config.seo.bingSiteVerification}">` : ''}
<link rel="icon" href="${url('/favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${url('/fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${url('/fonts/overpass-latin-wght-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset('css/main.css')}">
<link rel="stylesheet" href="${asset('css/print.css')}" media="print">
<script type="application/json" id="varco-config">${json(publicConfig(ctx))}</script>
${(page.jsonLd ?? []).map((d) => html`<script type="application/ld+json">${json(d)}</script>`)}
<script type="module" src="${asset('js/common.js')}"></script>
${(page.scripts ?? []).map((s) => html`<script type="module" src="${asset(s)}"></script>`)}
${cf ? html`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="${JSON.stringify({ token: ctx.config.analytics.token })}"></script>` : ''}
</head>
<body class="${page.bodyClass ?? ''}">
<a class="skip" href="#contenuto">Salta al contenuto</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${url('/')}">${logo()}<span>Varco</span><span class="visually-hidden">, pagina iniziale</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-principale">Menu</button>
    <nav id="menu-principale" class="site-nav" aria-label="Principale">
      <ul>${NAV.map(navItem)}</ul>
    </nav>
    <a class="plan-badge" href="${url('/licenza/')}" data-plan-badge hidden></a>
  </div>
</header>
<main id="contenuto" tabindex="-1">
${raw(String(page.body))}
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <p class="brand brand--footer">${logo()}<span>Varco</span></p>
      <p>Strumenti in italiano per l'accessibilità digitale e l'European Accessibility Act. Le analisi avvengono nel tuo browser.</p>
    </div>
    <nav aria-label="Strumenti">
      <h2 class="footer-h">Strumenti</h2>
      <ul>
        <li><a href="${url('/verifica/')}">Verifica una pagina</a></li>
        <li><a href="${url('/report/')}">Report e progetti</a></li>
        <li><a href="${url('/obbligo/')}">Sei obbligato?</a></li>
        <li><a href="${url('/checklist/')}">Checklist manuale</a></li>
        <li><a href="${url('/dichiarazione/')}">Dichiarazione di accessibilità</a></li>
      </ul>
    </nav>
    <nav aria-label="Risorse">
      <h2 class="footer-h">Risorse</h2>
      <ul>
        <li><a href="${url('/guida/european-accessibility-act/')}">Guida all'EAA</a></li>
        <li><a href="${url('/regole/')}">Regole di accessibilità</a></li>
        <li><a href="${url('/prezzi/')}">Prezzi</a></li>
        <li><a href="${url('/licenza/')}">Attiva una licenza</a></li>
        <li><a href="${ctx.config.site.feedback}">Feedback e richieste</a></li>
        <li><a href="${ctx.config.site.repo}">Codice sorgente</a></li>
      </ul>
    </nav>
    <nav aria-label="Informazioni legali">
      <h2 class="footer-h">Legale</h2>
      <ul>
        <li><a href="${url('/privacy/')}">Privacy</a></li>
        <li><a href="${url('/termini/')}">Termini d'uso</a></li>
        <li><a href="${url('/note-legali/')}">Note legali</a></li>
      </ul>
    </nav>
  </div>
  <div class="wrap footer-note">
    <p>Varco aiuta a individuare problemi di accessibilità ma non certifica la conformità e non sostituisce una consulenza legale.</p>
    <p>Versione ${ctx.version} · motore axe-core ${ctx.axeVersion}</p>
  </div>
</footer>
</body>
</html>
`;
  return doc.value;
}

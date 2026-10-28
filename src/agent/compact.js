/* Shared by the bookmarklet agent and the sandboxed frame runner (concatenated at build time).
   Defines which axe-core rules run and how results are compacted before leaving the page. */
var VarcoScan = (function () {
  'use strict';
  var TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
  var MAX_NODES = 50;

  function cut(s, n) {
    s = typeof s === 'string' ? s : '';
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  // axe targets are arrays of selectors; nested arrays describe shadow DOM paths.
  function target(t) {
    if (!Array.isArray(t)) return '';
    return t.map(function (x) { return Array.isArray(x) ? x.join(' >>> ') : String(x); }).join(' | ');
  }

  function rule(r) {
    return {
      id: r.id,
      impact: r.impact || 'minor',
      tags: r.tags || [],
      help: cut(r.help, 300),
      nodeCount: r.nodes.length,
      nodes: r.nodes.slice(0, MAX_NODES).map(function (n) {
        return { target: cut(target(n.target), 300), html: cut(n.html, 600), summary: cut(n.failureSummary, 600) };
      })
    };
  }

  function options() {
    return {
      runOnly: { type: 'tag', values: TAGS },
      resultTypes: ['violations', 'incomplete'],
      iframes: false,
      rules: { 'frame-tested': { enabled: false } }
    };
  }

  function compact(results, meta) {
    return {
      url: meta.url || '',
      title: cut(meta.title, 200),
      scannedAt: new Date().toISOString(),
      engineVersion: (results.testEngine && results.testEngine.version) || '',
      viewport: { w: window.innerWidth, h: window.innerHeight },
      violations: results.violations.map(rule),
      incomplete: results.incomplete.map(rule),
      passes: results.passes.map(function (r) { return r.id; }),
      inapplicable: results.inapplicable.length
    };
  }

  return { options: options, compact: compact };
})();

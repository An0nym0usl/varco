// Safe HTML composition. Every interpolated value is escaped unless it is already SafeHtml,
// so data coming from scanned pages (selectors, snippets, titles) can never inject markup.
export class SafeHtml {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);

export const raw = (value) => new SafeHtml(String(value ?? ''));

const part = (v) => {
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(part).join('');
  if (v === false || v === null || v === undefined) return '';
  return esc(v);
};

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += part(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

// Only http(s) URLs may become links; anything else (javascript:, data:, garbage) is dropped.
export function safeUrl(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

import { h } from '../ui/dom';

export type Lang = 'en' | 'ur' | 'both';
export type StringTable = Record<string, string | string[]>;
export interface UiStrings {
  en: StringTable;
  ur: StringTable;
}

let table: UiStrings = { en: {}, ur: {} };
let lang: Lang = 'both';

export function setStrings(s: UiStrings) {
  table = s;
}
export function setLang(l: Lang) {
  lang = l;
  document.documentElement.dataset.lang = l;
}
export function getLang(): Lang {
  return lang;
}

function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  // Names and numbers are wrapped in Unicode isolates so an English name inside Urdu (or the reverse) keeps its punctuation in place.
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? `\u2068${vars[k]}\u2069` : m));
}

/** Raw string in one language, falling back to English then the key itself. */
export function str(key: string, l: 'en' | 'ur' = lang === 'ur' ? 'ur' : 'en', vars?: Record<string, string | number>): string {
  const v = table[l]?.[key] ?? table.en?.[key] ?? key;
  return fill(Array.isArray(v) ? v.join('\n') : v, vars);
}

export function list(key: string, l: 'en' | 'ur'): string[] {
  const v = table[l]?.[key] ?? table.en?.[key];
  return Array.isArray(v) ? v : v ? [v] : [];
}

/** Text in one language, marked up for correct direction and font. */
export function span(text: string, l: 'en' | 'ur', cls = '') {
  return h('span', { class: `t t-${l} ${cls}`, lang: l, dir: l === 'ur' ? 'rtl' : 'ltr' }, text);
}

/**
 * Bilingual label for UI chrome. In "both" mode English is primary with Urdu underneath.
 * Pass `pair` to supply your own EN/UR texts (for content messages).
 */
export function t(key: string, vars?: Record<string, string | number>, cls = ''): HTMLElement {
  return pair(str(key, 'en', vars), str(key, 'ur', vars), cls);
}

export function pair(en: string, ur: string, cls = ''): HTMLElement {
  const wrap = h('span', { class: `tx ${cls}` });
  if (lang === 'en' || (lang === 'both' && !ur)) wrap.append(span(en, 'en'));
  else if (lang === 'ur') wrap.append(span(ur || en, ur ? 'ur' : 'en'));
  else wrap.append(span(en, 'en', 'primary'), span(ur, 'ur', 'secondary'));
  return wrap;
}

/** Plain text for aria labels and titles. */
export function plain(key: string, vars?: Record<string, string | number>) {
  return lang === 'ur' ? str(key, 'ur', vars) : str(key, 'en', vars);
}

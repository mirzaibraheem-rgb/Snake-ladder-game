import type { App } from '../app';
import { h } from './dom';
import { openModal } from './overlay';
import { getLang, list, pair, plain, span, t } from '../content/strings';
import { sound } from '../audio/sound';
import { BOARDS } from '../config';

export function button(label: HTMLElement | string, onClick: () => void, cls = 'btn', extra: Record<string, string> = {}) {
  return h('button', { type: 'button', class: cls, ...extra, onclick: () => { sound.click(); onClick(); } }, label);
}

function segmented<T extends string>(name: string, options: { value: T; label: HTMLElement }[], current: T, onChange: (v: T) => void) {
  const wrap = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': name });
  const render = (cur: T) => {
    wrap.replaceChildren(
      ...options.map((o) =>
        h('button', {
          type: 'button',
          role: 'radio',
          'aria-checked': String(o.value === cur),
          class: o.value === cur ? 'seg on' : 'seg',
          onclick: () => { sound.click(); render(o.value); onChange(o.value); },
        }, o.label),
      ),
    );
  };
  render(current);
  return wrap;
}

function toggle(label: HTMLElement, value: boolean, onChange: (v: boolean) => void) {
  const btn = h('button', { type: 'button', role: 'switch', class: 'switch', 'aria-checked': String(value) }, h('span', { class: 'knob' }));
  btn.addEventListener('click', () => {
    sound.click();
    const v = btn.getAttribute('aria-checked') !== 'true';
    btn.setAttribute('aria-checked', String(v));
    onChange(v);
  });
  return h('label', { class: 'setting-row' }, h('span', { class: 'setting-label' }, label), btn);
}

export function openSettings(app: App, opts: { inGame?: boolean } = {}) {
  const body = h('div', { class: 'panel settings' });
  const render = () => {
    const p = app.prefs;
    body.replaceChildren(...([
      h('h2', {}, t('settings')),
      h('div', { class: 'setting-row' }, h('span', { class: 'setting-label' }, t('language')),
        segmented('language', [
          { value: 'en', label: span('English', 'en') },
          { value: 'ur', label: span('اردو', 'ur') },
          { value: 'both', label: pair('Both', 'دونوں') },
        ], p.language, (v) => { app.updatePrefs({ language: v }); render(); })),
      toggle(t('sound'), p.sound, (v) => app.updatePrefs({ sound: v })),
      toggle(t('music'), p.music, (v) => app.updatePrefs({ music: v })),
      h('div', { class: 'setting-row' }, h('span', { class: 'setting-label' }, t('board')),
        segmented('board', [
          ...BOARDS.map((b) => ({ value: b.id, label: b.id === 'A' ? t('boardA') : b.id === 'B' ? t('boardB') : span(b.name, 'en') })),
          { value: 'random', label: t('boardRandom') },
        ], p.board, (v) => app.updatePrefs({ board: v }))),
      toggle(t('exactFinish'), p.rules.exactRollToFinish, (v) => app.updatePrefs({ rules: { ...app.prefs.rules, exactRollToFinish: v } })),
      toggle(t('extraSix'), p.rules.extraTurnOnSix, (v) => app.updatePrefs({ rules: { ...app.prefs.rules, extraTurnOnSix: v } })),
      opts.inGame ? h('p', { class: 'note' }, t('rulesNextGame')) : null,
      h('div', { class: 'actions' }, button(t('close'), () => m.close(), 'btn btn-primary')),
    ] as (HTMLElement | null)[]).filter((x): x is HTMLElement => !!x));
  };
  render();
  const m = openModal(body, { dismissable: true, label: plain('settings') });
  return m;
}

export function openHowTo() {
  const lang = getLang();
  const langs: ('en' | 'ur')[] = lang === 'both' ? ['en', 'ur'] : [lang];
  const legend = h('div', { class: 'legend' },
    h('div', { class: 'legend-item ladder' }, h('span', { class: 'legend-icon', html: LADDER_ICON }), t('lessonKeep')),
    h('div', { class: 'legend-item snake' }, h('span', { class: 'legend-icon', html: SNAKE_ICON }), t('lessonAvoid')),
  );
  const body = h('div', { class: 'panel howto' },
    h('h2', {}, t('howToPlay')),
    legend,
    ...langs.map((l) => h('ol', { class: `steps steps-${l}`, lang: l, dir: l === 'ur' ? 'rtl' : 'ltr' }, ...list('howToPlaySteps', l).map((s) => h('li', {}, s)))),
  );
  let m: ReturnType<typeof openModal>;
  body.append(h('div', { class: 'actions' }, button(t('close'), () => m.close(), 'btn btn-primary')));
  m = openModal(body, { dismissable: true, label: plain('howToPlay') });
  return m;
}

export function openAbout(app: App) {
  const sources = app.content.report;
  let m: ReturnType<typeof openModal>;
  const body = h('div', { class: 'panel about' },
    h('h2', {}, t('about')),
    h('p', {}, t('aboutText')),
    h('p', { class: 'small' }, span(`Version ${__APP_VERSION__}. Messages: ${sources[0].count} (${sources[0].source}).`, 'en')),
    h('div', { class: 'actions' }, button(t('close'), () => m.close(), 'btn btn-primary')),
  );
  m = openModal(body, { dismissable: true, label: plain('about') });
  return m;
}

export function confirmDialog(textKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    let m: ReturnType<typeof openModal>;
    const body = h('div', { class: 'panel confirm' },
      h('p', { class: 'big' }, t(textKey)),
      h('div', { class: 'actions' },
        button(t('no'), () => { m.close(); resolve(false); }, 'btn'),
        button(t('yes'), () => { m.close(); resolve(true); }, 'btn btn-primary'),
      ),
    );
    m = openModal(body, { label: plain(textKey) });
  });
}

export const SNAKE_ICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M18 80 C18 60 50 66 50 50 C50 36 30 40 30 28 C30 16 48 12 60 16" fill="none" stroke="#8AC010" stroke-width="14" stroke-linecap="round"/><path d="M18 80 C18 60 50 66 50 50 C50 36 30 40 30 28 C30 16 48 12 60 16" fill="none" stroke="#B5E35A" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round"/><ellipse cx="68" cy="18" rx="16" ry="12" fill="#8AC010"/><circle cx="66" cy="14" r="5" fill="#fff"/><circle cx="74" cy="14" r="5" fill="#fff"/><circle cx="67" cy="15" r="2.4" fill="#222"/><circle cx="75" cy="15" r="2.4" fill="#222"/><path d="M62 23 Q70 28 78 23" fill="none" stroke="#2c5a00" stroke-width="2.4" stroke-linecap="round"/><path d="M84 20 l8 -2 m-8 2 l8 3" stroke="#F72E8C" stroke-width="2.4" stroke-linecap="round"/></svg>`;
export const LADDER_ICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="#3B0A6B" stroke-width="8" stroke-linecap="round"><path d="M30 92 L46 8"/><path d="M62 92 L78 8"/></g><g stroke="#FF8A1F" stroke-width="7" stroke-linecap="round"><path d="M34 76 h32"/><path d="M37 58 h32"/><path d="M41 40 h32"/><path d="M44 22 h32"/></g></svg>`;

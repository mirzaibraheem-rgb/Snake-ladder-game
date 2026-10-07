import type { App, Screen } from '../app';
import { h } from '../ui/dom';
import { t, span, pair } from '../content/strings';
import { button, openAbout, openHowTo, openSettings } from '../ui/panels';
import { loadGame } from '../storage/save';
import { setupScene } from './setup';
import { resumeGame } from './game';
import { CHARACTERS, characterSVG } from '../characters/characters';
import { BOARDS } from '../config';

export function titleScene(app: App): Screen {
  const el = h('div', { class: 'screen title-screen' });
  const render = () => {
    const saved = loadGame();
    const kids = h('div', { class: 'title-kids', 'aria-hidden': 'true' },
      ...CHARACTERS.slice(0, 4).map((c, i) => h('div', { class: `title-kid st-idle k${i}`, html: characterSVG(c) })),
    );
    el.replaceChildren(
      h('div', { class: 'title-bg', style: `background-image:url(${BOARDS[0].image})` }),
      h('div', { class: 'title-card' },
        h('div', { class: 'logo' },
          h('div', { class: 'logo-soft', 'aria-hidden': 'true' }, 'SOFT'),
          h('h1', { class: 'logo-title' }, pair('Snakes and Ladders', 'سانپ اور سیڑھی')),
          h('p', { class: 'logo-sub' }, t('appSubtitle')),
        ),
        kids,
        h('div', { class: 'menu' },
          saved ? button(t('continueGame'), () => resumeGame(app, saved), 'btn btn-primary btn-xl', { 'data-testid': 'continue' }) : null,
          button(t('play'), () => app.show(setupScene(app)), saved ? 'btn btn-xl' : 'btn btn-primary btn-xl', { 'data-testid': 'play' }),
          h('div', { class: 'menu-row' },
            button(t('howToPlay'), () => openHowTo(), 'btn'),
            button(t('settings'), () => openSettings(app), 'btn', { 'data-testid': 'settings' }),
            button(t('about'), () => openAbout(app), 'btn'),
          ),
          h('div', { class: 'quick-lang', role: 'group', 'aria-label': 'Language' },
            ...([['en', span('English', 'en')], ['ur', span('اردو', 'ur')], ['both', pair('Both', 'دونوں')]] as const).map(([v, label]) =>
              h('button', { type: 'button', class: app.prefs.language === v ? 'seg on' : 'seg', 'aria-pressed': String(app.prefs.language === v), onclick: () => app.updatePrefs({ language: v }) }, label),
            ),
          ),
        ),
      ),
    );
  };
  render();
  return { el, refresh: render, onBack: () => false };
}

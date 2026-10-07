import type { App, Screen } from '../app';
import { h } from '../ui/dom';
import { t, str, plain, pair } from '../content/strings';
import { button } from '../ui/panels';
import { CHARACTERS, characterSVG } from '../characters/characters';
import { DEFAULTS, pickBoard } from '../config';
import { startNewGame } from './game';
import { titleScene } from './title';
import type { NewPlayer } from '../engine/rules';

type Mode = 'two' | 'computer';

export interface SetupState {
  mode: Mode;
  players: { name: string; characterId: string }[];
}

let last: SetupState = {
  mode: 'computer',
  players: [
    { name: '', characterId: 'ayesha' },
    { name: '', characterId: 'ali' },
  ],
};

const kid = (id: string) => characterSVG(CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0], { avatar: true });
export const ROBOT = `<svg class="char-svg" viewBox="0 0 76 76" aria-hidden="true"><rect x="10" y="14" width="56" height="44" rx="12" fill="#7B2FBE"/><rect x="18" y="22" width="40" height="26" rx="8" fill="#E9DDFB"/><circle cx="30" cy="34" r="5" fill="#3B0A6B"/><circle cx="46" cy="34" r="5" fill="#3B0A6B"/><path d="M30 42 q8 5 16 0" stroke="#3B0A6B" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M38 14 v-8" stroke="#7B2FBE" stroke-width="4"/><circle cx="38" cy="6" r="4" fill="#FF8A1F"/><rect x="24" y="60" width="28" height="10" rx="4" fill="#5B1E96"/></svg>`;

export function setupScene(app: App): Screen {
  const s: SetupState = JSON.parse(JSON.stringify(last));
  const el = h('div', { class: 'screen setup-screen' });
  const maxLen = DEFAULTS.maxNameLength;

  const defaultName = (i: number) => (i === 0 ? str('player1') : s.mode === 'computer' ? str('computer') : str('player2'));

  const render = () => {
    const modeBtn = (m: Mode, label: HTMLElement, iconHtml: string) =>
      h('button', {
        type: 'button',
        class: `mode-card ${s.mode === m ? 'on' : ''}`,
        'aria-pressed': String(s.mode === m),
        'data-testid': `mode-${m}`,
        onclick: () => {
          s.mode = m;
          render();
        },
      }, h('span', { class: 'mode-icon', 'aria-hidden': 'true', html: iconHtml }), label);

    const panel = (i: number) => {
      const p = s.players[i];
      const isComputer = i === 1 && s.mode === 'computer';
      const other = s.players[1 - i].characterId;
      const input = h('input', {
        type: 'text',
        class: 'name-input',
        maxlength: maxLen,
        dir: 'auto',
        value: p.name,
        placeholder: defaultName(i),
        'aria-label': `${plain('yourName')} ${i + 1}`,
        autocomplete: 'off',
        spellcheck: 'false',
        'data-testid': `name-${i}`,
      }) as HTMLInputElement;
      input.addEventListener('input', () => {
        // Count characters (not bytes) so Urdu names get the same limit.
        const chars = Array.from(input.value);
        if (chars.length > maxLen) input.value = chars.slice(0, maxLen).join('');
        p.name = input.value;
      });
      const grid = h('div', { class: 'char-grid', role: 'radiogroup', 'aria-label': plain('chooseCharacter') },
        ...CHARACTERS.map((c) =>
          h('button', {
            type: 'button',
            role: 'radio',
            class: `char-btn ${p.characterId === c.id ? 'on' : ''} ${c.id === other ? 'taken' : ''}`,
            'aria-checked': String(p.characterId === c.id),
            'aria-label': c.name,
            style: `--accent:${c.accent}`,
            'data-testid': `char-${i}-${c.id}`,
            onclick: () => {
              // Picking the other player's character swaps the two, so every character is always available.
              if (c.id === other) s.players[1 - i].characterId = p.characterId;
              p.characterId = c.id;
              render();
            },
          },
          h('span', { class: 'char-face', html: characterSVG(c, { avatar: true }) }),
          h('span', { class: 'char-name' }, pair(c.name, c.nameUr)),
          c.id === other ? h('span', { class: 'taken-badge', 'aria-hidden': 'true' }, String(2 - i)) : null),
        ),
      );
      return h('section', { class: `player-setup p${i}` },
        h('h3', {}, isComputer ? t('computer') : t(i === 0 ? 'player1' : 'player2')),
        h('label', { class: 'name-row' }, h('span', { class: 'name-label' }, t('yourName')), input),
        h('div', { class: 'pick-label' }, t('chooseCharacter')),
        grid,
      );
    };

    el.replaceChildren(
      h('header', { class: 'setup-head' },
        button(t('back'), () => app.show(titleScene(app)), 'btn btn-small'),
        h('h2', {}, t('chooseMode')),
      ),
      h('div', { class: 'modes' }, modeBtn('computer', t('modeComputer'), kid(s.players[0].characterId) + ROBOT), modeBtn('two', t('modeTwoPlayers'), kid(s.players[0].characterId) + kid(s.players[1].characterId))),
      h('div', { class: 'players' }, panel(0), panel(1)),
      h('div', { class: 'setup-foot' }, button(t('start'), start, 'btn btn-primary btn-xl', { 'data-testid': 'start' })),
    );
  };

  const start = () => {
    last = JSON.parse(JSON.stringify(s));
    const players: NewPlayer[] = s.players.map((p, i) => ({
      name: Array.from(p.name.trim()).slice(0, maxLen).join('') || defaultName(i),
      characterId: p.characterId,
      isComputer: i === 1 && s.mode === 'computer',
    }));
    startNewGame(app, pickBoard(app.prefs.board), players);
  };

  render();
  return { el, refresh: render, onBack: () => (app.show(titleScene(app)), true) };
}

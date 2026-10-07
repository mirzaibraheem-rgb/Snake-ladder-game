import type { App } from '../app';
import type { GameState } from '../engine/types';
import { h } from '../ui/dom';
import { openModal } from '../ui/overlay';
import { button } from '../ui/panels';
import { confetti } from '../ui/confetti';
import { characterById, characterSVG } from '../characters/characters';
import { getLang, pair, t, plain } from '../content/strings';
import { setupScene } from './setup';

interface Lesson {
  kind: 'avoid' | 'keep' | 'tip';
  en: string;
  ur: string;
}

/** Lessons this player met: snakes (habits to avoid), ladders (habits to keep), and the Safe Tips they read. */
export function lessonsFor(app: App, state: GameState, who: number): Lesson[] {
  const p = state.players[who];
  const out: Lesson[] = [];
  const seen = new Set<string>();
  const add = (l: Lesson) => {
    if (!l.en || seen.has(l.en)) return;
    seen.add(l.en);
    out.push(l);
  };
  for (const sq of p.laddersClimbed) {
    const tile = app.content.tiles.get(sq);
    if (tile) add({ kind: 'keep', en: tile.en, ur: tile.ur });
  }
  for (const sq of p.snakesHit) {
    const tile = app.content.tiles.get(sq);
    if (tile) add({ kind: 'avoid', en: tile.en, ur: tile.ur });
  }
  for (const id of p.messagesSeen) {
    const m = app.content.snakes[id];
    if (m && (m.tipEn || m.en)) add({ kind: 'tip', en: m.tipEn || m.en, ur: m.tipUr || m.ur });
  }
  return out.slice(0, 10);
}

export function winScreen(app: App, state: GameState, who: number, playAgain: () => void) {
  const p = state.players[who];
  const c = characterById(p.characterId);
  const lessons = lessonsFor(app, state, who);
  const lang = getLang();
  const kindLabel = { avoid: 'lessonAvoid', keep: 'lessonKeep', tip: 'lessonTip' } as const;
  let m: ReturnType<typeof openModal>;
  const body = h('div', { class: 'win', 'data-testid': 'win' },
    h('div', { class: 'win-hero' },
      h('div', { class: 'win-char st-celebrate', html: characterSVG(c) }),
      h('div', { class: 'win-title' },
        h('div', { class: 'trophy', 'aria-hidden': 'true', html: TROPHY }),
        h('h2', {}, t('winTitle')),
        h('p', { class: 'win-name', dir: 'auto' }, t('winnerLine', { name: p.name })),
      ),
    ),
    h('div', { class: 'lessons' },
      h('h3', {}, t('lessonsTitle')),
      lessons.length
        ? h('ul', {}, ...lessons.map((l) => h('li', { class: `lesson ${l.kind}` }, h('span', { class: 'lesson-kind' }, t(kindLabel[l.kind])), pair(l.en, lang === 'en' ? '' : l.ur, 'lesson-text'))))
        : h('p', {}, t('noLessons')),
    ),
    h('div', { class: 'actions' },
      button(t('newPlayers'), () => { m.close(); app.show(setupScene(app)); }, 'btn'),
      button(t('playAgain'), () => { m.close(); playAgain(); }, 'btn btn-primary btn-xl', { 'data-testid': 'play-again' }),
    ),
  );
  m = openModal(body, { cls: 'win-modal', label: plain('winTitle') });
  const stop = confetti(m.el);
  void m.closed.then(stop);
}

const TROPHY = `<svg viewBox="0 0 64 64"><path d="M18 8 h28 v14 c0 9 -6 16 -14 16 s-14 -7 -14 -16Z" fill="#FCC311"/><path d="M18 12 h-8 c0 10 4 14 10 15 M46 12 h8 c0 10 -4 14 -10 15" fill="none" stroke="#FCC311" stroke-width="4"/><rect x="28" y="38" width="8" height="10" fill="#E0A800"/><rect x="20" y="48" width="24" height="8" rx="2" fill="#7B2FBE"/><path d="M27 18 l4 -3 v14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

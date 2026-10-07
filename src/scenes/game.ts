import type { App, Screen } from '../app';
import type { BoardDef, GameState, RulesConfig, TurnResult } from '../engine/types';
import { isComputerTurn, newGame, recordMessageSeen, takeTurn, type NewPlayer } from '../engine/rules';
import { rollDie } from '../engine/rng';
import { MessageDeck } from '../engine/messageDeck';
import { BoardView } from '../ui/boardView';
import { Die } from '../ui/die';
import { h, sleep, dur } from '../ui/dom';
import { closeTopModal, modalOpen, openModal, toast } from '../ui/overlay';
import { button, confirmDialog, openHowTo, openSettings, SNAKE_ICON, LADDER_ICON } from '../ui/panels';
import { pair, plain, str, t, getLang } from '../content/strings';
import { characterById, characterSVG } from '../characters/characters';
import { sound } from '../audio/sound';
import { boardById, DEFAULTS } from '../config';
import { clearSave, saveGame, type SavedGame } from '../storage/save';
import { winScreen } from './win';
import { titleScene } from './title';
import { ROBOT } from './setup';

/** Debug overlay: ?debug=1 on the web, or Ctrl+Shift+D anywhere. */
let debugOn = (() => {
  try {
    return new URLSearchParams(location.search).get('debug') === '1';
  } catch {
    return false;
  }
})();

/** Test hook: ?dice=6,6,1 forces the next rolls (used only by automated screenshot tests). */
const forcedRolls: number[] = (() => {
  try {
    const v = new URLSearchParams(location.search).get('dice');
    return v ? v.split(',').map(Number).filter((n) => n >= 1 && n <= 6) : [];
  } catch {
    return [];
  }
})();

export function startNewGame(app: App, board: BoardDef, players: NewPlayer[]) {
  clearSave();
  const state = newGame(board, players);
  app.show(gameScene(app, board, state, { ...app.prefs.rules }, new MessageDeck(app.content.snakes.length)));
}

export function resumeGame(app: App, saved: SavedGame) {
  const board = boardById(saved.state.boardId);
  if (!board) {
    clearSave();
    app.show(titleScene(app));
    return;
  }
  const count = app.content.snakes.length;
  const deck = new MessageDeck(count, undefined, saved.messageCount === count ? saved.deck : undefined);
  app.show(gameScene(app, board, saved.state, saved.rules, deck));
}

function gameScene(app: App, board: BoardDef, initial: GameState, rules: RulesConfig, deck: MessageDeck): Screen {
  let state = initial;
  let busy = false;
  let paused = false;
  let destroyed = false;
  let computerTimer: number | null = null;

  const el = h('div', { class: 'screen game-screen' });
  const hud = h('div', { class: 'hud' });
  const boardWrap = h('div', { class: 'board-wrap' });
  const status = h('div', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const die = new Die(() => humanRoll(), plain('tapToRoll'));
  const controls = h('div', { class: 'controls' }, die.el, status);
  const pauseBtn = button(h('span', { class: 'pause-icon', 'aria-hidden': 'true' }), () => openPause(), 'btn btn-icon pause-btn', { 'aria-label': plain('pause'), 'data-testid': 'pause' });
  const toastHost = h('div', { class: 'toast-host' });
  el.append(hud, boardWrap, controls, toastHost);
  el.dataset.board = board.id;

  const view = new BoardView(board, boardWrap);
  view.setPlayers(state.players);
  const coordTip = h('div', { class: 'coord-tip' });
  view.el.append(coordTip);
  view.el.addEventListener('click', (e) => {
    if (!view.debugOn) return;
    const [x, y] = view.toImage(e.clientX, e.clientY);
    coordTip.textContent = `x ${x}, y ${y}`;
    coordTip.style.left = `${(x / 1280) * 100}%`;
    coordTip.style.top = `${(y / 1280) * 100}%`;
  });
  const tileEn = (sq: number) => app.content.tiles.get(sq)?.en;
  const applyDebug = () => {
    view.setDebug(debugOn, tileEn);
    el.classList.toggle('debug', debugOn);
    el.querySelector('.debug-panel')?.remove();
    if (debugOn) {
      el.append(h('div', { class: 'debug-panel' },
        h('strong', {}, `${str('debugTitle', 'en')} · ${board.name} (${board.note ?? ''})`),
        h('div', {}, str('debugHint', 'en')),
        ...app.content.report.map((r) => h('div', {}, `${r.file}: ${r.count} from ${r.source}${r.warnings.length ? ` · ${r.warnings.length} warning(s): ${r.warnings[0]}` : ''}`)),
      ));
    }
  };
  applyDebug();

  // ----- player cards -----
  const renderHud = () => {
    hud.replaceChildren(
      ...state.players.map((p, i) => {
        const c = characterById(p.characterId);
        const active = state.current === i && state.winner === null;
        return h('div', { class: `player-card p${i} ${active ? 'active' : ''}`, style: `--accent:${c.accent}`, 'data-testid': `card-${i}`, 'aria-current': active ? 'true' : 'false' },
          h('div', { class: 'card-avatar', html: characterSVG(c, { avatar: true }) }),
          h('div', { class: 'card-text' },
            h('div', { class: 'card-name', dir: 'auto' }, p.name, p.isComputer ? h('span', { class: 'cpu-badge', html: ROBOT, title: plain('computer') }) : null),
            h('div', { class: 'card-square' }, t('square', { n: p.position })),
          ),
          active ? h('div', { class: 'turn-arrow', 'aria-hidden': 'true' }) : null,
        );
      }),
      pauseBtn,
    );
    view.setActive(state.current);
    const cur = state.players[state.current];
    if (state.winner !== null) status.replaceChildren();
    else if (cur.isComputer) status.replaceChildren(t('computerRolling'));
    else status.replaceChildren(t('yourTurn', { name: cur.name }), h('span', { class: 'hint' }, t('tapToRoll')));
    die.setEnabled(!busy && state.winner === null && !cur.isComputer && !paused);
    die.setLabel(plain('tapToRoll'));
  };
  renderHud();

  const persist = () => {
    if (state.winner !== null) clearSave();
    else saveGame({ savedAt: Date.now(), state, rules, deck: deck.snapshot(), messageCount: app.content.snakes.length });
  };
  persist();

  // ----- turn flow -----
  const humanRoll = () => {
    if (busy || paused || modalOpen() || state.winner !== null || state.players[state.current].isComputer) return;
    sound.unlock();
    void playTurn();
  };

  const scheduleComputer = () => {
    if (computerTimer !== null) window.clearTimeout(computerTimer);
    computerTimer = null;
    if (destroyed || paused || busy || !isComputerTurn(state)) return;
    computerTimer = window.setTimeout(() => {
      computerTimer = null;
      if (!destroyed && !paused && !busy && !modalOpen() && isComputerTurn(state)) void playTurn();
      else scheduleComputer();
    }, dur(DEFAULTS.computerRollDelayMs) + 200 * Math.random());
  };

  async function playTurn() {
    busy = true;
    renderHud();
    const value = forcedRolls.length ? (forcedRolls.shift() as number) : rollDie();
    await die.roll(value);
    const res: TurnResult = takeTurn(board, rules, state, value);
    const who = res.player;
    state = res.state;
    persist();
    await animate(res);
    if (destroyed) return;

    if (res.plan.event.kind === 'snake') {
      const id = deck.next();
      if (id >= 0) {
        state = recordMessageSeen(state, who, id);
        persist();
        await showSnakeCard(id);
      }
      view.setState(who, 'idle');
    }

    if (state.winner !== null) {
      busy = false;
      renderHud();
      clearSave();
      view.celebrate(who);
      sound.win();
      await sleep(dur(900));
      if (!destroyed) winScreen(app, state, who, () => restart());
      return;
    }

    if (res.extraTurn) void toast(t('extraTurn'), { host: toastHost, ms: 1600, cls: 'toast-six' });
    else if (res.extraTurnCapped) void toast(t('extraTurnCapped'), { host: toastHost, ms: 2000 });
    busy = false;
    renderHud();
    scheduleComputer();
  }

  async function animate(res: TurnResult) {
    const { plan, player } = res;
    if (plan.event.kind === 'overshoot') {
      await view.bump(player);
      void toast(t('needExactly', { n: plan.event.needed }), { host: toastHost, ms: 2400, cls: 'toast-hint' });
      await sleep(dur(600));
      return;
    }
    await view.hop(player, plan.steps, DEFAULTS.hopMs);
    if (plan.event.kind === 'ladder') {
      const ladder = plan.event.ladder;
      const msg = app.content.ladders.get(ladder.from);
      const title = ladder.type === 'train' ? 'trainTitle' : 'ladderTitle';
      const content = h('div', { class: 'ladder-toast' },
        h('span', { class: 'toast-icon', html: ladder.type === 'train' ? TRAIN_ICON : LADDER_ICON }),
        h('div', {}, h('strong', {}, t(title)), msg ? pair(msg.en, msg.ur, 'toast-msg') : null),
      );
      void toast(content, { host: toastHost, ms: DEFAULTS.ladderToastMs, cls: 'toast-ladder', chime: false });
      await view.climb(player, ladder);
      renderHud();
      await sleep(dur(500));
    } else if (plan.event.kind === 'snake') {
      await view.snakeSlide(player, plan.event.snake);
      renderHud();
    } else {
      renderHud();
      const tile = app.content.tiles.get(plan.final);
      // Squares with a safe habit painted on them but no ladder (square 26 on the current art) get a gentle reminder.
      const special = board.snakes.some((s) => s.from === plan.final || s.to === plan.final) || board.ladders.some((l) => l.from === plan.final || l.to === plan.final);
      if (tile && !special && plan.final !== board.start && plan.final !== board.finish) {
        void toast(pair(str('rememberTile', 'en', { text: tile.en }), str('rememberTile', 'ur', { text: tile.ur || tile.en })), { host: toastHost, ms: 2200 });
      }
    }
  }

  function showSnakeCard(id: number): Promise<void> {
    const m = app.content.snakes[id];
    const lang = getLang();
    const block = (en: string, ur: string, cls: string) => {
      const parts: HTMLElement[] = [];
      if (lang !== 'ur' || !ur) parts.push(h('p', { class: `${cls} t-en`, lang: 'en', dir: 'ltr' }, en));
      if (lang !== 'en' && ur) parts.push(h('p', { class: `${cls} t-ur`, lang: 'ur', dir: 'rtl' }, ur));
      return parts;
    };
    let handle: ReturnType<typeof openModal>;
    const card = h('div', { class: 'snake-card', 'data-testid': 'snake-card' },
      h('div', { class: 'snake-card-icon', html: SNAKE_ICON }),
      h('h2', {}, t('snakeTitle')),
      h('div', { class: 'snake-msg' }, ...block(m.en, m.ur, 'msg')),
      m.tipEn || m.tipUr
        ? h('div', { class: 'safe-tip' }, h('div', { class: 'tip-head' }, h('span', { class: 'tip-icon', 'aria-hidden': 'true', html: SHIELD_ICON }), t('safeTip')), ...block(m.tipEn, m.tipUr, 'tip'))
        : null,
      h('div', { class: 'actions' }, button(t('iUnderstand'), () => handle.close(), 'btn btn-primary btn-xl', { 'data-testid': 'understand', autofocus: 'true' })),
    );
    handle = openModal(card, { cls: 'snake-modal', label: plain('snakeTitle') });
    return handle.closed;
  }

  // ----- pause menu -----
  function openPause() {
    if (paused) return;
    paused = true;
    renderHud();
    let m: ReturnType<typeof openModal>;
    const resume = () => {
      m.close();
    };
    const body = h('div', { class: 'panel pause-menu', 'data-testid': 'pause-menu' },
      h('h2', {}, t('paused')),
      button(t('resume'), resume, 'btn btn-primary btn-xl'),
      button(t('restart'), async () => {
        m.close();
        restart();
      }, 'btn'),
      button(t('rules'), () => openHowTo(), 'btn'),
      button(t('settings'), () => openSettings(app, { inGame: true }), 'btn'),
      button(t('quit'), async () => {
        if (await confirmDialog('confirmQuit')) {
          m.close();
          persist();
          app.show(titleScene(app));
        }
      }, 'btn btn-danger'),
    );
    m = openModal(body, { dismissable: true, label: plain('pause') });
    void m.closed.then(() => {
      paused = false;
      if (!destroyed) {
        renderHud();
        scheduleComputer();
      }
    });
  }

  function restart() {
    const players = state.players.map((p) => ({ name: p.name, characterId: p.characterId, isComputer: p.isComputer }));
    startNewGame(app, board, players);
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      debugOn = !debugOn;
      applyDebug();
      return;
    }
    if (modalOpen()) return;
    if ((e.key === ' ' || e.key === 'Enter') && !(e.target instanceof HTMLInputElement)) {
      if (e.target instanceof HTMLButtonElement && e.target !== die.el) return; // let focused buttons work normally
      e.preventDefault();
      humanRoll();
    } else if (e.key === 'Escape') {
      openPause();
    }
  };

  scheduleComputer();

  return {
    el,
    onKey,
    onBack: () => {
      if (modalOpen()) return closeTopModal();
      openPause();
      return true;
    },
    refresh: () => {
      renderHud();
      applyDebug();
    },
    destroy: () => {
      destroyed = true;
      if (computerTimer !== null) window.clearTimeout(computerTimer);
      view.destroy();
    },
  };
}

const TRAIN_ICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="38" width="56" height="34" rx="8" fill="#E63946"/><rect x="50" y="22" width="26" height="50" rx="6" fill="#7B2FBE"/><rect x="56" y="30" width="14" height="12" rx="3" fill="#E9DDFB"/><rect x="20" y="22" width="10" height="18" rx="3" fill="#3B0A6B"/><circle cx="26" cy="14" r="7" fill="#fff" opacity=".9"/><circle cx="28" cy="78" r="9" fill="#3B0A6B"/><circle cx="58" cy="78" r="9" fill="#3B0A6B"/><path d="M8 90 h84" stroke="#3B0A6B" stroke-width="5" stroke-linecap="round"/></svg>`;
const SHIELD_ICON = `<svg viewBox="0 0 24 24"><path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5Z" fill="#8AC010"/><path d="M8 12 l3 3 l5 -6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

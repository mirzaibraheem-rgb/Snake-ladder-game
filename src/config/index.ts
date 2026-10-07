import boardsJson from './boards.json';
import settingsJson from './settings.json';
import type { BoardDef, RulesConfig } from '../engine/types';
import type { Lang } from '../content/strings';
import { validateBoard } from '../engine/validate';

export const BOARDS = (boardsJson.boards as unknown as BoardDef[]).filter((b) => {
  const errs = validateBoard(b);
  if (errs.length) console.warn(`[boards] ${b.id} has problems:`, errs);
  return true;
});

export const DEFAULTS = settingsJson;

export type BoardChoice = 'A' | 'B' | 'random' | string;

export interface Prefs {
  language: Lang;
  sound: boolean;
  music: boolean;
  board: BoardChoice;
  rules: RulesConfig;
}

const KEY = 'soft-sl-prefs-v1';

export function loadPrefs(): Prefs {
  const base: Prefs = {
    language: DEFAULTS.language as Lang,
    sound: DEFAULTS.sound,
    music: DEFAULTS.music,
    board: DEFAULTS.board,
    rules: { ...DEFAULTS.rules },
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const p = JSON.parse(raw);
    return { ...base, ...p, rules: { ...base.rules, ...(p.rules ?? {}) } };
  } catch {
    return base;
  }
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage may be unavailable */
  }
}

export function pickBoard(choice: BoardChoice, rnd: () => number = Math.random): BoardDef {
  const found = BOARDS.find((b) => b.id === choice);
  if (found) return found;
  return BOARDS[Math.floor(rnd() * BOARDS.length)] ?? BOARDS[0];
}

export function boardById(id: string): BoardDef | undefined {
  return BOARDS.find((b) => b.id === id);
}

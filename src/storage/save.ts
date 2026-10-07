import type { GameState, RulesConfig } from '../engine/types';

const KEY = 'soft-sl-save-v1';

export interface SavedGame {
  savedAt: number;
  state: GameState;
  rules: RulesConfig;
  deck: number[];
  messageCount: number;
}

/** Saves the game on this device only (localStorage). Nothing ever leaves the device. */
export function saveGame(g: SavedGame) {
  try {
    localStorage.setItem(KEY, JSON.stringify(g));
  } catch {
    /* storage full or blocked: the game still works, it just cannot resume */
  }
}

export function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as SavedGame;
    if (!g?.state || g.state.version !== 1 || g.state.winner !== null || !Array.isArray(g.state.players)) return null;
    return g;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

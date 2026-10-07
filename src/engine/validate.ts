import type { BoardDef } from './types';

/** Checks a board map for mistakes. Returns a list of human readable problems (empty = OK). */
export function validateBoard(board: BoardDef): string[] {
  const errors: string[] = [];
  const total = board.grid.cols * board.grid.rows;
  if (board.finish !== total) errors.push(`finish (${board.finish}) should equal cols x rows (${total})`);
  const used = new Map<number, string>();
  const claim = (sq: number, what: string) => {
    if (used.has(sq)) errors.push(`square ${sq} is used by both ${used.get(sq)} and ${what}`);
    used.set(sq, what);
  };
  const inRange = (sq: number) => Number.isInteger(sq) && sq > board.start && sq < board.finish;
  for (const s of board.snakes) {
    if (!inRange(s.from)) errors.push(`snake ${s.id}: head ${s.from} must be between start and finish`);
    if (!(s.to >= board.start && s.to < s.from)) errors.push(`snake ${s.id}: tail ${s.to} must be below head ${s.from}`);
    if (!s.path || s.path.length < 2) errors.push(`snake ${s.id}: path needs at least 2 points`);
    claim(s.from, `snake ${s.id}`);
  }
  for (const l of board.ladders) {
    if (!inRange(l.from)) errors.push(`ladder ${l.id}: bottom ${l.from} must be between start and finish`);
    if (!(l.to > l.from && l.to <= board.finish)) errors.push(`ladder ${l.id}: top ${l.to} must be above bottom ${l.from}`);
    if (!l.path || l.path.length < 2) errors.push(`ladder ${l.id}: path needs at least 2 points`);
    claim(l.from, `ladder ${l.id}`);
  }
  return errors;
}

import { describe, expect, it } from 'vitest';
import boardsJson from '../src/config/boards.json';
import settings from '../src/config/settings.json';
import type { BoardDef, RulesConfig } from '../src/engine/types';
import { isComputerTurn, newGame, planMove, takeTurn } from '../src/engine/rules';
import { pointToSquare, squareCenter, squareToCell } from '../src/engine/geometry';
import { validateBoard } from '../src/engine/validate';
import { MessageDeck } from '../src/engine/messageDeck';
import { rollDie, seededRng } from '../src/engine/rng';

const boards = boardsJson.boards as unknown as BoardDef[];
const A = boards.find((b) => b.id === 'A')!;
const B = boards.find((b) => b.id === 'B')!;
const rules: RulesConfig = settings.rules;
const players = [
  { name: 'P1', characterId: 'ayesha', isComputer: false },
  { name: 'Computer', characterId: 'ali', isComputer: true },
];
const at = (pos: number[], current = 0, streak = 0) => {
  const s = newGame(A, players);
  return { ...s, current, extraTurnStreak: streak, players: s.players.map((p, i) => ({ ...p, position: pos[i] })) };
};

describe('board map matches the art', () => {
  const expected = {
    A: { snakes: [[25, 12], [29, 14], [10, 5]], ladders: [[3, 11], [6, 7], [8, 15], [14, 24], [18, 19], [20, 22], [23, 28]] },
    B: { snakes: [[25, 12], [29, 13], [10, 5]], ladders: [[3, 11], [6, 7], [8, 15], [14, 24], [18, 19], [20, 22], [23, 28]] },
  };
  for (const board of [A, B]) {
    const exp = expected[board.id as 'A' | 'B'];
    it(`board ${board.id} has the expected snakes and ladders`, () => {
      expect(board.snakes.map((s) => [s.from, s.to])).toEqual(exp.snakes);
      expect(board.ladders.map((l) => [l.from, l.to])).toEqual(exp.ladders);
      expect(validateBoard(board)).toEqual([]);
    });
    it(`board ${board.id}: every path starts and ends inside the right squares`, () => {
      for (const s of board.snakes) {
        expect(pointToSquare(board, s.path[0]), `${s.id} head`).toBe(s.from);
        expect(pointToSquare(board, s.path[s.path.length - 1]), `${s.id} tail`).toBe(s.to);
      }
      for (const l of board.ladders) {
        expect(pointToSquare(board, l.path[0]), `${l.id} bottom`).toBe(l.from);
        expect(pointToSquare(board, l.path[l.path.length - 1]), `${l.id} top`).toBe(l.to);
      }
    });
    it(`board ${board.id}: landing on every snake head and ladder bottom`, () => {
      for (const s of board.snakes) {
        for (let roll = 1; roll <= 6; roll++) {
          const from = s.from - roll;
          if (from < 1 || board.snakes.some((x) => x.from === from) || board.ladders.some((x) => x.from === from)) continue;
          const p = planMove(board, rules, from, roll);
          expect(p.event.kind).toBe('snake');
          expect(p.landed).toBe(s.from);
          expect(p.final).toBe(s.to);
        }
      }
      for (const l of board.ladders) {
        const p = planMove(board, rules, l.from - 1, 1);
        expect(p.event.kind).toBe('ladder');
        expect(p.final).toBe(l.to);
      }
    });
  }
});

describe('geometry', () => {
  it('uses serpentine numbering from bottom left', () => {
    expect(squareToCell(A, 1)).toEqual({ row: 0, col: 0 });
    expect(squareToCell(A, 6)).toEqual({ row: 0, col: 5 });
    expect(squareToCell(A, 7)).toEqual({ row: 1, col: 5 });
    expect(squareToCell(A, 12)).toEqual({ row: 1, col: 0 });
    expect(squareToCell(A, 13)).toEqual({ row: 2, col: 0 });
    expect(squareToCell(A, 25)).toEqual({ row: 4, col: 0 });
    expect(squareToCell(A, 30)).toEqual({ row: 4, col: 5 });
  });
  it('round trips centers to squares', () => {
    for (let s = 1; s <= 30; s++) expect(pointToSquare(A, squareCenter(A, s))).toBe(s);
  });
  it('places square 1 bottom left and 30 top right in image pixels', () => {
    const [x1, y1] = squareCenter(A, 1);
    const [x30, y30] = squareCenter(A, 30);
    expect(x1).toBeLessThan(240);
    expect(y1).toBeGreaterThan(1000);
    expect(x30).toBeGreaterThan(1040);
    expect(y30).toBeLessThan(280);
  });
});

describe('movement', () => {
  it('hops square by square for the exact roll', () => {
    const p = planMove(A, rules, 1, 1);
    expect(p.steps).toEqual([2]);
    expect(p.event.kind).toBe('none');
    const q = planMove(A, rules, 11, 4);
    expect(q.steps).toEqual([12, 13, 14, 15]);
  });
  it('rejects invalid rolls', () => {
    expect(() => planMove(A, rules, 1, 0)).toThrow();
    expect(() => planMove(A, rules, 1, 7)).toThrow();
  });
  it('fair die only gives 1 to 6 with roughly equal counts', () => {
    const rng = seededRng(42);
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60000; i++) counts[rollDie(rng) - 1]++;
    for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(500);
    expect(rollDie(() => 0.999999)).toBe(6);
    expect(rollDie(() => 0)).toBe(1);
  });
});

describe('exact finish', () => {
  it('overshoot keeps the player in place with a hint', () => {
    const p = planMove(A, rules, 27, 4);
    expect(p.event).toEqual({ kind: 'overshoot', needed: 3 });
    expect(p.final).toBe(27);
    expect(p.steps).toEqual([]);
  });
  it('exact roll wins', () => {
    const r = takeTurn(A, rules, at([27, 1]), 3);
    expect(r.plan.event.kind).toBe('win');
    expect(r.state.winner).toBe(0);
  });
  it('without the exact rule an overshoot finishes', () => {
    const p = planMove(A, { ...rules, exactRollToFinish: false }, 27, 6);
    expect(p.final).toBe(30);
    expect(p.event.kind).toBe('win');
    expect(p.steps).toEqual([28, 29, 30]);
  });
});

describe('turns and extra turns', () => {
  it('passes the turn after a normal roll', () => {
    const r = takeTurn(A, rules, at([1, 1]), 1);
    expect(r.state.current).toBe(1);
    expect(r.extraTurn).toBe(false);
  });
  it('a 6 gives an extra turn', () => {
    const r = takeTurn(A, rules, at([1, 1]), 6);
    expect(r.extraTurn).toBe(true);
    expect(r.state.current).toBe(0);
    expect(r.state.extraTurnStreak).toBe(1);
  });
  it('caps extra turns at the configured number in a row', () => {
    let s = at([1, 1]);
    const positions = [1];
    for (let i = 0; i < 3; i++) {
      // reset position so the token never reaches special squares
      s = { ...s, players: s.players.map((p, k) => (k === 0 ? { ...p, position: 1 } : p)) };
      const r = takeTurn(A, { ...rules }, s, 6);
      expect(r.extraTurn).toBe(true);
      s = r.state;
      positions.push(s.players[0].position);
    }
    s = { ...s, players: s.players.map((p, k) => (k === 0 ? { ...p, position: 1 } : p)) };
    const capped = takeTurn(A, rules, s, 6);
    expect(capped.extraTurn).toBe(false);
    expect(capped.extraTurnCapped).toBe(true);
    expect(capped.state.current).toBe(1);
    expect(capped.state.extraTurnStreak).toBe(0);
  });
  it('no extra turn when the rule is off', () => {
    const r = takeTurn(A, { ...rules, extraTurnOnSix: false }, at([1, 1]), 6);
    expect(r.extraTurn).toBe(false);
    expect(r.state.current).toBe(1);
  });
  it('a 6 that wins ends the game instead of an extra turn', () => {
    const r = takeTurn(A, rules, at([24, 1]), 6);
    expect(r.state.winner).toBe(0);
    expect(r.extraTurn).toBe(false);
  });
  it('records snakes and ladders met', () => {
    const r1 = takeTurn(A, rules, at([7, 1]), 3); // 10 is the green snake head
    expect(r1.plan.event.kind).toBe('snake');
    expect(r1.state.players[0].position).toBe(5);
    expect(r1.state.players[0].snakesHit).toEqual([10]);
    const r2 = takeTurn(A, rules, at([1, 1]), 2); // 3 is a ladder
    expect(r2.state.players[0].laddersClimbed).toEqual([3]);
    expect(r2.state.players[0].position).toBe(11);
  });
  it('knows when it is the computer turn and refuses moves after a win', () => {
    expect(isComputerTurn(at([1, 1], 1))).toBe(true);
    expect(isComputerTurn(at([1, 1], 0))).toBe(false);
    const won = takeTurn(A, rules, at([27, 1]), 3).state;
    expect(isComputerTurn({ ...won, current: 1 })).toBe(false);
    expect(() => takeTurn(A, rules, won, 1)).toThrow();
  });
  it('yellow snake differs between boards', () => {
    expect(planMove(A, rules, 27, 2).final).toBe(14);
    expect(planMove(B, rules, 27, 2).final).toBe(13);
  });
  it('board A: the yellow tail lands on the 14 ladder bottom but does not chain into the ladder', () => {
    const r = takeTurn(A, rules, at([27, 1]), 2);
    expect(r.state.players[0].position).toBe(14);
  });
});

describe('validation catches mistakes', () => {
  it('flags bad snakes and ladders', () => {
    const bad: BoardDef = JSON.parse(JSON.stringify(A));
    bad.snakes[0].to = 27;
    bad.ladders[0].from = 10;
    const errs = validateBoard(bad);
    expect(errs.some((e) => e.includes('pink'))).toBe(true);
    expect(errs.some((e) => e.includes('square 10'))).toBe(true);
  });
});

describe('message deck', () => {
  it('does not repeat until all messages are used', () => {
    const d = new MessageDeck(60, seededRng(7));
    const seen = new Set<number>();
    for (let i = 0; i < 60; i++) seen.add(d.next());
    expect(seen.size).toBe(60);
    const nextRound = new Set<number>();
    for (let i = 0; i < 60; i++) nextRound.add(d.next());
    expect(nextRound.size).toBe(60);
  });
  it('never shows the same message twice in a row across a reshuffle', () => {
    for (let seed = 0; seed < 200; seed++) {
      const d = new MessageDeck(3, seededRng(seed));
      let prev = -1;
      for (let i = 0; i < 30; i++) {
        const n = d.next();
        expect(n).not.toBe(prev);
        prev = n;
      }
    }
  });
  it('restores from a saved snapshot', () => {
    const d = new MessageDeck(5, seededRng(1));
    d.next();
    const snap = d.snapshot();
    const d2 = new MessageDeck(5, seededRng(2), snap);
    expect(d2.snapshot()).toEqual(snap);
    expect(new MessageDeck(5, seededRng(2), [9]).snapshot()).toEqual([]);
  });
  it('handles a single message', () => {
    const d = new MessageDeck(1);
    expect([d.next(), d.next()]).toEqual([0, 0]);
  });
});

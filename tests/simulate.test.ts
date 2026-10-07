import { describe, expect, it } from 'vitest';
import boardsJson from '../src/config/boards.json';
import settings from '../src/config/settings.json';
import type { BoardDef, RulesConfig } from '../src/engine/types';
import { newGame, takeTurn } from '../src/engine/rules';
import { rollDie, seededRng } from '../src/engine/rng';

const boards = boardsJson.boards as unknown as BoardDef[];

function simulate(board: BoardDef, rules: RulesConfig, seed: number, computers: [boolean, boolean]) {
  const rng = seededRng(seed);
  let s = newGame(board, [
    { name: 'A', characterId: 'a', isComputer: computers[0] },
    { name: 'B', characterId: 'b', isComputer: computers[1] },
  ]);
  let turns = 0;
  let sixStreak = 0;
  while (s.winner === null) {
    if (++turns > 5000) throw new Error(`stuck: seed ${seed}`);
    const before = s.current;
    const roll = rollDie(rng);
    const r = takeTurn(board, rules, s, roll);
    for (const p of r.state.players) {
      expect(p.position).toBeGreaterThanOrEqual(1);
      expect(p.position).toBeLessThanOrEqual(board.finish);
    }
    sixStreak = r.state.current === before && r.state.winner === null ? sixStreak + 1 : 0;
    expect(sixStreak).toBeLessThanOrEqual(rules.maxExtraTurnsInARow);
    s = r.state;
  }
  return turns;
}

describe('1,000 headless games', () => {
  const variants: [string, RulesConfig][] = [
    ['default rules', settings.rules],
    ['no exact finish', { ...settings.rules, exactRollToFinish: false }],
    ['no extra turns', { ...settings.rules, extraTurnOnSix: false }],
  ];
  for (const [label, rules] of variants) {
    it(`every game ends with ${label}`, () => {
      const lengths: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const board = boards[i % boards.length];
        lengths.push(simulate(board, rules, i + 1, [i % 2 === 0, true]));
      }
      expect(lengths.length).toBe(1000);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      // Sanity: a 30 square board should finish in a reasonable number of rolls.
      expect(avg).toBeGreaterThan(4);
      expect(avg).toBeLessThan(200);
      console.log(`${label}: average ${avg.toFixed(1)} rolls, longest ${Math.max(...lengths)}`);
    });
  }
});

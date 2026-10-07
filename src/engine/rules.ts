import type { BoardDef, GameState, MovePlan, PlayerState, RulesConfig, TurnResult } from './types';

export function snakeAt(board: BoardDef, square: number) {
  return board.snakes.find((s) => s.from === square);
}

export function ladderAt(board: BoardDef, square: number) {
  return board.ladders.find((l) => l.from === square);
}

/** Pure: work out where a roll takes a token. Does not change any state. */
export function planMove(board: BoardDef, rules: RulesConfig, from: number, roll: number): MovePlan {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) throw new Error(`Invalid roll ${roll}`);
  const finish = board.finish;
  let target = from + roll;
  if (target > finish) {
    if (rules.exactRollToFinish) {
      return { roll, from, steps: [], landed: from, final: from, event: { kind: 'overshoot', needed: finish - from } };
    }
    target = finish;
  }
  const steps: number[] = [];
  for (let s = from + 1; s <= target; s++) steps.push(s);
  if (target === finish) return { roll, from, steps, landed: target, final: target, event: { kind: 'win' } };
  const snake = snakeAt(board, target);
  if (snake) return { roll, from, steps, landed: target, final: snake.to, event: { kind: 'snake', snake } };
  const ladder = ladderAt(board, target);
  // A ladder that reaches the finish still animates as a ladder; takeTurn detects the win from final === finish.
  if (ladder) return { roll, from, steps, landed: target, final: ladder.to, event: { kind: 'ladder', ladder } };
  return { roll, from, steps, landed: target, final: target, event: { kind: 'none' } };
}

export interface NewPlayer {
  name: string;
  characterId: string;
  isComputer: boolean;
}

export function newGame(board: BoardDef, players: NewPlayer[]): GameState {
  if (players.length < 1 || players.length > 2) throw new Error('Game needs 1 or 2 players');
  return {
    version: 1,
    boardId: board.id,
    players: players.map<PlayerState>((p) => ({
      ...p,
      position: board.start,
      snakesHit: [],
      laddersClimbed: [],
      messagesSeen: [],
    })),
    current: 0,
    extraTurnStreak: 0,
    winner: null,
    turnCount: 0,
  };
}

/** Pure: apply one roll for the current player and decide who plays next. */
export function takeTurn(board: BoardDef, rules: RulesConfig, state: GameState, roll: number): TurnResult {
  if (state.winner !== null) throw new Error('Game is already over');
  const player = state.current;
  const plan = planMove(board, rules, state.players[player].position, roll);
  const players = state.players.map((p, i) => {
    if (i !== player) return p;
    const next = { ...p, position: plan.final };
    if (plan.event.kind === 'snake') next.snakesHit = [...p.snakesHit, plan.landed];
    if (plan.event.kind === 'ladder') next.laddersClimbed = [...p.laddersClimbed, plan.landed];
    return next;
  });
  const won = plan.final === board.finish;
  const earned = rules.extraTurnOnSix && roll === 6 && !won;
  const extraTurn = earned && state.extraTurnStreak < rules.maxExtraTurnsInARow;
  const nextState: GameState = {
    ...state,
    players,
    winner: won ? player : null,
    current: won || extraTurn ? player : (player + 1) % players.length,
    extraTurnStreak: extraTurn ? state.extraTurnStreak + 1 : 0,
    turnCount: state.turnCount + 1,
  };
  return { state: nextState, plan, player, extraTurn, extraTurnCapped: earned && !extraTurn };
}

export function recordMessageSeen(state: GameState, player: number, messageId: number): GameState {
  return {
    ...state,
    players: state.players.map((p, i) => (i === player ? { ...p, messagesSeen: [...p.messagesSeen, messageId] } : p)),
  };
}

export function isComputerTurn(state: GameState): boolean {
  return state.winner === null && state.players[state.current].isComputer;
}

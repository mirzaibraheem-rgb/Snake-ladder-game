export type Point = [number, number];

export interface GridDef {
  cols: number;
  rows: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  numbering: 'serpentine_from_bottom_left';
}

export interface SnakeDef {
  id: string;
  color?: string;
  from: number; // head square
  to: number; // tail square
  path: Point[]; // head to tail, image pixels
}

export interface LadderDef {
  id: string;
  type: 'ladder' | 'train';
  from: number; // bottom square
  to: number; // top square
  path: Point[]; // bottom to top, image pixels
}

export interface BoardDef {
  id: string;
  name: string;
  image: string;
  imageSize: [number, number];
  note?: string;
  grid: GridDef;
  start: number;
  finish: number;
  snakes: SnakeDef[];
  ladders: LadderDef[];
}

export interface RulesConfig {
  exactRollToFinish: boolean;
  extraTurnOnSix: boolean;
  maxExtraTurnsInARow: number;
}

export interface PlayerState {
  name: string;
  characterId: string;
  isComputer: boolean;
  position: number;
  /** Snake squares this player landed on, in order */
  snakesHit: number[];
  /** Ladder squares this player climbed, in order */
  laddersClimbed: number[];
  /** Ids of snake messages this player saw */
  messagesSeen: number[];
}

export interface GameState {
  version: 1;
  boardId: string;
  players: PlayerState[];
  current: number;
  /** extra turns already granted in a row to the current player */
  extraTurnStreak: number;
  winner: number | null;
  turnCount: number;
}

export type MoveEvent =
  | { kind: 'none' }
  | { kind: 'overshoot'; needed: number }
  | { kind: 'snake'; snake: SnakeDef }
  | { kind: 'ladder'; ladder: LadderDef }
  | { kind: 'win' };

export interface MovePlan {
  roll: number;
  from: number;
  /** squares hopped through, one per step (empty on overshoot) */
  steps: number[];
  /** square reached by hopping (before snake/ladder) */
  landed: number;
  /** final square after snake/ladder */
  final: number;
  event: MoveEvent;
}

export interface TurnResult {
  state: GameState;
  plan: MovePlan;
  player: number;
  extraTurn: boolean;
  /** extra turn was earned by a 6 but the in a row limit was reached */
  extraTurnCapped: boolean;
}

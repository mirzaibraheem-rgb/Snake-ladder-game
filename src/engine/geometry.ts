import type { BoardDef, Point } from './types';

export function cellSize(board: BoardDef): { w: number; h: number } {
  const g = board.grid;
  return { w: (g.right - g.left) / g.cols, h: (g.bottom - g.top) / g.rows };
}

/** Row (0 = bottom) and column (0 = left) of a square, using serpentine numbering. */
export function squareToCell(board: BoardDef, square: number): { row: number; col: number } {
  const { cols } = board.grid;
  const i = square - 1;
  const row = Math.floor(i / cols);
  const inRow = i % cols;
  const col = row % 2 === 0 ? inRow : cols - 1 - inRow;
  return { row, col };
}

export function cellToSquare(board: BoardDef, row: number, col: number): number {
  const { cols } = board.grid;
  const inRow = row % 2 === 0 ? col : cols - 1 - col;
  return row * cols + inRow + 1;
}

/** Bounding box of a square in image pixels. */
export function squareRect(board: BoardDef, square: number) {
  const g = board.grid;
  const { w, h } = cellSize(board);
  const { row, col } = squareToCell(board, square);
  const x = g.left + col * w;
  const y = g.bottom - (row + 1) * h;
  return { x, y, w, h };
}

export function squareCenter(board: BoardDef, square: number): Point {
  const r = squareRect(board, square);
  return [r.x + r.w / 2, r.y + r.h / 2];
}

/** Which square contains an image pixel, or null if outside the grid. */
export function pointToSquare(board: BoardDef, p: Point): number | null {
  const g = board.grid;
  const { w, h } = cellSize(board);
  if (p[0] < g.left || p[0] >= g.right || p[1] < g.top || p[1] >= g.bottom) return null;
  const col = Math.floor((p[0] - g.left) / w);
  const row = Math.floor((g.bottom - p[1]) / h);
  return cellToSquare(board, row, col);
}

export function polylineLength(pts: Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}

/** Point at fraction t (0..1) of the polyline's arc length. */
export function pointAlong(pts: Point[], t: number): Point {
  if (pts.length === 0) return [0, 0];
  if (pts.length === 1 || t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];
  const total = polylineLength(pts);
  let target = total * t;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (target <= seg) {
      const k = seg === 0 ? 0 : target / seg;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    target -= seg;
  }
  return pts[pts.length - 1];
}

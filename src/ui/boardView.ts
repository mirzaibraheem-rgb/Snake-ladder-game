import type { BoardDef, LadderDef, Point, SnakeDef } from '../engine/types';
import { pointAlong, polylineLength, squareCenter, squareRect } from '../engine/geometry';
import { characterById, characterSVG } from '../characters/characters';
import { h, svgEl, tween, ease, dur, sleep } from './dom';
import { sound } from '../audio/sound';

export type CharState = 'idle' | 'hop' | 'celebrate' | 'sad' | 'climb';

const IMG = 1280; // board art is 1280 x 1280; all positions are stored in this pixel space
const TOKEN_W = 150; // token width in image pixels
const FEET_OFFSET = 78; // token feet sit this far below a square's center
const SHARE_OFFSET = 46; // sideways shift when two tokens share a square

class Token {
  el: HTMLDivElement;
  pos: Point = [0, 0];
  constructor(characterId: string, public index: number, label: string) {
    this.el = h('div', { class: 'token st-idle', 'aria-label': label, html: characterSVG(characterById(characterId), { title: label }) });
    this.el.style.setProperty('--delay', `${index * -0.6}s`);
  }
  setState(s: CharState) {
    this.el.className = `token st-${s}${this.el.classList.contains('active') ? ' active' : ''}`;
  }
  setActive(on: boolean) {
    this.el.classList.toggle('active', on);
  }
}

/** Renders the board art, the player tokens, effects and the calibration overlay. */
export class BoardView {
  el: HTMLDivElement;
  private img: HTMLImageElement;
  private fx: SVGSVGElement;
  private debugLayer: SVGGElement;
  private tokens: Token[] = [];
  private scale = 1;
  private squares: number[] = [];
  private ro: ResizeObserver;
  debugOn = false;

  constructor(
    public board: BoardDef,
    private host: HTMLElement,
  ) {
    this.img = h('img', { class: 'board-img', src: board.image, alt: board.name, draggable: 'false' });
    this.fx = svgEl('svg', { class: 'board-fx', viewBox: `0 0 ${IMG} ${IMG}`, 'aria-hidden': 'true' });
    this.debugLayer = svgEl('g', { class: 'debug-layer' });
    this.fx.append(this.debugLayer);
    this.el = h('div', { class: 'board' }, this.img, this.fx);
    host.append(this.el);
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(host);
    this.layout();
  }

  destroy() {
    this.ro.disconnect();
    this.el.remove();
  }

  /** Keep the board a letterboxed square that fits its container at any size. */
  layout() {
    const size = Math.max(100, Math.floor(Math.min(this.host.clientWidth, this.host.clientHeight)));
    this.el.style.width = `${size}px`;
    this.el.style.height = `${size}px`;
    this.scale = size / IMG;
    this.el.style.setProperty('--token-w', `${TOKEN_W * this.scale}px`);
    this.tokens.forEach((t) => this.place(t, t.pos));
  }

  setPlayers(players: { characterId: string; name: string; position: number }[]) {
    this.tokens.forEach((t) => t.el.remove());
    this.tokens = players.map((p, i) => {
      const t = new Token(p.characterId, i, p.name);
      this.el.append(t.el);
      return t;
    });
    this.squares = players.map((p) => p.position);
    this.settle();
  }

  setActive(i: number) {
    this.tokens.forEach((t, k) => t.setActive(k === i));
  }

  setState(i: number, s: CharState) {
    this.tokens[i]?.setState(s);
  }

  /** Where a token stands on a square, accounting for a second token on the same square. */
  spot(square: number, who: number): Point {
    const [cx, cy] = squareCenter(this.board, square);
    const sharing = this.squares.filter((s) => s === square).length > 1;
    const dx = sharing ? (who === 0 ? -SHARE_OFFSET : SHARE_OFFSET) : 0;
    return [cx + dx, cy + FEET_OFFSET];
  }

  private place(t: Token, p: Point, lift = 0) {
    t.pos = p;
    const s = this.scale;
    const w = TOKEN_W * s;
    t.el.style.transform = `translate(${p[0] * s - w / 2}px, ${(p[1] - lift) * s - w * 1.25}px)`;
    t.el.style.zIndex = String(Math.round(p[1]) + (t.el.classList.contains('active') ? 2000 : 1000));
  }

  /** Snap every token to its square (used after moves and on resize). */
  settle(animate = true) {
    this.tokens.forEach((t, i) => {
      const target = this.spot(this.squares[i], i);
      if (!animate || (t.pos[0] === 0 && t.pos[1] === 0)) this.place(t, target);
      else {
        const from = t.pos;
        void tween(220, (k) => this.place(t, [from[0] + (target[0] - from[0]) * k, from[1] + (target[1] - from[1]) * k]));
      }
    });
  }

  /** Hop square by square. */
  async hop(who: number, steps: number[], hopMs: number) {
    const t = this.tokens[who];
    t.setState('hop');
    for (let i = 0; i < steps.length; i++) {
      this.squares[who] = steps[i];
      const from = t.pos;
      const to = this.spot(steps[i], who);
      sound.hop(i);
      await tween(hopMs, (k) => {
        const x = from[0] + (to[0] - from[0]) * k;
        const y = from[1] + (to[1] - from[1]) * k;
        this.place(t, [x, y], Math.sin(k * Math.PI) * 70);
      }, ease.linear);
    }
    t.setState('idle');
    this.settle();
  }

  /** Bump in place when a roll is too big to finish exactly. */
  async bump(who: number) {
    const t = this.tokens[who];
    const p = t.pos;
    sound.bump();
    await tween(380, (k) => this.place(t, p, Math.sin(k * Math.PI * 2) * 20 * (1 - k)));
  }

  private async travel(who: number, pts: Point[], msPerPx: number, minMs: number) {
    const t = this.tokens[who];
    const len = polylineLength(pts);
    await tween(Math.max(minMs, len * msPerPx), (k) => this.place(t, pointAlong(pts, k)), ease.inOut);
  }

  /** Slide down a painted snake: pulse the head, a friendly "bite", then follow the body. */
  async snakeSlide(who: number, snake: SnakeDef) {
    const head = snake.path[0];
    await this.pulse(head, snake.color ?? '#F72E8C');
    this.burst(head, 'OOPS!');
    sound.snake();
    this.tokens[who].setState('sad');
    await sleep(dur(450));
    this.squares[who] = snake.to;
    const t = this.tokens[who];
    const end = this.spot(snake.to, who);
    // Feet follow the snake's body line; small vertical shift so the token rides on top of it.
    const body = snake.path.map(([x, y]) => [x, y + 40] as Point);
    await this.travel(who, [t.pos, ...body, end], 2.2, 1400);
    this.settle();
  }

  /** Climb a ladder or ride a train along the painted track. */
  async climb(who: number, ladder: LadderDef) {
    const t = this.tokens[who];
    t.setState('climb');
    if (ladder.type === 'train') sound.train();
    else sound.ladder();
    this.squares[who] = ladder.to;
    const end = this.spot(ladder.to, who);
    const track = ladder.path.map(([x, y]) => [x, y + 40] as Point);
    const sparkle = window.setInterval(() => this.sparkle(t.pos, ladder.type === 'train'), dur(90));
    await this.travel(who, [t.pos, ...track, end], 3.2, 1300);
    window.clearInterval(sparkle);
    t.setState('celebrate');
    await sleep(dur(700));
    t.setState('idle');
    this.settle();
  }

  private async pulse(p: Point, color: string) {
    const ring = svgEl('circle', { cx: p[0], cy: p[1], r: 30, fill: 'none', stroke: color, 'stroke-width': 10, class: 'fx-pulse' });
    this.fx.insertBefore(ring, this.debugLayer);
    await tween(700, (k) => {
      ring.setAttribute('r', String(30 + 70 * ((k * 2) % 1)));
      ring.setAttribute('opacity', String(1 - ((k * 2) % 1)));
    }, ease.linear);
    ring.remove();
  }

  private burst(p: Point, text: string) {
    const g = svgEl('g', { class: 'fx-burst', transform: `translate(${p[0]} ${p[1] - 40})` });
    const spikes = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 ? 58 : 92;
      return `${Math.cos(a) * r},${Math.sin(a) * r}`;
    }).join(' ');
    g.append(svgEl('polygon', { points: spikes, fill: '#FFD23F', stroke: '#FF8A1F', 'stroke-width': 6 }));
    const txt = svgEl('text', { 'text-anchor': 'middle', y: 12, class: 'fx-burst-text' });
    txt.textContent = text;
    g.append(txt);
    this.fx.insertBefore(g, this.debugLayer);
    setTimeout(() => g.remove(), dur(1300));
  }

  private sparkle(p: Point, puff: boolean) {
    const x = p[0] + (Math.random() - 0.5) * 80;
    const y = p[1] - 60 - Math.random() * 60;
    const el = puff
      ? svgEl('circle', { cx: x, cy: y - 40, r: 14 + Math.random() * 12, fill: '#FFFFFF', opacity: 0.9, class: 'fx-puff' })
      : svgEl('path', { d: `M${x} ${y - 16} L${x + 5} ${y - 5} L${x + 16} ${y} L${x + 5} ${y + 5} L${x} ${y + 16} L${x - 5} ${y + 5} L${x - 16} ${y} L${x - 5} ${y - 5}Z`, fill: ['#FFD23F', '#FFFFFF', '#8AC010', '#FF8A1F'][Math.floor(Math.random() * 4)], class: 'fx-spark' });
    this.fx.insertBefore(el, this.debugLayer);
    setTimeout(() => el.remove(), dur(800));
  }

  celebrate(who: number) {
    this.tokens[who]?.setState('celebrate');
  }

  // ---------- calibration overlay ----------
  setDebug(on: boolean, tileText?: (sq: number) => string | undefined) {
    this.debugOn = on;
    this.el.classList.toggle('debug', on);
    this.debugLayer.replaceChildren();
    if (!on) return;
    const b = this.board;
    const L = this.debugLayer;
    const g = b.grid;
    L.append(svgEl('rect', { x: g.left, y: g.top, width: g.right - g.left, height: g.bottom - g.top, fill: 'none', stroke: '#00E5FF', 'stroke-width': 4 }));
    for (let sq = 1; sq <= b.finish; sq++) {
      const r = squareRect(b, sq);
      const [cx, cy] = squareCenter(b, sq);
      L.append(svgEl('rect', { x: r.x, y: r.y, width: r.w, height: r.h, fill: 'none', stroke: '#00E5FF', 'stroke-width': 2, 'stroke-dasharray': '10 6' }));
      L.append(svgEl('circle', { cx, cy, r: 6, fill: '#00E5FF' }));
      const n = svgEl('text', { x: r.x + 10, y: r.y + r.h - 12, class: 'dbg-num' });
      n.textContent = String(sq);
      L.append(n);
      const tt = tileText?.(sq);
      if (tt) {
        const tl = svgEl('text', { x: r.x + 10, y: r.y + r.h - 50, class: 'dbg-tile' });
        tl.textContent = tt.length > 26 ? `${tt.slice(0, 25)}…` : tt;
        L.append(tl);
      }
    }
    const drawPath = (pts: Point[], color: string, label: string, dashed: boolean) => {
      L.append(svgEl('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: '#000', 'stroke-width': 12, opacity: 0.35, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      L.append(svgEl('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-dasharray': dashed ? '18 10' : '', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      pts.forEach((p, i) => L.append(svgEl('circle', { cx: p[0], cy: p[1], r: i === 0 ? 14 : 7, fill: i === 0 ? '#fff' : color, stroke: color, 'stroke-width': 4 })));
      const lab = svgEl('text', { x: pts[0][0] + 18, y: pts[0][1] - 14, class: 'dbg-label' });
      lab.textContent = label;
      L.append(lab);
    };
    for (const s of b.snakes) drawPath(s.path, '#FF1744', `SNAKE ${s.from}→${s.to}`, false);
    for (const l of b.ladders) drawPath(l.path, '#00C853', `${l.type.toUpperCase()} ${l.from}→${l.to}`, true);
  }

  /** Convert a click on the board to image pixel coordinates (calibration helper). */
  toImage(clientX: number, clientY: number): Point {
    const r = this.el.getBoundingClientRect();
    return [Math.round(((clientX - r.left) / r.width) * IMG), Math.round(((clientY - r.top) / r.height) * IMG)];
  }
}

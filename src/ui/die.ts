import { h, dur, sleep } from './dom';
import { sound } from '../audio/sound';

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

// Which rotation shows each face at the front.
const SHOW: Record<number, [number, number]> = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 2: [-90, 0], 5: [90, 0] };
const FACE_POS: Record<number, string> = {
  1: 'rotateY(0deg)',
  6: 'rotateY(180deg)',
  3: 'rotateY(90deg)',
  4: 'rotateY(-90deg)',
  2: 'rotateX(90deg)',
  5: 'rotateX(-90deg)',
};

function face(n: number) {
  const pips = PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('');
  return h('div', { class: `die-face f${n}`, html: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="${n === 1 ? '#E63946' : '#3B0A6B'}">${pips}</g></svg>` });
}

/** A big tappable 3D die. */
export class Die {
  el: HTMLButtonElement;
  private cube: HTMLDivElement;
  private rx = -20;
  private ry = 20;
  value = 1;

  constructor(onRoll: () => void, label: string) {
    this.cube = h('div', { class: 'die-cube' });
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const f = face(n);
      f.style.transform = `${FACE_POS[n]} translateZ(var(--die-half))`;
      this.cube.append(f);
    }
    this.el = h('button', { class: 'die', type: 'button', 'aria-label': label, onclick: () => onRoll() }, h('div', { class: 'die-scene' }, this.cube));
    this.applyRotation(0);
  }

  setLabel(label: string) {
    this.el.setAttribute('aria-label', label);
  }

  setEnabled(on: boolean) {
    this.el.disabled = !on;
    this.el.classList.toggle('ready', on);
  }

  private applyRotation(ms: number) {
    this.cube.style.transition = ms ? `transform ${ms}ms cubic-bezier(.2,.75,.25,1.05)` : 'none';
    this.cube.style.transform = `rotateX(${this.rx}deg) rotateY(${this.ry}deg)`;
  }

  /** Tumble, then land showing `value`. */
  async roll(value: number) {
    this.value = value;
    sound.dice();
    const [tx, ty] = SHOW[value];
    const spinsX = 2 + Math.floor(Math.random() * 2);
    const spinsY = 1 + Math.floor(Math.random() * 2);
    const norm = (cur: number, target: number, spins: number) => {
      const base = Math.ceil((cur + 1) / 360) * 360;
      return base + spins * 360 + target;
    };
    this.rx = norm(this.rx, tx, spinsX);
    this.ry = norm(this.ry, ty, spinsY);
    const ms = Math.round(dur(900));
    this.el.classList.add('rolling');
    this.applyRotation(ms);
    await sleep(ms + 30);
    this.el.classList.remove('rolling');
    this.el.setAttribute('data-value', String(value));
  }

  /** Show a face instantly (used when restoring a saved game). */
  show(value: number) {
    const [tx, ty] = SHOW[value];
    this.rx = tx;
    this.ry = ty;
    this.applyRotation(0);
  }
}

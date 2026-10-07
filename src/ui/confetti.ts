import { prefersReducedMotion } from './dom';

const COLORS = ['#7B2FBE', '#FF8A1F', '#8AC010', '#F72E8C', '#FCC311', '#2F7BEA', '#FFFFFF'];

/** Lightweight canvas confetti. Returns a stop function. */
export function confetti(host: HTMLElement): () => void {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  host.append(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = 0;
  let hgt = 0;
  const resize = () => {
    w = host.clientWidth;
    hgt = host.clientHeight;
    canvas.width = w * dpr;
    canvas.height = hgt * dpr;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
  const count = prefersReducedMotion() ? 40 : 140;
  const parts = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: -Math.random() * hgt,
    vx: (Math.random() - 0.5) * 1.5,
    vy: 1.5 + Math.random() * 2.5,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.2,
    s: 6 + Math.random() * 8,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  let raf = 0;
  let running = true;
  const start = performance.now();
  const frame = (now: number) => {
    if (!ctx || !running) return;
    ctx.clearRect(0, 0, w, hgt);
    const fading = now - start > 7000;
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y > hgt + 20 && !fading) {
        p.y = -20;
        p.x = Math.random() * w;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (fading && parts.every((p) => p.y > hgt + 20)) return;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

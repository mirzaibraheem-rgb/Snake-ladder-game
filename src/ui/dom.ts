type Attrs = Record<string, string | number | boolean | EventListener | undefined | null>;
type Child = Node | string | number | null | undefined | false;

/** Tiny element builder: h('button', { class: 'btn', onclick: fn }, 'Play') */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: (Child | Child[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'html') el.innerHTML = String(v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

export function append(el: Element, children: (Child | Child[])[]) {
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Global animation speed. ?fast=1 speeds everything up (used by automated screenshot tests). */
export const speed = (() => {
  try {
    return new URLSearchParams(location.search).get('fast') === '1' ? 0.15 : 1;
  } catch {
    return 1;
  }
})();

export function dur(ms: number) {
  return ms * speed * (prefersReducedMotion() ? 0.35 : 1);
}

export const ease = {
  linear: (t: number) => t,
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  out: (t: number) => 1 - (1 - t) ** 3,
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
};

/** requestAnimationFrame tween; resolves when done. */
export function tween(ms: number, fn: (t: number) => void, easing: (t: number) => number = ease.inOut): Promise<void> {
  const total = dur(ms);
  return new Promise((resolve) => {
    if (total <= 1) {
      fn(1);
      resolve();
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      fn(easing(t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

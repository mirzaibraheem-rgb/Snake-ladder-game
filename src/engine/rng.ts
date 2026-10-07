/** Random source: returns a float in [0, 1). Injectable for tests. */
export type Rng = () => number;

/** Fair, unbiased die roll 1..6. Uses crypto when available. */
export function cryptoRng(): number {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}

export function rollDie(rng: Rng = cryptoRng): number {
  return Math.min(6, Math.floor(rng() * 6) + 1);
}

/** Small seeded generator (mulberry32) for tests and simulations. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: Rng = cryptoRng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

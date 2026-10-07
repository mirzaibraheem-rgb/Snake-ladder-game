import { cryptoRng, shuffle, type Rng } from './rng';

/**
 * Hands out message ids in random order without repeating until every
 * message has been shown, then reshuffles (never repeating the last one first).
 */
export class MessageDeck {
  private order: number[] = [];
  constructor(
    private readonly count: number,
    private readonly rng: Rng = cryptoRng,
    saved?: number[],
  ) {
    if (saved && saved.every((n) => Number.isInteger(n) && n >= 0 && n < count)) this.order = saved.slice();
  }

  next(): number {
    if (this.count <= 0) return -1;
    if (this.order.length === 0) this.refill();
    this.last = this.order.shift() as number;
    return this.last;
  }

  private last = -1;
  private refill() {
    const all = Array.from({ length: this.count }, (_, i) => i);
    let order = shuffle(all, this.rng);
    if (order.length > 1 && order[0] === this.last) order = [...order.slice(1), order[0]];
    this.order = order;
  }

  /** remaining ids, for saving */
  snapshot(): number[] {
    return this.order.slice();
  }
}

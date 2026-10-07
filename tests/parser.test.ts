import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSnakeMessages, parseSquareMessages, withFallback } from '../src/content/parser';
import { loadText } from '../src/content/loader';

const VALID = `# comment
EN: A new online "friend" asks for your address. Would a real friend need that?
UR: ایک نیا آن لائن "دوست" آپ کا پتہ مانگتا ہے۔
TIP_EN: Never share your address online.
TIP_UR: اپنا پتہ کبھی آن لائن شیئر نہ کریں۔
---
EN: Second message
---
`;

describe('snake message parser', () => {
  it('parses a valid file', () => {
    const r = parseSnakeMessages(VALID);
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toEqual({
      id: 0,
      en: 'A new online "friend" asks for your address. Would a real friend need that?',
      ur: 'ایک نیا آن لائن "دوست" آپ کا پتہ مانگتا ہے۔',
      tipEn: 'Never share your address online.',
      tipUr: 'اپنا پتہ کبھی آن لائن شیئر نہ کریں۔',
    });
    expect(r.items[1]).toMatchObject({ id: 1, en: 'Second message', ur: '', tipEn: '' });
    expect(r.warnings).toEqual([]);
  });
  it('keeps Urdu text exactly, including RTL punctuation', () => {
    const r = parseSnakeMessages('EN: x\nUR:   کیا ایک سچے دوست کو اس کی ضرورت ہوگی؟  \n');
    expect(r.items[0].ur).toBe('کیا ایک سچے دوست کو اس کی ضرورت ہوگی؟');
  });
  it('handles an empty file', () => {
    expect(parseSnakeMessages('').items).toEqual([]);
    expect(parseSnakeMessages('# only comments\n\n---\n').items).toEqual([]);
  });
  it('handles a missing file without crashing', () => {
    expect(parseSnakeMessages(undefined).items).toEqual([]);
    expect(parseSnakeMessages(null).warnings.length).toBe(1);
  });
  it('falls back to bundled defaults when the file is unusable', () => {
    const r = withFallback(parseSnakeMessages(undefined), () => parseSnakeMessages(VALID));
    expect(r.items).toHaveLength(2);
    expect(r.warnings.some((w) => w.includes('built in'))).toBe(true);
  });
  it('uses only the first 60 messages and warns', () => {
    const many = Array.from({ length: 75 }, (_, i) => `EN: message ${i + 1}`).join('\n---\n');
    const r = parseSnakeMessages(many);
    expect(r.items).toHaveLength(60);
    expect(r.items[59].en).toBe('message 60');
    expect(r.warnings.some((w) => w.includes('75'))).toBe(true);
  });
  it('skips malformed blocks and keeps the good ones', () => {
    const text = `UR: only urdu here\n---\nthis line has no key\nEN: good one\n---\nTIP_EN: tip without message\n---\nEN:\n---\nEN: also good\nEXTRA line continues`;
    const r = parseSnakeMessages(text);
    expect(r.items.map((i) => i.en)).toEqual(['good one', 'also good EXTRA line continues']);
    expect(r.warnings.length).toBeGreaterThanOrEqual(3);
  });
  it('tolerates Windows and old Mac line endings, BOM and odd spacing', () => {
    const win = '﻿# c\r\nEN:  hello  \r\nTIP_EN:tip\r\n---\r\nen : lower case key\r\n';
    const r = parseSnakeMessages(win);
    expect(r.items.map((i) => i.en)).toEqual(['hello', 'lower case key']);
    expect(r.items[0].tipEn).toBe('tip');
    const mac = 'EN: one\r---\rEN: two\r';
    expect(parseSnakeMessages(mac).items).toHaveLength(2);
  });
  it('accepts long dash separators', () => {
    expect(parseSnakeMessages('EN: a\n-----\nEN: b').items).toHaveLength(2);
  });
  it('the shipped content file has exactly 60 complete messages', () => {
    const r = parseSnakeMessages(readFileSync('content/snake_messages.txt', 'utf8'));
    expect(r.warnings).toEqual([]);
    expect(r.items).toHaveLength(60);
    for (const m of r.items) {
      expect(m.ur.length, m.en).toBeGreaterThan(0);
      expect(m.tipEn.length, m.en).toBeGreaterThan(0);
      expect(m.tipUr.length, m.en).toBeGreaterThan(0);
      expect(m.en.length, m.en).toBeLessThanOrEqual(160);
    }
  });
});

describe('square message parser (ladders and tiles)', () => {
  it('parses squares', () => {
    const r = parseSquareMessages('SQUARE: 3\nEN: Great!\nUR: شاباش\n---\nSQUARE: 6\nEN: Nice');
    expect(r.items).toEqual([
      { square: 3, en: 'Great!', ur: 'شاباش' },
      { square: 6, en: 'Nice', ur: '' },
    ]);
  });
  it('skips blocks without a square or text and keeps the last duplicate', () => {
    const r = parseSquareMessages('EN: no square\n---\nSQUARE: x\nEN: bad\n---\nSQUARE: 4\n---\nSQUARE: 8\nEN: one\n---\nSQUARE: 8\nEN: two');
    expect(r.items).toEqual([{ square: 8, en: 'two', ur: '' }]);
    expect(r.warnings.length).toBe(4);
  });
  it('shipped ladder and tile files cover every ladder and the special squares', () => {
    const ladders = parseSquareMessages(readFileSync('content/ladder_messages.txt', 'utf8'));
    expect(ladders.warnings).toEqual([]);
    expect(ladders.items.map((i) => i.square).sort((a, b) => a - b)).toEqual([3, 6, 8, 14, 18, 20, 23]);
    const tiles = parseSquareMessages(readFileSync('content/tile_texts.txt', 'utf8'));
    expect(tiles.warnings).toEqual([]);
    for (const sq of [1, 3, 6, 8, 10, 14, 18, 20, 23, 25, 26, 29, 30]) expect(tiles.items.some((t) => t.square === sq)).toBe(true);
  });
});

describe('loader', () => {
  it('prefers the desktop override, then the network file, then the bundled default', async () => {
    const desktop = vi.fn(async () => 'EN: from desktop');
    const fetcher = vi.fn(async () => 'EN: from web');
    expect(await loadText('snake_messages.txt', 'EN: bundled', { desktop, fetcher })).toEqual({ text: 'EN: from desktop', source: 'external' });
    expect(await loadText('snake_messages.txt', 'EN: bundled', { fetcher })).toEqual({ text: 'EN: from web', source: 'web' });
    expect(await loadText('snake_messages.txt', 'EN: bundled', { desktop: async () => null, fetcher })).toEqual({ text: 'EN: bundled', source: 'bundled' });
    expect(await loadText('snake_messages.txt', 'EN: bundled', { fetcher: async () => { throw new Error('offline'); } })).toEqual({ text: 'EN: bundled', source: 'bundled' });
  });
});

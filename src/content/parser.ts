/**
 * Parser for the NGO editable text files (snake_messages.txt, ladder_messages.txt, tile_texts.txt).
 *
 * Format: lines starting with # are comments, blocks are separated by a line of ---,
 * each line inside a block is KEY: value. A line without a known KEY continues the previous value.
 * The parser never throws: bad blocks are skipped and reported in `warnings`.
 */

export interface SnakeMessage {
  id: number;
  en: string;
  ur: string;
  tipEn: string;
  tipUr: string;
}

export interface SquareMessage {
  square: number;
  en: string;
  ur: string;
}

export interface ParseResult<T> {
  items: T[];
  warnings: string[];
}

const KEYS = ['EN', 'UR', 'TIP_EN', 'TIP_UR', 'SQUARE'] as const;
type Key = (typeof KEYS)[number];
type Block = { fields: Partial<Record<Key, string>>; line: number };

export const MAX_SNAKE_MESSAGES = 60;

function splitBlocks(text: unknown): { blocks: Block[]; warnings: string[] } {
  const warnings: string[] = [];
  if (typeof text !== 'string') return { blocks: [], warnings: ['File is empty or could not be read'] };
  const lines = text.replace(/^﻿/, '').split(/\r\n|\r|\n/);
  const blocks: Block[] = [];
  let cur: Block = { fields: {}, line: 1 };
  let lastKey: Key | null = null;
  const push = () => {
    if (Object.keys(cur.fields).length) blocks.push(cur);
  };
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (line.startsWith('#')) return;
    if (/^-{3,}$/.test(line)) {
      push();
      cur = { fields: {}, line: idx + 2 };
      lastKey = null;
      return;
    }
    if (line === '') return;
    const m = /^([A-Za-z_]+)\s*[:：]\s*(.*)$/.exec(line);
    const key = m ? (m[1].toUpperCase() as Key) : null;
    if (m && key && (KEYS as readonly string[]).includes(key)) {
      if (cur.fields[key] !== undefined) warnings.push(`Line ${idx + 1}: ${key} appears twice in one block; using the last one`);
      cur.fields[key] = m[2].trim();
      lastKey = key;
    } else if (lastKey) {
      cur.fields[lastKey] = `${cur.fields[lastKey] ?? ''} ${line}`.trim();
    } else {
      warnings.push(`Line ${idx + 1}: not understood, skipped ("${line.slice(0, 40)}")`);
    }
  });
  push();
  return { blocks, warnings };
}

export function parseSnakeMessages(text: unknown, max = MAX_SNAKE_MESSAGES): ParseResult<SnakeMessage> {
  const { blocks, warnings } = splitBlocks(text);
  const items: SnakeMessage[] = [];
  for (const b of blocks) {
    const en = b.fields.EN?.trim() ?? '';
    const ur = b.fields.UR?.trim() ?? '';
    if (!en) {
      warnings.push(`Message starting near line ${b.line} has no EN text, skipped`);
      continue;
    }
    items.push({ id: items.length, en, ur, tipEn: b.fields.TIP_EN?.trim() ?? '', tipUr: b.fields.TIP_UR?.trim() ?? '' });
  }
  if (items.length > max) {
    warnings.push(`Found ${items.length} messages; only the first ${max} are used`);
    items.length = max;
  }
  return { items, warnings };
}

export function parseSquareMessages(text: unknown): ParseResult<SquareMessage> {
  const { blocks, warnings } = splitBlocks(text);
  const items: SquareMessage[] = [];
  for (const b of blocks) {
    const square = Number.parseInt(b.fields.SQUARE ?? '', 10);
    const en = b.fields.EN?.trim() ?? '';
    if (!Number.isInteger(square) || square < 1) {
      warnings.push(`Block near line ${b.line} has no valid SQUARE number, skipped`);
      continue;
    }
    if (!en) {
      warnings.push(`Block for square ${square} has no EN text, skipped`);
      continue;
    }
    if (items.some((i) => i.square === square)) warnings.push(`Square ${square} appears twice; using the last one`);
    const keep = items.filter((i) => i.square !== square);
    keep.push({ square, en, ur: b.fields.UR?.trim() ?? '' });
    items.splice(0, items.length, ...keep);
  }
  return { items, warnings };
}

/** Use parsed items, or the bundled defaults when the file gave nothing usable. */
export function withFallback<T>(primary: ParseResult<T>, fallback: () => ParseResult<T>): ParseResult<T> {
  if (primary.items.length > 0) return primary;
  const fb = fallback();
  return { items: fb.items, warnings: [...primary.warnings, 'No usable messages found; using the built in messages', ...fb.warnings] };
}

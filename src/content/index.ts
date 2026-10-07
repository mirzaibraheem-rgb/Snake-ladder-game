import snakeRaw from '../../content/snake_messages.txt?raw';
import ladderRaw from '../../content/ladder_messages.txt?raw';
import tileRaw from '../../content/tile_texts.txt?raw';
import uiRaw from '../../content/ui_strings.json?raw';
import { parseSnakeMessages, parseSquareMessages, withFallback, type SnakeMessage, type SquareMessage } from './parser';
import { loadText, type ContentSource } from './loader';
import type { UiStrings } from './strings';

export interface GameContent {
  snakes: SnakeMessage[];
  ladders: Map<number, SquareMessage>;
  tiles: Map<number, SquareMessage>;
  ui: UiStrings;
  report: { file: string; source: ContentSource; count: number; warnings: string[] }[];
}

function parseUi(text: string): UiStrings | null {
  try {
    const j = JSON.parse(text.replace(/^﻿/, ''));
    if (j && typeof j === 'object' && j.en) return { en: j.en, ur: j.ur ?? {} };
  } catch (e) {
    console.warn('[content] ui_strings.json is not valid JSON', e);
  }
  return null;
}

export async function loadContent(): Promise<GameContent> {
  const [s, l, t, u] = await Promise.all([
    loadText('snake_messages.txt', snakeRaw),
    loadText('ladder_messages.txt', ladderRaw),
    loadText('tile_texts.txt', tileRaw),
    loadText('ui_strings.json', uiRaw),
  ]);
  const snakes = withFallback(parseSnakeMessages(s.text), () => parseSnakeMessages(snakeRaw));
  const ladders = withFallback(parseSquareMessages(l.text), () => parseSquareMessages(ladderRaw));
  const tiles = withFallback(parseSquareMessages(t.text), () => parseSquareMessages(tileRaw));
  const bundledUi = parseUi(uiRaw)!;
  const loadedUi = parseUi(u.text);
  // Missing keys in an edited file fall back to the bundled text, so a deleted line never breaks a button.
  const ui: UiStrings = loadedUi
    ? { en: { ...bundledUi.en, ...loadedUi.en }, ur: { ...bundledUi.ur, ...loadedUi.ur } }
    : bundledUi;
  const report = [
    { file: 'snake_messages.txt', source: s.source, count: snakes.items.length, warnings: snakes.warnings },
    { file: 'ladder_messages.txt', source: l.source, count: ladders.items.length, warnings: ladders.warnings },
    { file: 'tile_texts.txt', source: t.source, count: tiles.items.length, warnings: tiles.warnings },
    { file: 'ui_strings.json', source: u.source, count: Object.keys(ui.en).length, warnings: loadedUi ? [] : ['Could not read; using built in text'] },
  ];
  for (const r of report) for (const w of r.warnings) console.warn(`[content] ${r.file}: ${w}`);
  return {
    snakes: snakes.items,
    ladders: new Map(ladders.items.map((i) => [i.square, i])),
    tiles: new Map(tiles.items.map((i) => [i.square, i])),
    ui,
    report,
  };
}

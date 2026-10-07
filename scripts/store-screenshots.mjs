// Captures store screenshots at the exact pixel sizes Google Play and the App Store ask for,
// plus the Play Store feature graphic. Needs the web build served: npx vite preview --port 4173
// Run: node scripts/store-screenshots.mjs
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 'http://localhost:4173/';
const OUT = 'store/screenshots';
const ICONS = 'store/icons';
mkdirSync(OUT, { recursive: true });
mkdirSync(ICONS, { recursive: true });

const DEVICES = [
  // name, css width, css height, scale  => pixels
  ['android_phone', 360, 640, 3], // 1080 x 1920
  ['android_tablet_7in', 600, 960, 2], // 1200 x 1920
  ['android_tablet_10in', 800, 1280, 2], // 1600 x 2560
  ['ios_iphone_6.9in', 440, 956, 3], // 1320 x 2868
  ['ios_iphone_6.5in', 428, 926, 3], // 1284 x 2778
  ['ios_ipad_13in', 1032, 1376, 2], // 2064 x 2752
];

const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(localChromium) ? { executablePath: localChromium } : {});

async function fresh(page, { lang = 'both', board = 'A', dice = '' } = {}) {
  await page.goto(BASE);
  await page.evaluate(([lang, board]) => {
    localStorage.clear();
    localStorage.setItem('soft-sl-prefs-v1', JSON.stringify({ language: lang, board, sound: false, music: false }));
  }, [lang, board]);
  await page.goto(`${BASE}?fast=1${dice ? `&dice=${dice}` : ''}`);
  await page.waitForSelector('[data-testid="play"]');
  await page.waitForTimeout(300);
}

async function start(page, name, char) {
  await page.click('[data-testid="play"]');
  await page.click('[data-testid="mode-computer"]');
  await page.fill('[data-testid="name-0"]', name);
  if (char) await page.click(`[data-testid="char-0-${char}"]`);
  await page.click('[data-testid="start"]');
  await page.waitForSelector('.board');
  await page.waitForTimeout(400);
}

const roll = async (page) => {
  await page.waitForSelector('.die.ready', { timeout: 15000 });
  await page.click('.die');
};

for (const [name, w, h, scale] of DEVICES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, hasTouch: true });
  const page = await ctx.newPage();
  const shot = (n) => page.screenshot({ path: `${OUT}/${name}_${n}.png` });

  await fresh(page);
  await shot('1_title');

  await page.click('[data-testid="play"]');
  await page.fill('[data-testid="name-0"]', 'Ayesha');
  await page.waitForTimeout(200);
  await shot('2_choose_character');

  // Ladder: 2 -> square 3 -> 11, computer 4, then a 4 -> 15 (mid game)
  await fresh(page, { dice: '2,4,4,1' });
  await start(page, 'Ayesha');
  await roll(page);
  await page.waitForSelector('.toast-ladder.shown', { timeout: 10000 });
  await page.waitForTimeout(250);
  await shot('3_ladder');
  await roll(page);
  await page.waitForSelector('.die.ready', { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot('4_game');

  // Snake: 6 -> 7 (extra turn), 3 -> 10 green snake
  await fresh(page, { dice: '6,3', lang: 'both' });
  await start(page, 'Ali', 'ali');
  await roll(page);
  await roll(page);
  await page.waitForSelector('[data-testid="snake-card"]', { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot('5_snake_message');

  // Win: 2 (3->11), C 3, 3 (14->24), C 1, 6 -> 30
  await fresh(page, { dice: '2,3,3,1,6' });
  await start(page, 'Zara', 'zara');
  for (let i = 0; i < 3; i++) await roll(page);
  await page.waitForSelector('[data-testid="win"]', { timeout: 20000 });
  await page.waitForTimeout(900);
  await shot('6_champion');

  await ctx.close();
  console.log('screenshots for', name);
}

// Feature graphic (Google Play, 1024 x 500) and store icon
const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
await page.goto(BASE);
await page.waitForSelector('[data-testid="play"]');
await page.evaluate(() => {
  const kids = [...document.querySelectorAll('.title-kid')].map((k) => k.innerHTML);
  document.body.innerHTML = `<div style="width:1024px;height:500px;position:relative;overflow:hidden;background:radial-gradient(circle at 25% 20%,#9b4fe0,#5b1e96 55%,#3b0a6b);font-family:'Baloo 2',sans-serif">
    <img src="boards/board_a.jpg" style="position:absolute;right:-60px;top:-40px;width:560px;transform:rotate(8deg);border-radius:24px;box-shadow:0 20px 50px rgba(0,0,0,.45);opacity:.95">
    <img src="icons/icon-512.png" style="position:absolute;left:48px;top:44px;width:120px;border-radius:28px;box-shadow:0 8px 20px rgba(0,0,0,.3)">
    <div style="position:absolute;left:190px;top:52px;color:#fff;font-weight:800;font-size:64px;letter-spacing:4px;line-height:1">SOFT</div>
    <div style="position:absolute;left:190px;top:118px;color:#ffd23f;font-weight:700;font-size:24px">Safe Online Future for Teens</div>
    <div style="position:absolute;left:48px;top:190px;color:#fff;font-weight:800;font-size:56px;line-height:1.05;width:520px">Snakes and Ladders</div>
    <div style="position:absolute;left:50px;top:254px;color:#fff;font-family:'Noto Nastaliq Urdu';font-size:34px;line-height:2.2" dir="rtl">سانپ اور سیڑھی</div>
    <div style="position:absolute;left:48px;bottom:24px;display:flex;gap:6px;height:120px">${kids.map((k) => `<div style="height:120px;aspect-ratio:120/150">${k}</div>`).join('')}</div>
  </div>`;
  document.querySelectorAll('.char-svg').forEach((s) => { s.style.width = '100%'; s.style.height = '100%'; });
});
await page.waitForTimeout(600);
await page.screenshot({ path: `${ICONS}/feature_graphic_1024x500.png` });
await browser.close();
console.log('feature graphic done');

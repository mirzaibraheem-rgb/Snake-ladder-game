import { test, expect, type Page } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const FILE = pathToFileURL(resolve('snake-and-ladder.html')).href;

/** Opens the file with the network off and records every request that is not inline data or the file itself. */
async function openOffline(page: Page, query = '') {
  await page.context().setOffline(true);
  const outside: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith(FILE)) outside.push(u);
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(FILE + query);
  await expect(page.getByTestId('play')).toBeVisible();
  return { outside, errors };
}

/** Touch screens tap, desktops click. */
const press = (page: Page, sel: string) => (test.info().project.use.hasTouch ? page.locator(sel).tap() : page.locator(sel).click());

/** Plays until somebody wins, answering every snake card. Returns how many rolls and snake cards there were. */
async function playToTheEnd(page: Page) {
  let rolls = 0;
  let snakes = 0;
  const deadline = Date.now() + 8 * 60_000;
  while (Date.now() < deadline) {
    if (await page.getByTestId('win').isVisible()) return { rolls, snakes };
    if (await page.getByTestId('snake-card').isVisible()) {
      snakes++;
      await press(page, '[data-testid="understand"]');
      await expect(page.getByTestId('snake-card')).toHaveCount(0);
      continue;
    }
    if (await page.locator('.die.ready').isVisible()) {
      rolls++;
      await press(page, '.die');
    }
    await page.waitForTimeout(120);
  }
  throw new Error('Game did not finish in time');
}

test('loads from file:// with no network, no outside requests, fonts and board art inline', async ({ page }) => {
  const { outside, errors } = await openOffline(page);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([document.fonts.load('700 20px "Baloo 2"'), document.fonts.load('20px "Noto Nastaliq Urdu"', 'اردو')]);
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`);
  });
  expect(fonts).toEqual(expect.arrayContaining(['Baloo 2 700', 'Noto Nastaliq Urdu 400']));
  await press(page, '[data-testid="play"]');
  await press(page, '[data-testid="start"]');
  const img = page.locator('.board-img');
  await expect(img).toBeVisible();
  expect(await img.getAttribute('src')).toMatch(/^data:image\/webp;base64,/);
  expect(await img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(1280);
  await page.screenshot({ path: `screenshots/single_${test.info().project.name}_game.png` });
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});

test('a full game against the computer, start to finish', async ({ page }) => {
  const { outside, errors } = await openOffline(page, '?fast=1');
  await press(page, '[data-testid="play"]');
  await press(page, '[data-testid="mode-computer"]');
  await page.getByTestId('name-0').fill('Ayesha');
  await press(page, '[data-testid="start"]');
  const { rolls, snakes } = await playToTheEnd(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `screenshots/single_${test.info().project.name}_win.png` });
  await expect(page.getByTestId('win')).toContainText(/Ayesha|Computer/);
  console.log(`${test.info().project.name}: finished after ${rolls} human rolls, ${snakes} snake cards`);
  // Play again starts a fresh game.
  await press(page, '[data-testid="play-again"]');
  await expect(page.getByTestId('card-0')).toContainText('1');
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});

test('two players on one device, full game, then resume after closing', async ({ page }, info) => {
  test.skip(info.project.name !== 'tablet' && info.project.name !== 'phone-portrait');
  const { outside, errors } = await openOffline(page, '?fast=1');
  await press(page, '[data-testid="play"]');
  await press(page, '[data-testid="mode-two"]');
  await press(page, '[data-testid="start"]');
  // Roll a couple of times, close the page, reopen: the game resumes from where it was.
  for (let i = 0; i < 2; i++) {
    await expect(page.locator('.die.ready')).toBeVisible({ timeout: 20000 });
    await press(page, '.die');
    if (await page.getByTestId('snake-card').isVisible().catch(() => false)) await press(page, '[data-testid="understand"]');
  }
  await expect(page.locator('.die.ready')).toBeVisible({ timeout: 20000 });
  const before = await page.getByTestId('card-0').innerText();
  await page.reload();
  await expect(page.getByTestId('continue')).toBeVisible();
  await press(page, '[data-testid="continue"]');
  await expect.poll(() => page.getByTestId('card-0').innerText()).toBe(before);
  const { rolls } = await playToTheEnd(page);
  expect(rolls).toBeGreaterThan(2);
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});

test('full screen button enters and leaves full screen', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop' && info.project.name !== 'tablet');
  await openOffline(page);
  await press(page, '[data-testid="fullscreen"]');
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.screenshot({ path: `screenshots/single_${info.project.name}_title_fullscreen.png` });
  await press(page, '[data-testid="fullscreen"]');
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  // Also available during the game.
  await press(page, '[data-testid="play"]');
  await press(page, '[data-testid="start"]');
  await press(page, '.hud [data-testid="fullscreen"]');
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
});

test('a full game at normal speed (no test shortcuts)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const { outside, errors } = await openOffline(page);
  await press(page, '[data-testid="play"]');
  await press(page, '[data-testid="start"]');
  const { rolls, snakes } = await playToTheEnd(page);
  console.log(`normal speed: finished after ${rolls} human rolls, ${snakes} snake cards`);
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});

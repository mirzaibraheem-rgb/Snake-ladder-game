import { test, expect, type Page } from '@playwright/test';

const SHOTS = 'screenshots';

async function open(page: Page, opts: { lang?: 'en' | 'ur' | 'both'; board?: 'A' | 'B'; dice?: string; debug?: boolean } = {}) {
  const token = String(Math.random());
  // Reset storage once per open() call, but keep it across page reloads (to test resuming).
  await page.addInitScript(([lang, board, tok]) => {
    if (sessionStorage.getItem('test-init') === tok) return;
    sessionStorage.setItem('test-init', tok);
    localStorage.clear();
    localStorage.setItem('soft-sl-prefs-v1', JSON.stringify({ language: lang, board, sound: false, music: false }));
  }, [opts.lang ?? 'both', opts.board ?? 'A', token]);
  const q = new URLSearchParams({ fast: '1' });
  if (opts.dice) q.set('dice', opts.dice);
  if (opts.debug) q.set('debug', '1');
  await page.goto(`/?${q}`);
  await expect(page.getByTestId('play')).toBeVisible();
}

async function startVsComputer(page: Page, name = 'Ayesha') {
  await page.getByTestId('play').click();
  await page.getByTestId('mode-computer').click();
  await page.getByTestId('name-0').fill(name);
  await page.getByTestId('start').click();
  await expect(page.locator('.board')).toBeVisible();
  await page.waitForTimeout(300);
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/${test.info().project.name}_${name}.png` });

test('title and setup', async ({ page }) => {
  await open(page);
  await shot(page, '01_title');
  await page.getByTestId('play').click();
  await page.getByTestId('mode-two').click();
  await page.getByTestId('name-0').fill('Ayesha');
  await page.getByTestId('name-1').fill('علی');
  await page.getByTestId('char-1-fatima').click();
  await shot(page, '02_setup');
  // names are limited to 12 characters
  await page.getByTestId('name-0').fill('ABCDEFGHIJKLMNOP');
  await expect(page.getByTestId('name-0')).toHaveValue('ABCDEFGHIJKL');
});

test('mid game, ladder toast and snake card in all languages', async ({ page }) => {
  // P1 rolls 2 -> square 3 ladder to 11. Computer rolls 1 -> 2. P1 rolls 4 -> 15. Computer 5 -> 7.
  await open(page, { lang: 'both', dice: '2,1,4,5' });
  await startVsComputer(page);
  await shot(page, '03_game_start');
  await page.locator('.die').click();
  await expect(page.locator('.toast-ladder.shown')).toBeVisible({ timeout: 8000 });
  await shot(page, '04_ladder_toast');
  await expect(page.getByTestId('card-0')).toContainText('11', { timeout: 8000 });
  await expect(page.getByTestId('card-1')).toContainText('2', { timeout: 8000 });
  await expect(page.locator('.die.ready')).toBeVisible({ timeout: 8000 });
  await page.locator('.die').click();
  await expect(page.getByTestId('card-1')).toContainText('7', { timeout: 8000 });
  await page.waitForTimeout(400);
  await shot(page, '05_mid_game');

  for (const lang of ['en', 'ur', 'both'] as const) {
    // 6 -> 7 (extra turn), 3 -> 10 = green snake head -> 5
    await open(page, { lang, dice: '6,3' });
    await startVsComputer(page);
    await page.locator('.die').click();
    await expect(page.locator('.die.ready')).toBeVisible({ timeout: 8000 });
    await page.locator('.die').click();
    await expect(page.getByTestId('snake-card')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);
    await shot(page, `06_snake_card_${lang}`);
    await page.getByTestId('understand').click();
    await expect(page.getByTestId('snake-card')).toHaveCount(0);
    await expect(page.getByTestId('card-0')).toContainText('5');
  }
});

test('overshoot hint, win screen and resume', async ({ page }) => {
  // P1: 2 (3->11), C: 3 (->4), P1: 3 (14->24), C: 1 (->5), P1: 6 (overshoot? 24+6=30 exact win)
  await open(page, { lang: 'both', dice: '2,3,3,1,6' });
  await startVsComputer(page, 'Zara');
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.die.ready')).toBeVisible({ timeout: 10000 });
    await page.locator('.die').click();
  }
  await expect(page.getByTestId('win')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(800);
  await shot(page, '08_win');
  await expect(page.getByTestId('win')).toContainText('Zara');
});

test('resume a saved game after closing', async ({ page }) => {
  await open(page, { dice: '4,1' });
  await startVsComputer(page);
  await page.locator('.die').click();
  await expect(page.getByTestId('card-1')).toContainText('2', { timeout: 8000 });
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByTestId('continue')).toBeVisible();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('card-0')).toContainText('5');
});

test('overshoot shows exact roll hint', async ({ page }) => {
  // 2: 3->11, C 1, 3: 14->24, C 1, 5: 29? no: 24+5=29 snake (A: ->14). Use 4 -> 28, C 1, 6 overshoot.
  await open(page, { dice: '2,1,3,1,4,1,6' });
  await startVsComputer(page);
  for (let i = 0; i < 4; i++) {
    await expect(page.locator('.die.ready')).toBeVisible({ timeout: 10000 });
    await page.locator('.die').click();
  }
  await expect(page.locator('.toast-hint.shown')).toBeVisible({ timeout: 8000 });
  await shot(page, '07_exact_hint');
  await expect(page.getByTestId('card-0')).toContainText('28');
});

test('pause menu, settings and how to play', async ({ page }) => {
  await open(page, { lang: 'ur' });
  await startVsComputer(page);
  await page.getByTestId('pause').click();
  await expect(page.getByTestId('pause-menu')).toBeVisible();
  await shot(page, '09_pause_ur');
  await page.keyboard.press('Escape');
  await page.getByTestId('pause').click();
  await page.locator('.pause-menu button').nth(2).click();
  await page.waitForTimeout(300);
  await shot(page, '10_how_to_play_ur');
  await page.keyboard.press('Escape');
  await page.locator('.pause-menu button').nth(3).click();
  await page.waitForTimeout(300);
  await shot(page, '11_settings_ur');
});

test('calibration overlay', async ({ page }) => {
  await open(page, { debug: true, board: 'B' });
  await startVsComputer(page);
  await page.waitForTimeout(300);
  await shot(page, '12_debug_board_b');
  await page.keyboard.press('Control+Shift+D');
  await expect(page.locator('.board.debug')).toHaveCount(0);
});

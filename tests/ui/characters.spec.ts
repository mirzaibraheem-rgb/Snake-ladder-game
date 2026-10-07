import { test } from '@playwright/test';

// Renders every character in every animation state into one sheet (for review and for the docs).
test('character sheet', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/?fast=1');
  await page.waitForSelector('[data-testid="play"]');
  // Build the sheet from the character module through the setup screen's markup.
  await page.getByTestId('play').click();
  const faces = await page.$$eval('[data-testid^="char-0-"]', (els) => els.map((e) => e.getAttribute('data-testid')!.replace('char-0-', '')));
  await page.evaluate((ids) => {
    const states = ['idle', 'hop', 'climb', 'sad', 'celebrate'];
    const app = document.getElementById('app')!;
    const tokenHtml = (id: string) => document.querySelector(`[data-testid="char-0-${id}"] .char-face`)!.innerHTML.replace(/viewBox="22 8 76 76"/, 'viewBox="0 0 120 150"');
    const rows = ids.map((id) => `<div style="display:flex;gap:18px;align-items:end">${states
      .map((s) => `<div class="st-${s}" style="width:110px;height:138px;animation:none"><div style="width:100%;height:100%">${tokenHtml(id)}</div></div>`)
      .join('')}<b style="color:#fff;font-size:20px">${id}</b></div>`).join('');
    app.innerHTML = `<div style="padding:20px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;gap:18px;color:#fff;font-weight:800">${states.map((s) => `<span style="width:110px;text-align:center">${s}</span>`).join('')}</div>${rows}</div>`;
    document.querySelectorAll('.char-svg').forEach((s) => ((s as SVGElement).style.width = '100%'));
  }, faces);
  await page.setViewportSize({ width: 760, height: 1260 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'screenshots/character_states.png', fullPage: true });
});

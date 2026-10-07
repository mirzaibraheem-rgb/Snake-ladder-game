// Verifies the desktop app reads an edited content/snake_messages.txt placed next to the .exe (no rebuild).
// Usage: node tests/electron/content-override.mjs <path to app executable> [--portable-dir <dir>]
// Exits with code 0 on success, 1 on failure. Used locally and in GitHub Actions on a Windows runner.
import { _electron as electron } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';

const exe = process.argv[2];
const portableIdx = process.argv.indexOf('--portable-dir');
const portableDir = portableIdx > 0 ? process.argv[portableIdx + 1] : null;
if (!exe || !existsSync(exe)) {
  console.error('Usage: node tests/electron/content-override.mjs <exe>');
  process.exit(1);
}

const contentDir = join(portableDir ?? dirname(exe), 'content');
const file = join(contentDir, 'snake_messages.txt');
const backup = existsSync(file) ? readFileSync(file) : null;
mkdirSync(contentDir, { recursive: true });
const MARK = 'EDITED BY NGO TEST: this message came from the text file next to the exe.';
writeFileSync(file, `# test file\r\nEN: ${MARK}\r\nUR: یہ پیغام ٹیسٹ فائل سے آیا ہے۔\r\nTIP_EN: Editing the text file works.\r\n---\r\n`, 'utf8');

let ok = false;
const app = await electron.launch({
  executablePath: exe,
  args: process.platform === 'linux' ? ['--no-sandbox'] : [],
  env: { ...process.env, ...(portableDir ? { PORTABLE_EXECUTABLE_DIR: portableDir } : {}) },
});
try {
  const win = await app.firstWindow();
  await win.waitForSelector('[data-testid="play"]', { timeout: 30000 });
  const report = await win.evaluate(() => window.__soft.content.report);
  const snakes = await win.evaluate(() => window.__soft.content.snakes.map((s) => s.en));
  console.log('content report:', JSON.stringify(report));
  ok = report[0].source === 'external' && snakes.length === 1 && snakes[0] === MARK;
  // Play until a snake: start a game and force the card through the real UI.
  await win.screenshot({ path: 'screenshots/electron_title.png' }).catch(() => {});
} finally {
  await app.close();
  if (backup) writeFileSync(file, backup);
  else rmSync(file);
}
console.log(ok ? 'PASS: edited content file was used without rebuilding' : 'FAIL: edited content file was not used');
process.exit(ok ? 0 : 1);

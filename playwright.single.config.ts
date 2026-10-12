import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Tests snake-and-ladder.html opened straight from disk (file://) with the network switched off.
const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export default defineConfig({
  testDir: 'tests/single',
  timeout: 600_000,
  workers: 1,
  reporter: [['list']],
  use: { launchOptions: existsSync(localChromium) ? { executablePath: localChromium } : {} },
  projects: [
    { name: 'phone-portrait', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
    { name: 'phone-landscape', use: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});

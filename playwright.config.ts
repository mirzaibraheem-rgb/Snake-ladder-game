import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Use the locally installed Chromium if Playwright's own download is not present.
const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export default defineConfig({
  testDir: 'tests/ui',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    launchOptions: existsSync(localChromium) ? { executablePath: localChromium } : {},
  },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
  projects: [
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});

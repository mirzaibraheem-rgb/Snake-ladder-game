// Turns docs/Game_Rules_*.md into printable A4 PDFs with the bundled fonts (proper Urdu Nastaliq shaping).
// Run: npm run docs:pdf
import { chromium } from '@playwright/test';
import { marked } from 'marked';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const font = (p) => `file://${resolve('node_modules/@fontsource', p)}`;
const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(localChromium) ? { executablePath: localChromium } : {});
const page = await browser.newPage();

for (const [md, pdf, rtl] of [
  ['docs/Game_Rules_English.md', 'docs/Game_Rules_English.pdf', false],
  ['docs/Game_Rules_Urdu.md', 'docs/Game_Rules_Urdu.pdf', true],
]) {
  const body = marked.parse(readFileSync(md, 'utf8'));
  const html = `<!doctype html><html lang="${rtl ? 'ur' : 'en'}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><style>
    @font-face { font-family: 'Baloo 2'; src: url('${font('baloo-2/files/baloo-2-latin-500-normal.woff2')}'); font-weight: 400 500; }
    @font-face { font-family: 'Baloo 2'; src: url('${font('baloo-2/files/baloo-2-latin-800-normal.woff2')}'); font-weight: 700 800; }
    @font-face { font-family: 'Noto Nastaliq Urdu'; src: url('${font('noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-400-normal.woff2')}'); font-weight: 400; }
    @font-face { font-family: 'Noto Nastaliq Urdu'; src: url('${font('noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-700-normal.woff2')}'); font-weight: 700; }
    body { font-family: ${rtl ? "'Noto Nastaliq Urdu', 'Baloo 2'" : "'Baloo 2'"}, sans-serif; color: #24123a; font-size: ${rtl ? '12.5pt' : '12pt'}; line-height: ${rtl ? 2.2 : 1.5}; margin: 0; }
    h1 { color: #5b1e96; font-size: ${rtl ? '22pt' : '24pt'}; border-bottom: 4px solid #ff8a1f; padding-bottom: 6px; margin-top: 0; }
    h2 { color: #7b2fbe; font-size: ${rtl ? '15pt' : '16pt'}; margin-top: 18px; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: ${rtl ? '11pt' : '11pt'}; }
    th, td { border: 1px solid #d9c8f0; padding: 4px 8px; text-align: start; vertical-align: top; }
    th { background: #efe4fb; }
    blockquote { background: #fff4e5; border-inline-start: 4px solid #ff8a1f; margin: 8px 0; padding: 4px 12px; }
    strong { color: #3b0a6b; }
    .band { height: 10px; background: linear-gradient(90deg, #7b2fbe, #f72e8c, #ff8a1f, #8ac010); margin-bottom: 16px; border-radius: 5px; }
  </style></head><body><div class="band"></div>${body}</body></html>`;
  // Load from a real file so the browser may read the bundled font files.
  const tmp = resolve('docs/.render.tmp.html');
  writeFileSync(tmp, html);
  await page.goto(`file://${tmp}`, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (![...document.fonts].some((f) => f.status === 'loaded')) throw new Error('fonts did not load');
  });
  rmSync(tmp);
  await page.pdf({ path: pdf, format: 'A4', margin: { top: '16mm', bottom: '16mm', left: '16mm', right: '16mm' }, printBackground: true });
  console.log('wrote', pdf);
}
await browser.close();

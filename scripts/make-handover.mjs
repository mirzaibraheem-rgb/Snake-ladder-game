// Assembles SOFT_Snakes_and_Ladders_Handover/ and its .zip from the built outputs.
// Run after: npm run build:web, npm run build:win (or download the Windows artifact from GitHub Actions),
// npm run docs:pdf, node scripts/store-screenshots.mjs, and a git commit (source is exported with git archive).
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const OUT = 'SOFT_Snakes_and_Ladders_Handover';
rmSync(OUT, { recursive: true, force: true });
rmSync(`${OUT}.zip`, { force: true });
const dir = (p) => (mkdirSync(join(OUT, p), { recursive: true }), join(OUT, p));
const copy = (from, to) => {
  if (!existsSync(from)) {
    console.warn(`MISSING: ${from}`);
    return;
  }
  cpSync(from, join(OUT, to), { recursive: true });
};

copy('handover/README_START_HERE.md', 'README_START_HERE.md');

// 01 Windows
dir('01_Play_on_Windows');
copy('release/SOFT-Snakes-Ladders-Setup.exe', '01_Play_on_Windows/SOFT-Snakes-Ladders-Setup.exe');
copy('release/SOFT-Snakes-Ladders-Portable.exe', '01_Play_on_Windows/SOFT-Snakes-Ladders-Portable.exe');
copy('content', '01_Play_on_Windows/content');
writeFileSync(join(OUT, '01_Play_on_Windows/content/README.txt'),
  'These files are read by SOFT-Snakes-Ladders-Portable.exe when it starts.\r\nEdit them with Notepad, save as UTF-8, then close and reopen the game.\r\nKeep this "content" folder in the same folder as the .exe.\r\nSee 04_Messages\\HOW_TO_EDIT_MESSAGES.md for help.\r\n');

// 02 Rules
dir('02_Game_Rules');
for (const f of ['Game_Rules_English.pdf', 'Game_Rules_Urdu.pdf', 'Game_Rules_English.md', 'Game_Rules_Urdu.md']) copy(`docs/${f}`, `02_Game_Rules/${f}`);

// 03 Backdrops
dir('03_Backdrops');
copy('public/boards/board_a.jpg', '03_Backdrops/board_a.jpg');
copy('public/boards/board_b.jpg', '03_Backdrops/board_b.jpg');

// 04 Messages
dir('04_Messages');
for (const f of ['snake_messages.txt', 'ladder_messages.txt', 'tile_texts.txt', 'ui_strings.json']) copy(`content/${f}`, `04_Messages/${f}`);
copy('docs/HOW_TO_EDIT_MESSAGES.md', '04_Messages/HOW_TO_EDIT_MESSAGES.md');

// 05 Web
copy('dist', '05_Web_Version');

// 06 Store
dir('06_Store_Publishing');
for (const f of ['PUBLISHING_GUIDE.md', 'privacy_policy.md', 'store_listing_EN_UR.md', 'content_rating_guide.md']) copy(`store/${f}`, `06_Store_Publishing/${f}`);
copy('store/icons', '06_Store_Publishing/icons');
copy('build/icon.ico', '06_Store_Publishing/icons/windows/icon.ico');
copy('public/icons', '06_Store_Publishing/icons/web');
copy('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', '06_Store_Publishing/icons/ios/AppIcon-1024.png');
for (const d of readdirSync('android/app/src/main/res').filter((d) => d.startsWith('mipmap-') && !d.includes('anydpi'))) {
  copy(`android/app/src/main/res/${d}`, `06_Store_Publishing/icons/android/${d}`);
}
copy('store/screenshots', '06_Store_Publishing/screenshots');
copy('screenshots/desktop_06_snake_card_both.png', '06_Store_Publishing/screenshots/example_snake_card.png');
if (existsSync('screenshots')) copy('screenshots', '06_Store_Publishing/screenshots/test_review_all_sizes');

// 07 Source (tracked files only, so no secrets, node_modules or build output)
dir('07_Source_Code');
execSync(`git archive HEAD | tar -x -C ${join(OUT, '07_Source_Code')}`);

execSync(`cd ${OUT}/.. && zip -qr -9 ${OUT}.zip ${OUT}`);
console.log(`Done: ${OUT}/ and ${OUT}.zip`);

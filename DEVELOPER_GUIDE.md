# Developer Guide: SOFT Snakes and Ladders

One TypeScript codebase, four targets: **Web (PWA)**, **Windows (Electron)**, **Android** and **iOS** (Capacitor).

## Quick start

Requirements: **Node.js 20 or newer** (22 recommended).

```bash
npm install          # once
npm run dev          # play at http://localhost:5173 (add ?debug=1 for the calibration overlay)
npm test             # unit tests + 1,000 simulated games
npm run test:ui      # Playwright UI tests at phone, tablet and desktop sizes (screenshots/ folder)
```

## Build commands (one per platform)

| Command | Produces | Needs |
|---|---|---|
| `npm run build:web` | `dist/`: static site, works offline as a PWA and also opens from disk (`index.html`) | Node only |
| `npm run build:win` | `release/SOFT-Snakes-Ladders-Setup.exe` and `release/SOFT-Snakes-Ladders-Portable.exe` | Windows, or Linux/macOS with Wine |
| `npm run build:android` | `android/app/build/outputs/bundle/release/app-release.aab` | Android Studio (SDK + JDK 21); signing in `android/keystore.properties` |
| `npm run build:ios` | Updates the Xcode project in `ios/`; then archive in Xcode | macOS + Xcode |
| `npm run icons` | Regenerates every icon and splash from `assets/icon-*.svg` | Node only |
| `npm run docs:pdf` | `docs/*.pdf` rules from the Markdown files | Node + Playwright Chromium |
| `node scripts/store-screenshots.mjs` | `store/screenshots/` at every Play and App Store size, plus the feature graphic | Web build served with `npm run preview` |
| `npm run handover` | `SOFT_Snakes_and_Ladders_Handover/` folder and `.zip` | Run the builds first |

**No Windows or Mac?** Push to GitHub. `.github/workflows/build.yml` builds Web, Windows (on a real Windows runner, including a check that the .exe reads an edited `content` folder), Android (.aab and .apk) and an iOS compile check. Download results from the run's **Artifacts**.

## Architecture

```
content/                 Editable text: snake_messages.txt, ladder_messages.txt, tile_texts.txt, ui_strings.json
src/
  config/boards.json     Board maps in image pixels (snakes, ladders, traced paths)
  config/settings.json   Default rules and options
  config/index.ts        Loads boards, user preferences (localStorage)
  engine/                Pure, unit tested game logic. No DOM.
    rules.ts             planMove / takeTurn / newGame (exact finish, extra turn on 6, win)
    geometry.ts          square <-> pixel, serpentine numbering, path interpolation
    messageDeck.ts       random order without repeats
    validate.ts          checks a board map for mistakes
    rng.ts               fair die (crypto random), seeded RNG for tests
  content/               parser.ts (robust text parser), loader.ts (desktop override, web fetch, bundled fallback)
  characters/            Original SVG characters drawn in code + animation state classes
  scenes/                title, setup, game (turn flow), win
  ui/                    boardView (tokens, effects, calibration overlay), die, modals, toasts, confetti
  audio/sound.ts         All sounds synthesized with Web Audio (no audio files)
  storage/save.ts        Resume an unfinished game (localStorage)
  platform.ts            Android back button, service worker registration
electron/                Windows shell: main.cjs (content override), preload.cjs
android/, ios/           Capacitor native projects
tests/                   Vitest unit tests, simulation, Playwright UI tests, Electron content test
```

**How a turn works:** `scenes/game.ts` rolls the die, calls the pure `takeTurn()` to get the new state and a `MovePlan` (steps, landed square, snake or ladder, final square), saves, then asks `BoardView` to animate the plan: hop square by square, then climb along the ladder path or slide along the snake path. Snake landings draw the next message from `MessageDeck` and show the card.

**Why no game engine (Phaser):** the board is a single painted image with two tokens on top. DOM + SVG + CSS transforms run at 60 fps on low end phones, keep the bundle about 150 KB of JavaScript, and render Urdu Nastaliq text with proper shaping and right to left layout, which canvas game engines handle poorly.

**Content loading order:** desktop `content/` folder next to the .exe, then `content/` on the web server, then the copy bundled at build time. Bad or missing files never crash the game; problems are logged and shown in the calibration overlay.

## Change messages

Edit the files in `content/`. Format and rules: `docs/HOW_TO_EDIT_MESSAGES.md`. `npm test` checks the shipped file still has 60 complete messages; update that test if the NGO changes the count on purpose.

## Add a new board image and map its snakes and ladders

1. Save the art (square image, ideally 1280 x 1280) as `public/boards/board_c.jpg`.
2. In `src/config/boards.json` copy a board entry and change `id` (for example `"C"`), `name` and `image`.
3. Set `grid`: the pixel edges of the playable area (`left`, `top`, `right`, `bottom`), `cols` and `rows`. Numbering is serpentine starting bottom left.
4. For each snake set `from` (head square), `to` (tail square) and `path`: points from the head to the tail, following the painted body. For each ladder or train set `type`, `from` (bottom), `to` (top) and `path` from bottom to top.
5. Run the game with `?debug=1` (or press **Ctrl+Shift+D**) and choose the board in Settings. The overlay draws cell borders, numbers, and every path over the art. **Tap anywhere on the board to read its image pixel coordinates**, which makes tracing paths easy.
6. Add the board to the expectations in `tests/engine.test.ts` and run `npm test`. `validateBoard()` catches heads below tails, shared squares and paths that start or end in the wrong square.
7. Update `content/tile_texts.txt` and `content/ladder_messages.txt` if the squares changed. If the new board has a different number of ladders, the setting **Board** in the Settings panel lists it automatically.

## Add a new character

Open `src/characters/characters.ts` and add an entry to `CHARACTERS`:

```ts
{ id: 'sana', name: 'Sana', nameUr: 'ثنا', skin: '#D9A066', hair: 'bob', hairColor: '#24160E',
  top: '#F59E0B', topTrim: '#FEF3C7', topStyle: 'frock', bottom: '#1F2937', bottomStyle: 'pants',
  shoes: '#DC2626', accessories: ['headband'], accent: '#F59E0B' },
```

Options: `hair` short, curly, braid, ponytail, bob, hijab (set `hijabColor`); `topStyle` kameez, shirt, hoodie, frock; `bottomStyle` shalwar, pants; `accessories` glasses, cap, topi, dupatta, headband. All animation states (idle, hop, climb, sad, celebrate) work automatically. The setup grid shows 4 per row, so add characters in multiples of 4 for a tidy layout.

## Change rules

Defaults are in `src/config/settings.json`:

| Key | Meaning |
|---|---|
| `rules.exactRollToFinish` | Must land exactly on 30 |
| `rules.extraTurnOnSix` | A 6 gives another turn |
| `rules.maxExtraTurnsInARow` | Limit of extra turns in a row (default 3) |
| `board` | `"A"`, `"B"` or `"random"` |
| `language` | `"en"`, `"ur"` or `"both"` |
| `computerRollDelayMs`, `hopMs`, `ladderToastMs` | Timing |

Players can override language, sound, music, board and the two main rules in the in game Settings; their choices are remembered on that device. Rule logic lives in `src/engine/rules.ts` and is covered by `tests/engine.test.ts`.

## Change the app name or app ID

The app ID (`org.soft.snakesladders`) must be final before the first store release.

| Where | What to change |
|---|---|
| `capacitor.config.json` | `appId`, `appName` |
| `electron-builder.yml` | `appId`, `productName`, `nsis.shortcutName` |
| `android/app/build.gradle` | `namespace`, `applicationId` |
| `android/app/src/main/res/values/strings.xml` | `app_name` (home screen label), `title_activity_main`, `package_name`, `custom_url_scheme` |
| `android/app/src/main/java/...` | Move `MainActivity.java` to the folder matching the new ID and update its `package` line |
| iOS | In Xcode: target App > General > Display Name and Bundle Identifier |
| `public/manifest.webmanifest`, `index.html` `<title>` | Web name |

Then run `npx cap sync`.

## Versioning

Update `version` in `package.json` (shown on the About screen and Windows installer). For store uploads also raise Android `versionCode`/`versionName` in `android/app/build.gradle` and the iOS Version/Build in Xcode.

## Quality checks

- `npm run typecheck`, `npm test` (46 tests: engine, every snake and ladder on both boards, parser edge cases, loader, 3 x 1,000 simulated games)
- `npm run test:ui`: plays real games in Chromium at 390 x 844, 820 x 1180 and 1440 x 900 and saves screenshots
- `node tests/electron/content-override.mjs <path to exe>`: proves the desktop app uses an edited `content/` folder

## Test hooks (development only)

URL parameters: `?debug=1` calibration overlay, `?fast=1` faster animations, `?dice=6,3,2` force the next die values. They change nothing for players who do not use them.

## Privacy and store compliance (keep it this way)

No analytics, ads, accounts, network calls or third party SDKs. The Content Security Policy in `index.html` only allows files from the app itself. Do not add external links without a parental gate (Apple Kids Category rule).

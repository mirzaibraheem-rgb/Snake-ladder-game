# Credits and Licenses

Every asset in the game is listed here with its source and license.

## Artwork

| Asset | Source | License |
|---|---|---|
| Board art `board_a.jpg`, `board_b.jpg` | Supplied by SOFT: Safe Online Future for Teens. Contains partner logos (PTA, TikTok, Sitara Foundation) exactly as provided. | Supplied by SOFT for this game. SOFT should confirm it has its partners' permission to show their logos in the published app. The game does not add or alter any partner branding. |
| Kid characters (8) | Original vector artwork drawn in code for this project (`src/characters/characters.ts`) | Created for SOFT; free for SOFT to use and modify |
| App icon, splash screens, snake, ladder, train, trophy and shield icons | Original vector artwork made for this project (`assets/`, `src/`) | Created for SOFT |
| Die, confetti, sparkles, effects | Drawn in code (CSS, SVG, canvas) | Created for SOFT |

## Fonts (bundled, work offline)

| Font | Source | License |
|---|---|---|
| Noto Nastaliq Urdu | Google Noto project, packaged by Fontsource (`@fontsource/noto-nastaliq-urdu`) | SIL Open Font License 1.1 |
| Baloo 2 | Ek Type, packaged by Fontsource (`@fontsource/baloo-2`) | SIL Open Font License 1.1 |

## Sound and music

All sound effects and the background music are **synthesized live in code** with the Web Audio API (`src/audio/sound.ts`). There are no audio files and no third party recordings.

## Software

| Software | License |
|---|---|
| Capacitor (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/app`) | MIT |
| Electron | MIT (Chromium components under their own open source licenses, included in the Windows build as `LICENSES.chromium.html`) |
| Vite, TypeScript, Vitest, Playwright, electron-builder, sharp, png-to-ico, marked (build and test tools only) | MIT / Apache 2.0 |

## Content

The 60 snake messages, ladder messages, rules and store texts were written for SOFT for this project. Urdu translations are a first draft and must be reviewed by a native speaker before release.

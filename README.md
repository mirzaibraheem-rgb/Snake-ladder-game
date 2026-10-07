# SOFT Snakes and Ladders

A child friendly Snakes and Ladders game for **SOFT: Safe Online Future for Teens**, teaching children aged 8 to 16 safe online habits. Ladders and trains start on safe habits; snakes sit on risky ones and show one of 60 bilingual (English and Urdu) safety messages.

Runs on **Windows** (Electron), **Android** and **iOS** (Capacitor), and the **Web** (offline PWA) from one TypeScript codebase. No ads, no accounts, no data collection, fully offline.

- NGO staff: start with `handover/README_START_HERE.md`
- Developers: `DEVELOPER_GUIDE.md`
- Edit messages without code: `content/` and `docs/HOW_TO_EDIT_MESSAGES.md`
- Store publishing: `store/PUBLISHING_GUIDE.md`
- Asset sources and licenses: `CREDITS.md`

```bash
npm install
npm run dev            # play locally
npm test               # rules engine, parser, 1,000 game simulation
npm run build:web      # build:win, build:android, build:ios also available
```

# SOFT Snakes and Ladders: Start Here

Welcome! This folder has everything for the **SOFT Snakes and Ladders** game: a board game that teaches children aged 8 to 16 how to stay safe online. You do not need to know any programming to use it.

## What is in this folder

| Folder | What it is for |
|---|---|
| **01_Play_on_Windows** | The game for Windows computers. Start here to play. |
| **02_Game_Rules** | Printable rules in English and Urdu (PDF). |
| **03_Backdrops** | The two board pictures used in the game. |
| **04_Messages** | The snake and ladder messages, and a guide to change them. |
| **05_Web_Version** | The game as a website. Can be put on any web host. |
| **06_Store_Publishing** | Everything needed to put the game on Google Play and the App Store. |
| **07_Source_Code** | The full project, for a developer. |

---

## 1. Play on a Windows computer (Windows 10 or 11)

Nothing else needs to be installed. The game works without internet.

**Option A: no installation (easiest, good for USB drives)**

1. Open the folder **01_Play_on_Windows**.
2. Double click **SOFT-Snakes-Ladders-Portable.exe**.
3. If Windows shows "Windows protected your PC", click **More info**, then **Run anyway**. (This appears because the game is new and not yet "signed". It is safe.)

Keep the **content** folder next to the .exe. That is where the messages live.

**Option B: install it**

1. Double click **SOFT-Snakes-Ladders-Setup.exe** and follow the steps.
2. A **SOFT Snakes and Ladders** icon appears on the desktop and in the Start menu.

**Tips:** press **F11** for full screen. Press **Space** to roll the die.

## 2. Play in a web browser

Open the folder **05_Web_Version** and double click **index.html**. The game opens in your browser.

To share it online, give the whole **05_Web_Version** folder to whoever manages your website, and they can upload it to any web host. Once a player has opened it online, it also works offline on that device.

## 3. How to play

1. Click **Play**.
2. Choose **2 Players** or **Player vs Computer**.
3. Pick a character, type a name, and click **Start game**.
4. Tap the big die to roll. Ladders and trains carry you up (safe habits). Snakes slide you down (risky habits) and show a safety message.
5. The first player to reach square 30 is the **Digital Safety Champion**!

Full rules: **02_Game_Rules**.

You can switch the language (English, Urdu, or Both), sound, music, and rules in **Settings**.

## 4. Change the safety messages

The messages are plain text files you can open with **Notepad**.

1. Open **01_Play_on_Windows > content > snake_messages.txt** in Notepad.
2. Change the text after `EN:` (English), `UR:` (Urdu), `TIP_EN:` and `TIP_UR:` (Safe Tips).
3. Save with **File > Save As**, and choose **Encoding: UTF-8**.
4. Close the game and open it again. Your new messages are now in the game.

Step by step instructions with examples: **04_Messages > HOW_TO_EDIT_MESSAGES.md**.

> **Before giving the game to children:** please ask a native Urdu speaker (for example a teacher) to check all Urdu text. It was written as a first draft.

## 5. Put the game on phones (Google Play and App Store)

Everything is prepared in **06_Store_Publishing**. Read **PUBLISHING_GUIDE.md** there. You will need:

- A Google Play developer account (one time fee) and an Apple developer account (yearly fee).
- A Mac computer with Xcode for the Apple App Store upload.
- Someone comfortable with computers for about one day. A developer can do it faster.

## 6. Privacy

The game has **no ads, no accounts, no internet use, and collects no information** about children. The privacy policy is in **06_Store_Publishing > privacy_policy.md**.

## 7. Getting help

Give **07_Source_Code** to any web or app developer. Their guide is **DEVELOPER_GUIDE.md**. It explains how to change rules, add characters, add a new board picture, and rebuild every version with one command.

## Things that still need a person

- [ ] Native Urdu speaker reviews all Urdu text (messages, buttons, rules, store listing).
- [ ] SOFT confirms partner logos in the board art may be published in the apps.
- [ ] Fill in the NGO name, contact email, and date in the privacy policy, and publish it online.
- [ ] Create Google Play and Apple developer accounts.
- [ ] Create and safely store the Android upload key (see PUBLISHING_GUIDE.md).
- [ ] Use a Mac with Xcode for the App Store build.
- [ ] Optional: buy a code signing certificate so Windows does not show the "protected your PC" warning.

# How to Edit the Game Messages

You can change every message in the game **without any programming**. You only need a text editor, such as **Notepad** on Windows.

There are three message files:

| File | What it controls |
|---|---|
| `snake_messages.txt` | The card that appears when a player lands on a snake (up to 60 messages). |
| `ladder_messages.txt` | The short happy message when a player climbs a ladder or rides a train. |
| `tile_texts.txt` | The English meaning of the words painted on the board squares. Used on the win screen. |

Button labels and the "How to Play" text live in `ui_strings.json` (see the end of this guide).

> **Important:** The Urdu text was written as a first draft. Please ask a native Urdu speaker, ideally a teacher, to check every Urdu line before the game is given to children.

---

## 1. How a snake message looks

Each message is a small **block** of up to four lines, and blocks are separated by a line with three dashes `---`.

```
EN: A new online "friend" asks for your home address so they can send you a gift. Would a real friend need that?
UR: ایک نیا آن لائن "دوست" تحفہ بھیجنے کے لیے آپ کے گھر کا پتہ مانگتا ہے۔ کیا ایک سچے دوست کو اس کی ضرورت ہوگی؟
TIP_EN: Never share your address, school, or phone number online. Tell a trusted adult.
TIP_UR: اپنا پتہ، اسکول یا فون نمبر کبھی آن لائن شیئر نہ کریں۔ کسی بڑے کو بتائیں۔
---
```

| Label | Meaning | Required? |
|---|---|---|
| `EN:` | The message in English | **Yes** |
| `UR:` | The same message in Urdu | No, but recommended |
| `TIP_EN:` | A short Safe Tip in English | No, but recommended |
| `TIP_UR:` | The Safe Tip in Urdu | No, but recommended |

Lines starting with `#` are notes for people. The game ignores them.

This is how that block appears in the game:

![Snake card example](../06_Store_Publishing/screenshots/example_snake_card.png)

### Writing tips

- Start with a short situation or a question, then give the tip.
- Keep each message under 160 characters so it fits on small phones.
- Be warm and friendly. Never scary or shaming.
- Use places and apps children know: WhatsApp, TikTok, YouTube, online games, family groups.

---

## 2. Change, add, or remove a message

**To change a message:** edit the words after the colon. Keep the label (`EN:`, `UR:` and so on) at the start of the line.

**To add a message:** copy a whole block, from `EN:` down to and including `---`, paste it at the end of the file, and change the words.

**To remove a message:** delete the whole block, including its `---` line.

**Rules the game follows:**

- Up to **60** messages are used. If there are more, only the first 60 are shown.
- At least **1** message is needed. If the file is empty or missing, the game uses its built in messages, so it never breaks.
- A block without an `EN:` line is skipped.
- Messages appear in a random order and do not repeat until all have been shown.

---

## 3. Save the file correctly

1. In Notepad, choose **File > Save As**.
2. At the bottom, set **Encoding** to **UTF-8**. This keeps the Urdu letters correct.
3. Keep the same file name, for example `snake_messages.txt`.

---

## 4. Make the game use your changes

### Windows computer

The Windows game reads the `content` folder that sits **next to the game**.

- **Portable version:** the `content` folder must be in the same folder as `SOFT-Snakes-Ladders-Portable.exe`. That is already set up in `01_Play_on_Windows`.
- **Installed version:** open the folder where the game was installed (usually `C:\Users\<your name>\AppData\Local\Programs\SOFT Snakes and Ladders`) and edit the files in its `content` folder.

Then **close the game and open it again.** That is all. No rebuild is needed.

**Check it worked:** open the game, tap **About**. It says how many messages were loaded and where from ("external" means your edited file).

### Web version

Upload the edited file to the `content` folder on your web server, replacing the old one. Players see the new messages the next time they open the game while online.

### Android and iOS apps

Store apps cannot read loose files, so the messages are packed inside the app. To update them:

1. Edit `content/snake_messages.txt` inside the `07_Source_Code` folder.
2. Ask your developer to run one command: `npm run build:android` (or `npm run build:ios` on a Mac).
3. Upload the new version to Google Play or the App Store. Remember to increase the version number (see the Publishing Guide).

---

## 5. Ladder messages

`ladder_messages.txt` uses the same style, with a `SQUARE:` line that says which ladder or train the message belongs to. **Do not change the square numbers** unless the board art changes.

```
SQUARE: 6
EN: Smart move! Checking if information is true helps everyone. Up you go!
UR: سمجھداری! معلومات کی تصدیق کرنا سب کے لیے اچھا ہے۔ اوپر چلیں!
---
```

The ladder and train start squares are: 3, 6, 8, 14, 18, 20, 23.

---

## 6. Button labels and How to Play (`ui_strings.json`)

This file is a little stricter. Only change the text **between the quotes** after each colon.

```
"play": "Play",
```

- Keep the quotes and the comma at the end of the line.
- Keep `{name}` and `{n}` exactly as they are. The game puts a name or a number there.
- If the file gets damaged, the game uses its built in text instead, so it will still work.

---

## Common problems

| Problem | Fix |
|---|---|
| Urdu shows as boxes or strange symbols | Save the file again with **UTF-8** encoding. |
| My new message never appears | Check that it has an `EN:` line and a `---` line between it and the next message. Check there are not more than 60 messages above it. |
| Windows game still shows old messages | Make sure you edited the files in the `content` folder next to the game you are running, then close and reopen the game. |
| I broke the file | Copy the original from `04_Messages` in the handover folder. |

# Publishing Guide: Google Play and the App Store

This guide takes the NGO from the finished project to apps in both stores. Nothing has been submitted yet.

**You will need**

| For | You need | Cost (approx.) |
|---|---|---|
| Google Play | A Google Play Console account (organization account recommended) | USD 25 one time |
| App Store | An Apple Developer Program membership (organization; needs a D U N S number) | USD 99 per year |
| App Store build | A Mac with Xcode (latest version) | Borrow or rent one if needed |
| Both | A public web page for the privacy policy (any simple website or a free page host) | Free |

Everything else (icons, screenshots, texts, privacy policy, rating answers) is ready in this folder.

---

## Part A: Before you start (both stores)

1. **Review the Urdu text** in `04_Messages` and the store listing with a native Urdu speaker.
2. **Put the privacy policy online.** Fill in the blanks in `privacy_policy.md` (date, NGO name, contact email) and publish it as a web page. Copy its address; both stores require it.
3. **Decide the final app ID** (now `org.soft.snakesladders`). Once an app is published this **can never change**. If the NGO owns a web domain such as `softpakistan.org`, a good ID is `org.softpakistan.snakesladders`. See `DEVELOPER_GUIDE.md` > "Change the app name or ID".

---

## Part B: Google Play (Android)

### B1. Create the upload key (one time only)

Google Play needs every upload to be signed with **your** private key, called the upload keystore. **If you lose it, you cannot easily update the app**, so treat it like the keys to the office.

On a computer with Java installed (Android Studio includes it), open a terminal and run:

```
keytool -genkeypair -v -keystore soft-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias soft-upload
```

Answer the questions (name, organization, city, country code `PK`) and choose a strong password.

**Store it safely:**

- Keep `soft-upload-key.jks` and its password in **two** safe places (for example an encrypted USB drive in the office safe, and the NGO's password manager).
- **Never** email it, never put it in a shared drive folder, and **never** commit it to GitHub. The project is already set to ignore `.jks` files and `keystore.properties`.
- Turn on **Play App Signing** (the default for new apps). Google then keeps the real app signing key, and your upload key can be reset by Google support if it is ever lost.

### B2. Build the signed .aab

**Option 1: on your computer** (needs Android Studio installed)

1. In `07_Source_Code/android`, copy `keystore.properties.example` to `keystore.properties` and fill in the path to the `.jks` file and the passwords.
2. In `07_Source_Code`, run:
   ```
   npm install
   npm run build:android
   ```
3. The file to upload is `android/app/build/outputs/bundle/release/app-release.aab`.

**Option 2: GitHub Actions (no Android Studio needed)**

1. In the GitHub repository go to **Settings > Secrets and variables > Actions** and add:
   - `ANDROID_KEYSTORE_BASE64`: the `.jks` file converted to text. On Mac or Linux: `base64 -i soft-upload-key.jks`. On Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("soft-upload-key.jks"))`
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`soft-upload`), `ANDROID_KEY_PASSWORD`
2. Go to **Actions > Build all platforms > Run workflow**.
3. When it finishes, download the **android** artifact. It contains the signed `.aab`.

### B3. Create the app in Play Console

1. Play Console > **Create app**. Name: *SOFT Snakes and Ladders*. Default language: English (add Urdu later as a translation). App or game: **Game**. Free.
2. Complete **every** item in **Policy > App content** using `content_rating_guide.md`:
   privacy policy URL, ads (none), app access, content rating, **target audience** (children: the app joins Families), data safety (no data collected or shared).
3. **Store listing:** copy texts from `store_listing_EN_UR.md`. Upload:
   - App icon 512 x 512: `icons/play_store_icon_512.png`
   - Feature graphic 1024 x 500: `icons/feature_graphic_1024x500.png`
   - Phone screenshots: `screenshots/android_phone_*.png`
   - Tablet screenshots: `screenshots/android_tablet_7in_*.png` and `screenshots/android_tablet_10in_*.png`
4. Add an **Urdu** translation of the listing (Store listing > Manage translations) using the Urdu texts.

### B4. Test, then release

1. **Testing > Internal testing:** create a release, upload the `.aab`, add testers' emails, and install it on a few real phones, including an older low cost phone.
2. Check: game opens offline (turn on airplane mode), sound and music switches, back button opens the pause menu, Urdu text looks right.
3. New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before production. Organization accounts usually do not.
4. **Production > Create new release**, upload the same `.aab`, and send for review. Families apps are reviewed more carefully; allow up to 7 days or more.

### B5. Updating later

1. Make your changes (for example edit `content/snake_messages.txt`).
2. In `android/app/build.gradle` increase `versionCode` by 1 (for example 1 to 2) and update `versionName` (for example 1.0.1).
3. Run `npm run build:android` (or the GitHub workflow), then upload the new `.aab` as a new release.

---

## Part C: Apple App Store (iPhone and iPad)

**The final build and upload need a Mac with Xcode and an Apple Developer account.** The Xcode project is ready in `07_Source_Code/ios`.

### C1. Prepare on the Mac

1. Install **Xcode** from the Mac App Store, and **Node.js** (LTS) from nodejs.org.
2. Copy the `07_Source_Code` folder to the Mac. In Terminal, inside that folder:
   ```
   npm install
   npm run build:ios
   npx cap open ios
   ```
   Xcode opens the project.
3. In Xcode, click **App** (blue icon) > **Signing & Capabilities**: tick **Automatically manage signing** and choose the NGO's **Team**. Check the **Bundle Identifier** matches the final app ID.
4. Set **Version** (for example 1.0.0) and **Build** (1). Increase Build by 1 for every upload.

### C2. Create the app in App Store Connect

1. appstoreconnect.apple.com > **Apps > +** > New App. Platform iOS, name *SOFT Snakes and Ladders*, primary language English, bundle ID from step C1, SKU `soft-snakes-ladders`.
2. **App Information:** category **Education**; under **Kids**, choose **Made for Kids**, age band **9 to 11**. Add the privacy policy URL.
3. **Age Rating:** answer **None / No** to everything (see `content_rating_guide.md`). Result: 4+.
4. **App Privacy:** **Data Not Collected**.
5. **Pricing:** Free. **Availability:** all countries, or as the NGO prefers.
6. **Version page:** texts from `store_listing_EN_UR.md` (add Urdu as a localization if desired). Screenshots:
   - iPhone 6.9 inch: `screenshots/ios_iphone_6.9in_*.png`
   - iPhone 6.5 inch: `screenshots/ios_iphone_6.5in_*.png`
   - iPad 13 inch: `screenshots/ios_ipad_13in_*.png`

### C3. Upload the build

1. In Xcode choose the device **Any iOS Device (arm64)**.
2. **Product > Archive.** When it finishes, the Organizer opens.
3. Click **Distribute App > App Store Connect > Upload**.
4. After about 15 to 30 minutes the build appears in App Store Connect under **TestFlight**. Test it on real iPhones and iPads.
5. On the version page, choose the build and click **Add for Review**. Kids apps get extra checks; reply promptly to any questions from Apple.

### C4. Updating later

Increase **Version** and **Build** in Xcode, run `npm run build:ios`, archive, and upload again.

---

## Part D: Store checklist

- [ ] Urdu reviewed by a native speaker
- [ ] Privacy policy filled in and published online
- [ ] Final app ID chosen (cannot be changed after release)
- [ ] Upload keystore created and backed up in two safe places (Android)
- [ ] Play Console: all App content sections completed
- [ ] Play Console: internal test on real phones, including offline
- [ ] App Store Connect: Made for Kids, Data Not Collected, Age 4+
- [ ] TestFlight test on iPhone and iPad
- [ ] Screenshots and icons uploaded

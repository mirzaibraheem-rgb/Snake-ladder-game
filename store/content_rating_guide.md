# Content Rating Questionnaire Guide

Both stores ask questions about the app's content. These are the honest answers for SOFT Snakes and Ladders.

## Google Play (IARC questionnaire)

Play Console > your app > Policy > App content > Content rating > Start questionnaire.

1. **Email:** the NGO contact email.
2. **Category:** choose **Game** (it is a board game) or **"Reference, News, or Educational"**. Choosing Game is recommended because it is played as a game.
3. Answer the questions:

| Question topic | Answer | Why |
|---|---|---|
| Violence | No | Snakes are cartoon and friendly. A player slides down; no harm is shown. |
| Fear / scary content | No | Messages are written to be warm, never frightening. |
| Sexuality, nudity | No | |
| Language (profanity) | No | |
| Controlled substances (drugs, alcohol, tobacco) | No | |
| Gambling or simulated gambling | No | Dice decide moves; nothing is won or bought. One message *warns* about loot boxes; that is educational, not gambling. |
| Crude humor | No | |
| Users can interact or exchange content | No | Two players share one device. There is no online chat. |
| Shares user location | No | |
| Allows purchases of digital goods | No | |
| Contains ads | No | |
| Web browser or search | No | |

Expected rating: **Everyone / PEGI 3 / IARC 3+**.

## Google Play: other App content sections

| Section | Answer |
|---|---|
| Privacy policy | Paste the public URL of `privacy_policy.md`. |
| Ads | **No, my app does not contain ads.** |
| App access | **All functionality is available without special access.** |
| Target audience and content | Ages **9 to 12** and **13 to 15** (add **6 to 8** if you want younger players). Because children are included, the app joins the **Families** program. Confirm the app meets the Families Policy. |
| Data safety | **No data collected. No data shared.** Data encrypted in transit: not applicable. Users can request deletion: not applicable (nothing is collected). |
| Government app | No (unless the NGO publishes on behalf of a government body). |
| Financial features | None. |
| Health | None. |
| News app | No. |

## Apple App Store

App Store Connect > your app > App Information > Age Rating > Edit.

Answer **None** for every content type (cartoon or fantasy violence, realistic violence, profanity, horror or fear themes, mature themes, medical, alcohol, tobacco or drugs, sexual content, nudity, gambling, contests). Answer **No** for unrestricted web access and for gambling.

Expected rating: **4+**.

**Kids Category:** in App Information choose **Made for Kids** and age band **9 to 11** (or **6 to 8**). Apple then checks that:

- there is no third party analytics or advertising (true),
- there are no links out of the app or purchases without a parental gate (true: the game has no links and no purchases),
- the privacy policy is provided (paste the URL).

**App Privacy** (App Store Connect > App Privacy): choose **"No, we do not collect data from this app."**

**Export compliance:** the app uses no encryption beyond the operating system. `ITSAppUsesNonExemptEncryption` is already set to NO in the project, so Apple will not ask each time.

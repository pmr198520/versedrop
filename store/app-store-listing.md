# App Store & Play Store Listing — Draft Copy

Tweak before submitting. Each field has store-specific length limits noted.

---

## App name
- **VerseDrop** (max 30 chars / Apple; max 50 / Google)

## Subtitle / Short description
- **Apple subtitle (30 chars):** Scripture, anywhere you go
- **Google short description (80 chars):** Discover Bible verses dropped at real-world locations. Walk, find, collect.

## Promotional text (Apple, 170 chars — can update without re-review)
Drop a verse where you stand. Pick one up when you walk past. Build a library of Scripture tied to the places you've been.

---

## Full description

> **VerseDrop turns the world into a Scripture treasure map.**
>
> Drop Bible verses at any location — a park bench, a hospital waiting room, a hiking trail, the spot where something hard happened or something beautiful did. Walk near a glowing verse orb on your map and pick it up. Build a library of Scripture tied to real places.
>
> ### How it works
> - **Drop** — Tap +, search 80+ KJV verses, drop one at your GPS location
> - **Discover** — See glowing orbs of nearby drops on the map
> - **Pick up** — Walk within 50 meters and collect the verse for your library
> - **React & note** — Leave Amen, Heart, or Pray reactions and notes of encouragement
> - **Track your journey** — See your streaks, badges, and the dates you found each verse
>
> ### Features
> - 80+ built-in King James Version verses, searchable by keyword
> - Dark-themed map with custom styling
> - Anonymous account — no email or sign-up required to start
> - Daily Verse of the Day
> - Achievement badges as you drop and pick up
> - Optional custom messages
>
> ### A note on safety
> VerseDrop is a community space. Drops and notes are moderated automatically and reviewed when reported. You can block any user whose drops you don't want to see.
>
> Use common sense: don't walk into unsafe areas or onto private property to collect a verse. The map shows you where verses are — it's up to you to choose whether to go there.
>
> ### Privacy
> We use your location only while the app is open, to show drops near you and let you create drops at your location. We do not track your location history. See our privacy policy at https://[DOMAIN]/privacy
>
> Made with care for people who love Scripture and the people they share it with.

---

## Keywords (Apple, 100 chars total, comma-separated)
bible,scripture,verse,christian,kjv,faith,prayer,devotion,jesus,god,worship,walk,map

## Category
- **Apple Primary:** Lifestyle
- **Apple Secondary:** Reference
- **Google:** Lifestyle / Books & Reference

## Age rating
- **Apple:** 4+ (No objectionable content, but app contains user-generated content)
- **Google:** Everyone (with note about user-generated content)

> User-generated content triggers a higher rating in some jurisdictions. Apple's UGC questionnaire will likely push this to 12+ or 17+ depending on how you answer about moderation.

## Content rights
You'll be asked whether the app uses third-party content. Answer:
- **Bible verses (KJV):** Public domain — no licensing required
- **Map tiles:** Google Maps via licensed API key (Android) / Apple Maps (iOS) — both covered by their terms

## Support URL
- https://[DOMAIN]/support — needs to be live before submission

## Marketing URL (optional but recommended)
- https://[DOMAIN]

## Privacy policy URL (required)
- https://[DOMAIN]/privacy — needs to be live before submission

---

## App Store "App Privacy" answers

You'll fill out a questionnaire. Answer truthfully:

**Data linked to user:** None (we use anonymous tokens, not identifiable accounts — assuming you don't add Sign in with Apple. If you do, this changes.)

**Data not linked to user:**
- **Location** — Precise location (used for app functionality, not for tracking)
- **User content** — Verses, notes, reactions (used for app functionality)
- **Identifiers** — User ID (the anonymous token; used for app functionality)
- **Diagnostics** — Crash data, performance data (used for app functionality; only if you wire Sentry)

**Tracking across apps/websites:** No

---

## Play Store "Data safety" answers

Same shape as Apple's. Declare:
- **Location (approximate + precise):** Collected, used for app functionality, ephemeral (not stored beyond session except for drop coordinates)
- **App activity (other in-app actions):** Collected (drops, pickups, reactions); used for app functionality
- **App info and performance (crash logs, diagnostics):** Collected if you wire Sentry

---

## Required Apple/Google submission items

### Apple
- [ ] App icon 1024×1024 PNG (no alpha, no rounded corners — Apple rounds them)
- [ ] iPhone 6.7" screenshots (1290×2796 or 1320×2868), 3–10
- [ ] iPhone 6.5" screenshots (1242×2688), 3–10 — or marked as identical to 6.7"
- [ ] iPad screenshots if you support tablet (current app.config.ts has `supportsTablet: true`)
- [ ] App Preview video (optional, recommended)
- [ ] Demo account if reviewers need to sign in (NOT needed — anonymous launch)
- [ ] Review notes explaining: anonymous token, location use, moderation system, KJV public domain attribution

### Google
- [ ] App icon 512×512 PNG
- [ ] Feature graphic 1024×500 PNG/JPG
- [ ] Phone screenshots, 2–8
- [ ] Tablet screenshots if supported
- [ ] Short description 80 chars, full description 4000 chars
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target audience and content (declare it's for everyone, no children's content)
- [ ] Data safety form (see above)

---

## Screenshot capture script

Use the production preview build with seeded demo drops near a recognizable city center. Suggested screens:

1. **Map with drops** — VOTD card visible, "12 nearby · 2 in range" badge
2. **Drop detail bottom sheet** — verse, reactions, "Pick Up This Verse" button active
3. **Library** — 8–12 collected verses, streak chip showing
4. **Profile** — badges row with some unlocked, stats
5. **Drop composer** — search results, one selected
6. **Onboarding** — feature list

For each platform, use the EAS preview build on a simulator/emulator matched to the required screenshot dimensions.

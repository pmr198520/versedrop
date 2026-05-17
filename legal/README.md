# VerseDrop Legal Documents

This folder contains the working drafts of every legal document VerseDrop needs to ship.

> **Important.** These are *thorough working drafts*, not final legal documents. Every U.S. state, every EU member state, and every other country has its own rules. Have a qualified attorney review and customize these before publishing them as your actual policies. Engineering can write *most* of a privacy policy from how the system actually works — but the parts that depend on your business structure (entity, jurisdiction, retention defaults, dispute resolution) need a lawyer's eyes.

---

## Documents in this folder

| File | What it is | Required by |
|---|---|---|
| [privacy-policy.md](./privacy-policy.md) | What data we collect, how we use it, your rights | **Required** by Apple App Store, Google Play Store, GDPR, CCPA |
| [terms-of-service.md](./terms-of-service.md) | The contract between VerseDrop and the user, including arbitration, liability, subscription terms | **Required** by both stores in practice (App Store requires either a custom EULA + ToS combo, or you can rely on Apple's default EULA) |
| [eula.md](./eula.md) | Short license to install and use the App on a device | Optional — Apple's [Standard EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/) is the default if you don't provide one. Use ours if you want VerseDrop-specific terms in the EULA itself. |
| [community-guidelines.md](./community-guidelines.md) | Content rules and enforcement ladder for user-generated content | **Required** by App Store guideline 1.2 (apps with UGC) |

---

## What you need to fill in before publishing

There are **two placeholders** in every document. Once you've formed a legal entity and have a mailing address, do a global find-and-replace:

```
[LEGAL ENTITY NAME]   →   e.g., "VerseDrop, Inc." or "VerseDrop LLC" or your personal name if operating as a sole proprietor
[MAILING ADDRESS]     →   e.g., "1234 Example St, Wilmington, DE 19801, USA"
```

Default contact addresses in every document use `versedrop.app`. If your final domain differs, replace:

```
privacy@versedrop.app   →   privacy@<your-domain>
legal@versedrop.app     →   legal@<your-domain>
safety@versedrop.app    →   safety@<your-domain>
support@versedrop.app   →   support@<your-domain>
```

Set up these mailbox aliases (or forward them all to one inbox) before launch. The privacy and safety addresses are legally meaningful — regulators and reporters expect them to be monitored.

---

## Defaults baked into the drafts (change if needed)

| Topic | Default | Where to change |
|---|---|---|
| **Governing law** | State of Delaware, USA | [terms-of-service.md §14.6](./terms-of-service.md) |
| **Arbitration body** | American Arbitration Association (AAA), Consumer Rules | [terms-of-service.md §14.2](./terms-of-service.md) |
| **Server region** | United States | [privacy-policy.md §11](./privacy-policy.md) |
| **Minimum age** | 13 (16 in EEA/UK) | [terms-of-service.md §2](./terms-of-service.md), [privacy-policy.md §10](./privacy-policy.md) |
| **Liability cap** | Greater of $100 or 12 months of fees | [terms-of-service.md §13](./terms-of-service.md) |
| **Data-deletion turnaround** | 30 days | [privacy-policy.md §7](./privacy-policy.md) |
| **Report auto-hide threshold** | 3 unique reports | [community-guidelines.md](./community-guidelines.md) and [api/src/db/schema.sql](../api/src/db/schema.sql) |
| **Crash data retention** | 90 days | [privacy-policy.md §7](./privacy-policy.md) |
| **Request log retention** | 30 days | [privacy-policy.md §7](./privacy-policy.md) |
| **Auto-renewal cancellation window** | 24 hours before renewal | [terms-of-service.md §9](./terms-of-service.md) |
| **Subscription price change notice** | 30 days | [terms-of-service.md §9](./terms-of-service.md) |

If you change a default, make sure it stays consistent across all four documents.

---

## Publishing checklist

Before submitting to the stores or going live:

- [ ] Lawyer review complete
- [ ] `[LEGAL ENTITY NAME]` and `[MAILING ADDRESS]` filled in
- [ ] Contact email aliases active and monitored
- [ ] Documents published at stable, public URLs (suggested paths):
  - `https://versedrop.app/privacy` → privacy-policy.md
  - `https://versedrop.app/terms` → terms-of-service.md
  - `https://versedrop.app/eula` → eula.md *(optional)*
  - `https://versedrop.app/guidelines` → community-guidelines.md
- [ ] App Store Connect "Privacy Policy URL" field set to the privacy URL above
- [ ] App Store Connect "License Agreement" set to either Apple's default or your eula.md URL
- [ ] Google Play Console "Privacy policy" field set to the privacy URL
- [ ] Google Play Console "Data safety" form filled in to match the privacy policy (see [../store/app-store-listing.md](../store/app-store-listing.md))
- [ ] In-app link to privacy policy and terms (typically on the Profile screen)
- [ ] First-launch consent flow surfaces the existence of these documents (we can wire this into [OnboardingScreen.tsx](../mobile/src/screens/OnboardingScreen.tsx) before submission)

---

## Suggested in-app placement

When you're ready, add a "Legal" section to the Profile screen with three links:

```
Privacy Policy   →   https://versedrop.app/privacy
Terms of Service →   https://versedrop.app/terms
Community Guidelines →   https://versedrop.app/guidelines
```

Use `Linking.openURL(...)` from React Native to open them in the user's browser. Apple specifically looks for "easy access to your privacy policy" during review.

---

## How to publish the docs

These are markdown files. Some quick options for hosting:

- **GitHub Pages** — push the `legal/` folder to a public repo, enable Pages, point a subdomain at it
- **Notion / Cloudflare Pages / Vercel / Netlify** — paste each doc into a page, get a public URL
- **Your marketing website** — render the markdown server-side, link from the footer

Whichever you choose, make sure the URLs are **stable** (don't change after submission) and **publicly accessible** (no login required).

---

## What's NOT in this folder (and why)

- **DPA (Data Processing Agreement)** — you'll need this only if you process data for other businesses (B2B). VerseDrop is consumer-facing, so it doesn't apply unless your business model changes.
- **Subprocessor list** — useful once you have business customers; not required for consumer apps.
- **Cookie policy** — the mobile app doesn't set tracking cookies. If you build a marketing website that uses analytics, add one there.
- **Refund policy** — covered inside the Terms of Service (§9). For App Store / Play Store purchases, the platforms handle refunds; we don't issue separate ones.
- **Accessibility statement** — recommended once you have a marketing site; not required for the App itself. The App is being built with platform accessibility APIs (see the `accessibilityLabel` attributes added throughout).

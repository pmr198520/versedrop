# VerseDrop Privacy Policy

**Effective date:** January 1, 2026
**Last updated:** January 1, 2026

> **Legal review required.** This document is a thorough working draft prepared by the engineering team. Have a qualified attorney in your jurisdiction review and customize it for your business before publishing. The only items below that are guaranteed to require your input are marked `[LEGAL ENTITY NAME]` and `[MAILING ADDRESS]`. Default contacts use `versedrop.app` — swap with your final domain.

---

## Quick summary

- We collect what's needed for VerseDrop to work and nothing more
- Your location is used only while the app is open and is not stored as a history
- You're identified by a random anonymous token, not by your name or email
- Drops, notes, and reactions you post are visible to other users
- We don't sell your data or use it for advertising
- You can delete your account and data anytime by emailing privacy@versedrop.app

This summary is provided for convenience and does not replace the full policy below.

---

## 1. Who we are

VerseDrop (the "**App**") is operated by **[LEGAL ENTITY NAME]** ("**we**", "**our**", "**us**"), located at **[MAILING ADDRESS]**. We are the **data controller** for the personal information described in this Privacy Policy.

Contact us at **privacy@versedrop.app** for any questions about this policy or your data.

## 2. Scope

This Privacy Policy applies to:
- The VerseDrop mobile application for iOS and Android
- The VerseDrop web application
- Our backend API and supporting services

It does **not** apply to third-party websites or services we link to. Those are governed by their own privacy policies.

## 3. Information we collect

### 3.1 Information you provide

- **Bible verse drops** — the verse reference, verse text, optional custom message you add, and the GPS coordinates of where you drop it
- **Reactions** (Amen, Heart, Pray) you add to drops
- **Notes** you leave on drops
- **Reports** you submit about other users' content, including the reason and any details you include
- **Block lists** you create
- **Communications** when you contact us by email or support form

### 3.2 Information collected automatically

- **Precise GPS location**, collected only while the App is open and only after you grant permission. Used to (a) show drops near you, (b) record the location of drops you create, and (c) determine when you're within pickup range of a drop. We do **not** store a history of your location. We only persist the coordinates of drops you choose to create.
- **Anonymous device token**, a random UUID generated on your device at first launch and stored in your device's secure storage. This token is what associates your library, drops, reactions, notes, and stats with you. It is **not** linked to your phone number, email address, or any government identifier unless you choose to sign in.
- **Device and app information**, such as device model, operating system version, app version, and language, for diagnostic and compatibility purposes.
- **Crash and performance diagnostics**, including error stack traces, the action being performed when the error occurred, and basic device specs. Collected via our error-monitoring provider (Sentry) only when this feature is enabled.
- **Request logs**, including IP address, timestamp, endpoint, and response code, retained for security and rate-limiting purposes for up to 30 days.

### 3.3 Information we do **not** collect

- Your name, email address, or phone number (unless you sign in via an optional third-party identity provider)
- Your contacts, photos, calendar, microphone, camera, or other apps' data
- **Background location** — we only access location while the App is in the foreground
- Advertising identifiers (IDFA on iOS, AAID on Android)
- Health, financial, biometric, or precise demographic data
- Any information from cookies on the mobile app (mobile doesn't use cookies for tracking)

## 4. How we use information

We process your information for the following purposes:

| Purpose | What we use | Legal basis (EU/UK users) |
|---|---|---|
| Provide the core App features (drops, pickups, reactions, library, notes) | Drops, pickups, reactions, notes, location, anonymous token | Performance of a contract |
| Moderate user-generated content and enforce community guidelines | Drops, notes, reports, blocks | Legitimate interest in maintaining a safe service; performance of a contract |
| Investigate abuse and respond to user reports | Reports, drops, notes, anonymous token, request logs | Legitimate interest in safety |
| Detect and prevent fraud and abuse (rate limiting, automated filters) | Request logs, IP address, token | Legitimate interest in service integrity |
| Diagnose crashes and improve stability | Crash data, device info | Legitimate interest in product quality |
| Respond to your support requests | Email contents, anonymous token if provided | Legitimate interest in customer support |
| Comply with legal obligations | Any of the above as required | Legal obligation |

We do **not** use your information for advertising, profiling, or any kind of cross-app tracking.

## 5. How we share information

We do **not** sell your personal information.

We share information only with:

- **Service providers** under contract who help us run the App and who are bound by confidentiality and data-protection obligations:
  - **Hosting and database providers** (currently: our cloud infrastructure provider in the United States)
  - **Error monitoring** (Sentry, when enabled)
  - **Payment processing** (Stripe, only if you subscribe to VerseDrop Plus)
  - **App distribution** (Apple, Google) — subject to their own privacy practices
- **Law enforcement and government authorities** when required by valid legal process, court order, or to protect against imminent harm
- **Successors** if VerseDrop is acquired, merged, or reorganized. We will provide notice and your information will continue to be protected by this Policy or a successor with materially similar protections.
- **With your consent** for any other purpose disclosed to you at the time

## 6. Content visible to other users

Anything you post in the App that is intended to be shared is **visible to other users**:

- The **verse reference, verse text, custom message, and precise GPS location** of every drop you create
- Any **notes** you post on a drop
- Aggregate reaction counts (the fact that someone reacted with Amen/Heart/Pray, but not which specific user did)

**Do not include personally identifying information** (your name, phone, address) in any custom message or note unless you intend it to be publicly readable.

Your anonymous device token is technically associated with your drops on our servers, but it is not displayed to other users in the App. We use it to enable features like "block this user" without ever revealing identity.

## 7. Data retention

| Data type | Retention |
|---|---|
| Drops, notes, and reactions you post | Until you delete them or they are removed for policy violations |
| User pickups (your library) | Until you request account deletion |
| Reports you submit | 2 years from submission, for safety investigation and pattern detection |
| Block lists | Until you remove the block or request account deletion |
| Anonymous device token | Until you request account deletion |
| Crash diagnostics | 90 days |
| Request logs (IP, endpoint, timestamp) | 30 days |
| Email correspondence with support | 24 months from last contact |

When you request deletion, we will delete or irreversibly anonymize the listed data within **30 days**, except where we are required to retain specific records for legal, accounting, or safety-investigation purposes (in which case we will retain only the minimum required and isolate it from active systems).

## 8. Data security

We protect your information using industry-standard safeguards including:

- **HTTPS/TLS encryption** for all data in transit between the App and our servers
- **Encryption at rest** for our database
- **Anonymous tokens** stored in iOS Keychain / Android Keystore on your device, never in plain text
- **Access controls** limiting employee and contractor access to production systems to those who need it
- **Rate limiting and abuse detection** to protect against automated attacks
- **Regular security review** of our codebase and dependencies

No system is perfectly secure. If we become aware of a breach affecting your data, we will notify you and applicable authorities as required by law.

## 9. Your rights

### 9.1 All users

You can:
- **Revoke location access** at any time in your device Settings → VerseDrop → Location
- **Delete individual drops or notes** in the App
- **Block users** to hide their drops from your map
- **Report drops** that violate our guidelines
- **Request full data deletion** by emailing privacy@versedrop.app from any address (we'll work with you to verify the request and locate your anonymous token)

### 9.2 EU, UK, and EEA users (GDPR)

You have the right to:
- **Access** the personal information we hold about you
- **Rectify** inaccurate information
- **Erase** your information ("right to be forgotten"), subject to our legal-retention obligations
- **Restrict** or **object** to certain processing
- **Data portability** — receive a machine-readable copy of your data
- **Withdraw consent** where processing is based on consent
- **Lodge a complaint** with your local supervisory authority (the [list of EU DPAs](https://edpb.europa.eu/about-edpb/about-edpb/members_en) or the UK ICO)

To exercise any of these rights, email privacy@versedrop.app. We will respond within **30 days** as required by GDPR.

We do not engage in automated decision-making that produces legal or similarly significant effects about you.

### 9.3 California residents (CCPA / CPRA)

You have the right to:
- **Know** what categories of personal information we collect and how we use them (see Section 3 and 4)
- **Access** the specific pieces of information we have about you
- **Delete** your information, subject to retention exceptions
- **Correct** inaccurate information
- **Opt out of "sale" or "sharing"** of personal information — **we do not sell or share your information for cross-context behavioral advertising**, so there is nothing to opt out of, but we provide this notice as required
- **Limit use of sensitive personal information** — we do not use sensitive personal information for purposes other than providing the service
- **Non-discrimination** for exercising your rights

To exercise these rights, email privacy@versedrop.app. We will respond within **45 days**.

In the past 12 months we have not disclosed personal information for monetary or other valuable consideration. We do not have actual knowledge of selling or sharing the personal information of consumers under 16.

### 9.4 Nevada residents

Nevada residents may submit verified requests directing us not to sell certain personal information. As stated above, we do not sell personal information.

## 10. Children's privacy

VerseDrop is not directed at children under the age of **13** (or under **16** in the European Economic Area, the United Kingdom, and certain other jurisdictions). We do not knowingly collect personal information from children below these ages. If we learn that we have collected such information, we will delete it promptly.

If you are a parent or guardian and believe your child has provided us with information, please contact privacy@versedrop.app.

## 11. International data transfers

Our servers are located in the **United States**. If you are using VerseDrop from outside the United States, your information will be transferred to, stored, and processed in the United States, which may have data-protection laws different from those in your country.

For users in the European Economic Area, United Kingdom, or Switzerland, we rely on the **Standard Contractual Clauses** approved by the European Commission as the legal mechanism for these transfers, and we apply equivalent safeguards as described in this Policy.

## 12. Third-party links and services

The App may contain links to third-party websites or use third-party services (e.g., maps tiles, payment processors). We are not responsible for the privacy practices of those parties. Review their privacy policies separately.

## 13. Changes to this policy

We may update this Privacy Policy from time to time. When we do:
- We will revise the "Last updated" date at the top
- For **material changes**, we will provide prominent notice in the App at least **30 days** before the change takes effect
- You can review past versions on request

Continued use of the App after the effective date of an update means you accept the updated Policy.

## 14. How to contact us

| For | Contact |
|---|---|
| Privacy questions, data requests | **privacy@versedrop.app** |
| Safety reports, content concerns | **safety@versedrop.app** |
| Legal notices, court orders | **legal@versedrop.app** |
| General support | **support@versedrop.app** |
| Mail | [LEGAL ENTITY NAME], [MAILING ADDRESS] |

We acknowledge data-protection requests within 7 days and respond fully within the timelines required by applicable law.

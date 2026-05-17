# VerseDrop — Final Shipping Checklist

What's done, what's left, and what you specifically need to provide.

---

## What's done in code

### Backend
- Postgres + PostGIS schema with `drops`, `user_pickups`, `drop_reactions`, `drop_notes`, `drop_reports`, `user_blocks` ([api/src/db/schema.sql](api/src/db/schema.sql))
- Migration runner: `npm run migrate` ([api/src/db/migrate.ts](api/src/db/migrate.ts))
- Production server with helmet, CORS allowlist, rate limiting, Zod validation, /health check, graceful shutdown, structured request logging ([api/src/server.ts](api/src/server.ts))
- Dual-mode runtime: Postgres when `DATABASE_URL` is set, in-memory fallback for local dev (no DB required)
- Content moderation: profanity/URL/email filter applied to custom messages and notes ([api/src/moderation.ts](api/src/moderation.ts))
- Report endpoint (`POST /drops/:id/report`) with auto-hide trigger after 3 unique reports ([api/src/routes/reports.ts](api/src/routes/reports.ts))
- Block endpoints (`POST/DELETE/GET /blocks`) — blocked authors are filtered from nearby drops ([api/src/routes/blocks.ts](api/src/routes/blocks.ts), filter at [api/src/routes/drops.ts:54](api/src/routes/drops.ts))
- Observability stub (env-gated, no-op until you wire Sentry) ([api/src/observability.ts](api/src/observability.ts))
- Dockerfile + .dockerignore + docker-compose.yml at repo root for one-command Postgres+API spin-up
- **Transactional email via Postmark** ([api/src/email.ts](api/src/email.ts)) — verify-email + pickup notification templates; dry-runs to console when `POSTMARK_SERVER_TOKEN` unset (so dev never fails)
- **Push notifications via Expo Push** ([api/src/push.ts](api/src/push.ts)) — single + batch send helpers with token validation
- **Notification orchestrator** ([api/src/notify.ts](api/src/notify.ts)) — automatically fires push + email to drop owner on pickup, gated by per-user preferences
- **User + notification preferences schema** — `users` and `email_verifications` tables
- **Preference endpoints** ([api/src/routes/notifications.ts](api/src/routes/notifications.ts)) — `POST/DELETE /users/me/push-token`, `POST /users/me/email`, `POST /users/me/email/verify`, `GET/PATCH /users/me/notifications`

### Mobile
- All app config moved from `app.json` to `app.config.ts` reading from env vars ([mobile/app.config.ts](mobile/app.config.ts))
- `expo-constants` wiring for runtime API URL ([mobile/src/lib/api.ts](mobile/src/lib/api.ts))
- 15s `AbortController` timeout + clean error shape (`status: 0` = network/timeout) on every API call
- ErrorBoundary at app root ([mobile/src/components/ErrorBoundary.tsx](mobile/src/components/ErrorBoundary.tsx))
- Location permission state machine + LocationDeniedBanner with "Open Settings" deep link ([mobile/src/components/LocationDeniedBanner.tsx](mobile/src/components/LocationDeniedBanner.tsx))
- First-launch **OnboardingScreen** that owns the initial location prompt ([mobile/src/screens/OnboardingScreen.tsx](mobile/src/screens/OnboardingScreen.tsx))
- Real `@gorhom/bottom-sheet` rewrite of `DropDetailSheet` with pan-to-dismiss, snap points, notes section, report drop, block user ([mobile/src/components/DropDetailSheet.tsx](mobile/src/components/DropDetailSheet.tsx))
- Optimistic pickup with rollback on failure
- `useDrops` now: 30s interval, 50m movement-throttle, `AppState`-aware (pauses when backgrounded, force-refreshes on foreground) ([mobile/src/hooks/useDrops.ts](mobile/src/hooks/useDrops.ts))
- `accessibilityLabel` / `accessibilityRole` / `accessibilityState` across all interactive elements on Map, Composer, Library, Profile, Onboarding, DetailSheet
- Real user-visible error toasts replacing every silent `catch {}`
- iOS background-location strings in Info.plist (`NSLocationAlwaysUsageDescription` etc.)
- EAS config with development/preview/production profiles + submit profiles ([mobile/eas.json](mobile/eas.json))
- **Push registration** ([mobile/src/hooks/usePushRegistration.ts](mobile/src/hooks/usePushRegistration.ts)) — auto-registers Expo push token at launch if permission already granted; on-demand request from Profile
- **In-app notification handler** — foreground notifications show banner + play sound ([App.tsx setNotificationHandler](mobile/src/App.tsx))
- **Profile → Notifications section** ([mobile/src/components/NotificationsSection.tsx](mobile/src/components/NotificationsSection.tsx)) — push toggle, email + verification, per-event preference switches (pickup, reaction, nearby drop, weekly digest)
- `expo-notifications` plugin wired in [app.config.ts](mobile/app.config.ts)

### Docs
- [mobile/.env.example](mobile/.env.example), [api/.env.example](api/.env.example)
- [mobile/EAS_SETUP.md](mobile/EAS_SETUP.md)
- [legal/](legal/) — full near-final drafts:
  - [privacy-policy.md](legal/privacy-policy.md) (GDPR + CCPA sections, retention specifics, data-subject rights)
  - [terms-of-service.md](legal/terms-of-service.md) (arbitration + class waiver, DMCA, Apple/Google third-party beneficiary)
  - [community-guidelines.md](legal/community-guidelines.md) (enforcement ladder, urgent-safety escalation)
  - [eula.md](legal/eula.md) (custom EULA; optional — Apple's default works too)
  - [README.md](legal/README.md) (publishing checklist, what to fill in)
- [store/app-store-listing.md](store/app-store-listing.md)

---

## What you need to provide

### API keys / accounts (later, per your note)
- [ ] **Google Maps API key** (Cloud Console → APIs → Maps SDK for Android + iOS, enable billing). See the "Maps key" steps section.
- [ ] **Apple Developer Program** account ($99/yr)
- [ ] **Google Play Console** account ($25 one-time)
- [ ] **Expo account** + EAS Build subscription (free tier works for low volume)
- [ ] **Postmark account** + verified sender domain (DKIM, SPF records on DNS). Set `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL`, optionally `POSTMARK_REPLY_TO` and `POSTMARK_MESSAGE_STREAM`.
- [ ] **EXPO_ACCESS_TOKEN** for production push (optional but recommended) — Expo dashboard → Account Settings → Access Tokens
- [ ] **iOS APNs key + Android FCM v1 credentials** uploaded to Expo via `eas credentials` (one-time per app, prompted on first production build)
- [ ] **Stripe** account (for Plus subscription, when ready)
- [ ] **Sentry DSN** (free tier covers low volume — optional but recommended)

### Hosting
- [ ] **Postgres database** with PostGIS extension enabled. Suggested: [Supabase](https://supabase.com) (free tier + PostGIS by default), [Neon](https://neon.tech), [Fly Postgres](https://fly.io/docs/postgres/), or self-hosted via the included `docker-compose.yml`.
- [ ] **API host**. Suggested: [Fly.io](https://fly.io) (`fly launch` reads the included Dockerfile), [Railway](https://railway.app), [Render](https://render.com), or any container host. Set env vars from `api/.env.example`.
- [ ] **Custom domain** with HTTPS (e.g., `api.versedrop.com`). LetsEncrypt covers free certs on most hosts.
- [ ] **Privacy policy + Terms URLs** — host the markdown in `legal/` somewhere reachable (e.g., your marketing site, a GitHub Pages repo, or a Notion page made public).

### Legal/business
- [ ] Fill in the two placeholders in `legal/*.md`: `[LEGAL ENTITY NAME]` and `[MAILING ADDRESS]` (single global find-and-replace per file)
- [ ] If your final domain isn't `versedrop.app`, swap `*@versedrop.app` for your real domain
- [ ] **Have a lawyer review** the filled-in docs before publishing (defaults: Delaware governing law, AAA arbitration, $100 / 12-month liability cap — change in TOS §13, §14 if needed)
- [ ] Set up `privacy@`, `safety@`, `legal@`, `support@` email aliases (forward all to one inbox is fine to start)
- [ ] Host the policies at stable public URLs (see `legal/README.md` for hosting options)

### Store listing
- [ ] Final app icon at 1024×1024 (no transparency, no rounded corners)
- [ ] Screenshots from the production build at required resolutions (see [store/app-store-listing.md](store/app-store-listing.md))
- [ ] Optional: app preview video for Apple, feature graphic for Google
- [ ] App Store Connect record + Play Console listing created

---

## Day-of-shipping sequence

1. **Set EAS secrets** (see `mobile/EAS_SETUP.md`):
   ```
   eas secret:create --name PRODUCTION_API_URL --value https://api.yourdomain.com
   eas secret:create --name GOOGLE_MAPS_API_KEY --value YOUR_KEY
   ```
2. **Deploy the API** with your `DATABASE_URL`, `CORS_ORIGINS=https://yourdomain.com`, `NODE_ENV=production`, optional `SENTRY_DSN`. Then:
   ```
   cd api && npm run migrate
   ```
3. **Smoke test** the deployed API:
   ```
   curl https://api.yourdomain.com/health
   # expect: {"status":"ok","mode":"postgres"}
   ```
4. **EAS preview build** for internal QA on a real device:
   ```
   cd mobile && eas build --profile preview --platform all
   ```
5. **Walk the golden path** on the preview build: onboarding → permission → see drops → drop one → pick one up → react → note → report → block
6. **EAS production build + submit**:
   ```
   eas build --profile production --platform all
   eas submit --profile production --platform all
   ```
7. **Fill out store review notes** explaining: anonymous token model, why location is needed, KJV public domain, link to your moderation policy

---

## Known caveats (intentional — fix post-launch)

- **No real auth**. SecureStore token is the only identity. If a user wipes the app, their library and badges are gone. Acceptable for v1; add Sign in with Apple / Google later for cross-device sync.
- **No push notifications** for nearby drops. Hooked in app.config.ts via plugins but no client code or server scheduling. Defer to v1.1.
- **No web Dashboard parity in mobile**. Web has a Dashboard tab; mobile doesn't. Cut for scope.
- **Profanity filter is small.** Catches obvious cases. Swap for OpenAI Moderation API or Perspective API at scale — leave the swap point in `api/src/moderation.ts`.
- **Stripe Plus subscription** is in the README roadmap but no code yet. Deferred per your note.
- **No background location** despite Info.plist string. The string is there so you can flip the feature on later without re-review; the code today only uses foreground.
- **Sentry**: env-gated stub only. To enable: `npm i @sentry/node` and wire `Sentry.init` inside `api/src/observability.ts` `initObservability()`.

---

## Local dev (unchanged)

```
# Backend (in-memory, no DB required)
cd api && npm install && npm run dev

# Backend (with Postgres+PostGIS via Docker)
docker compose up -d db
cd api && npm install && cp .env.example .env
# edit .env: DATABASE_URL=postgresql://versedrop:versedrop_dev@localhost:5432/versedrop
npm run migrate
npm run dev

# Web (unchanged)
cd web && npm install && npm run dev

# Mobile
cd mobile && npm install && cp .env.example .env
# edit .env with your local API URL and Maps key
npx expo start
```

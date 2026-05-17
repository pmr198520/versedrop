# EAS Build & Submit Setup

This project uses **Expo Application Services (EAS)** for cloud builds and store submissions. EAS lets you build iOS apps without a Mac.

## One-time setup

```bash
# Install the CLI
npm install -g eas-cli

# Login
eas login

# Initialize the project (creates eas project ID on Expo's servers)
cd mobile
eas init
```

## Configure EAS secrets

Anything that looks like `$NAME` in `eas.json` reads from EAS secrets, not your local env. Set them once per project:

```bash
# Build-time env (baked into the JS bundle)
eas secret:create --scope project --name PRODUCTION_API_URL --value "https://api.versedrop.com"
eas secret:create --scope project --name PREVIEW_API_URL    --value "https://staging-api.versedrop.com"
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "..."

# App Store submission
eas secret:create --scope project --name APPLE_ID       --value "you@example.com"
eas secret:create --scope project --name ASC_APP_ID     --value "1234567890"
eas secret:create --scope project --name APPLE_TEAM_ID  --value "ABCDE12345"
```

`GOOGLE_MAPS_API_KEY` is read by `app.config.ts` and stamped into the native config at build time — it does NOT need to be `EXPO_PUBLIC_*` prefixed (it never ships in JS, only in iOS/Android native code).

## Build commands

```bash
# Local development build (use with Expo Dev Client)
eas build --profile development --platform ios
eas build --profile development --platform android

# Internal preview build (TestFlight + APK for stakeholder testing)
eas build --profile preview --platform all

# Production build (App Store + Play Store)
eas build --profile production --platform all
```

## Submit to stores

```bash
# After a successful production build
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

For Play Store, drop a service-account JSON at `mobile/play-store-credentials.json` (gitignored). Get one from Google Play Console → Setup → API access.

## Channels & OTA updates

`preview` and `production` builds are bound to their EAS Update channels. To push a JS-only update without a new store submission:

```bash
eas update --branch production --message "Hotfix: ..."
```

## Pre-build checklist

Before `eas build --profile production`:

- [ ] All EAS secrets above are set (`eas secret:list`)
- [ ] `app.config.ts` version bumped if needed
- [ ] iOS bundle ID + Android package match the App Store / Play Store records
- [ ] Privacy policy URL is reachable
- [ ] `assets/icon.png` is 1024×1024 PNG, no alpha
- [ ] Splash screen renders correctly in `eas build --profile preview` first

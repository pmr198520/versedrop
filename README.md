# VerseDrop

A location-based scripture discovery app inspired by Pokemon Go. Users drop Bible verses at GPS coordinates. Other users physically walk to those locations and pick them up.

## Features

- **Drop Verses** — Search 80+ built-in KJV Bible verses and drop them at your current GPS location
- **Discover & Collect** — Walk near glowing verse orbs on the map and pick them up when within 50 meters
- **Reactions** — React to verses with Amen, Heart, or Pray
- **Library** — View all collected verses with pickup dates and streak tracking
- **Profile** — Track your stats (drops, pickups, streaks) and unlock achievement badges
- **Verse of the Day** — A daily rotating verse displayed on the map
- **Notes** — Leave notes on verses you discover
- **Manual Location** — Desktop web app supports address search and preset locations for testing

## Platforms

| Platform | Directory | Status |
|----------|-----------|--------|
| **iOS** | `/mobile` | React Native (Expo) |
| **Android** | `/mobile` | React Native (Expo) |
| **Web** | `/web` | React + Vite |
| **API** | `/api` | Express + TypeScript |

## Tech Stack

**Mobile** — React Native + Expo SDK 55 + TypeScript + react-native-maps + Zustand + expo-location + expo-haptics

**Web** — React + TypeScript + Vite + Leaflet (dark CARTO tiles)

**Backend** — Express + TypeScript with in-memory data store (no database setup required)

## Quick Start

### API Server (required for both web and mobile)

```bash
cd api
npm install
npm run dev
```

The API runs on `http://localhost:3001`.

### Web App

```bash
cd web
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Mobile App (iOS / Android)

```bash
cd mobile
npm install

# Start Expo dev server
npx expo start

# Or run directly
npx expo run:ios     # Requires macOS + Xcode
npx expo run:android # Requires Android Studio
```

#### Mobile Setup Notes

1. **Environment variables** — Copy `mobile/.env.example` to `mobile/.env` and fill in:
   - `EXPO_PUBLIC_API_URL` — your backend URL
     - Android emulator: `http://10.0.2.2:3001`
     - iOS simulator: `http://localhost:3001`
     - Physical device: `http://YOUR_LAN_IP:3001`
   - `GOOGLE_MAPS_API_KEY` — required for Android map rendering. Get one from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). iOS will fall back to Apple Maps if blank.

   Values are read at config time by `mobile/app.config.ts` and exposed to the app via `expo-constants`.

2. **EAS Build** (for production):
   ```bash
   npx eas build --platform ios
   npx eas build --platform android
   ```
   Set `EXPO_PUBLIC_API_URL` and `GOOGLE_MAPS_API_KEY` as **EAS secrets** rather than committing them.

## Project Structure

```
versedrop/
  /api                      Express backend
    /src
      /db
        store.ts            In-memory data store
        verses.ts           Bible verse search engine (80+ KJV verses)
        schema.sql          PostgreSQL schema (for production)
      server.ts             API routes
  /mobile                   React Native Expo (iOS + Android)
    /src
      /screens
        MapScreen.tsx       Main map with drop orbs
        LibraryScreen.tsx   Collected verses
        ProfileScreen.tsx   User stats & achievements
        DropComposerScreen.tsx  Verse search & drop flow
      /components
        DropDetailSheet.tsx  Verse detail bottom sheet
        Toast.tsx           Toast notifications
      /hooks
        useLocation.ts      GPS location tracking
        useDrops.ts         Nearby drops polling
      /store
        appStore.ts         Zustand state management
        authStore.ts        Anonymous auth (SecureStore)
      /lib
        api.ts              API client
      /theme
        index.ts            Colors, spacing, typography
      /types
        index.ts            TypeScript interfaces
      App.tsx               Navigation + providers
    app.json                Expo config
  /web                      React web app
    /src
      /screens              Web versions of all screens
      /components           Web UI components
      /store                Zustand stores
      /lib                  API client
      styles.css            CSS design system
    vite.config.ts
```

## How It Works

1. **Anonymous Auth** — A UUID token is generated on first launch (stored in SecureStore on mobile, localStorage on web). No account required.
2. **Drop a Verse** — Tap the + button, search for a verse, and drop it at your GPS location.
3. **Discover** — Walk around. Gold orbs are undiscovered verses. Tap one to see details.
4. **Pick Up** — When within 50 meters, the "Pick Up" button activates. Collect the verse with haptic feedback and confetti.
5. **React & Note** — Leave reactions (Amen/Heart/Pray) and notes on discovered verses.

## Design System

- **Theme**: Dark mode with warm gold (#D4A245) accent
- **Maps**: Google Maps dark style (mobile), CARTO dark tiles (web)
- **Animations**: Floating orbs, pulsing user marker, confetti on pickup
- **Haptics**: Light impact on orb tap, success notification on pickup

## Environment Variables

```bash
# api/.env
DATABASE_URL=postgresql://localhost:5432/versedrop  # Optional, uses in-memory by default
PORT=3001

# mobile/app.json
# Add Google Maps API keys for iOS and Android
```

The app works out of the box with zero API keys — Bible verses use a built-in database, maps use free tile providers.

## Roadmap

- [ ] Stripe/Plus subscriptions for custom messages
- [ ] AI moderation pipeline for user-generated content
- [ ] Push notifications when nearby a drop
- [ ] Social features (follow users, share verses)
- [ ] PostgreSQL + PostGIS for production data persistence
- [ ] App Store / Play Store submission

## License

MIT

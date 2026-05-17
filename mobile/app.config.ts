import type { ExpoConfig } from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? '';
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? ''
    : 'http://10.0.2.2:3001');

const config: ExpoConfig = {
  name: 'VerseDrop',
  slug: 'versedrop',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#141418',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.versedrop.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'VerseDrop needs your location to find nearby verse drops and let you drop verses at your current location.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "VerseDrop uses your location in the background to notify you when you're near a verse drop.",
      NSLocationAlwaysUsageDescription:
        "VerseDrop uses your location in the background to notify you when you're near a verse drop.",
    },
    config: {
      googleMapsApiKey,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#141418',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    package: 'com.versedrop.app',
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  plugins: [
    'expo-secure-store',
    'expo-font',
    'expo-location',
    [
      'expo-notifications',
      {
        color: '#D4A245',
      },
    ],
  ],
  extra: {
    apiUrl,
    googleMapsApiKey,
  },
};

export default config;

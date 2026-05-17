// Registers the device's Expo push token with our backend when the user has
// already granted notification permission. Does NOT prompt — that's the
// Profile screen's job (asking in context, not on cold launch).

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import { registerPushToken } from '../lib/api';

export async function getPushTokenIfGranted(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators/emulators can't receive remote push

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId =
    (Constants.expoConfig as any)?.extra?.eas?.projectId ||
    (Constants as any)?.easConfig?.projectId;
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResponse.data;
  } catch {
    return null;
  }
}

export async function requestAndRegisterPush(): Promise<'granted' | 'denied' | 'unavailable'> {
  if (!Device.isDevice) return 'unavailable';

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    finalStatus = result.status;
  }
  if (finalStatus !== 'granted') return 'denied';

  const token = await getPushTokenIfGranted();
  if (!token) return 'unavailable';

  try {
    await registerPushToken(token, Platform.OS as 'ios' | 'android');
    return 'granted';
  } catch {
    return 'unavailable';
  }
}

export function usePushRegistration() {
  const isReady = useAuthStore((s) => s.isReady);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isReady || !hasOnboarded || registeredRef.current) return;
    registeredRef.current = true;
    (async () => {
      const token = await getPushTokenIfGranted();
      if (!token) return;
      try {
        await registerPushToken(token, Platform.OS as 'ios' | 'android');
      } catch {
        // best-effort; user can re-trigger from Profile
      }
    })();
  }, [isReady, hasOnboarded]);
}

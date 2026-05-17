import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'versedrop_user_token';
const ONBOARDED_KEY = 'versedrop_onboarded';

function generateToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AuthStore {
  userToken: string | null;
  isPlusSubscriber: boolean;
  isReady: boolean;
  hasOnboarded: boolean;
  initAuth: () => Promise<void>;
  markOnboarded: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userToken: null,
  isPlusSubscriber: false,
  isReady: false,
  hasOnboarded: false,

  initAuth: async () => {
    try {
      let token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        token = generateToken();
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
      const onboarded = await SecureStore.getItemAsync(ONBOARDED_KEY);
      set({ userToken: token, hasOnboarded: onboarded === 'true', isReady: true });
    } catch {
      // Fallback for environments without SecureStore
      const token = generateToken();
      set({ userToken: token, hasOnboarded: false, isReady: true });
    }
  },

  markOnboarded: async () => {
    set({ hasOnboarded: true });
    try {
      await SecureStore.setItemAsync(ONBOARDED_KEY, 'true');
    } catch {
      // Best-effort persistence
    }
  },
}));

import { create } from 'zustand';
import type { Drop } from '../types';

export type LocationPermission = 'pending' | 'granted' | 'denied' | 'unavailable';

interface AppStore {
  userLocation: { lat: number; lng: number } | null;
  locationPermission: LocationPermission;
  nearbyDrops: Drop[];
  selectedDrop: Drop | null;
  toastMessage: string | null;
  preferredTranslation: string;

  setUserLocation: (loc: { lat: number; lng: number }) => void;
  setLocationPermission: (p: LocationPermission) => void;
  setNearbyDrops: (drops: Drop[]) => void;
  setSelectedDrop: (drop: Drop | null) => void;
  updateDrop: (id: string, updates: Partial<Drop>) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  setPreferredTranslation: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  userLocation: null,
  locationPermission: 'pending',
  nearbyDrops: [],
  selectedDrop: null,
  toastMessage: null,
  preferredTranslation: 'KJV',

  setUserLocation: (loc) => set({ userLocation: loc }),
  setLocationPermission: (p) => set({ locationPermission: p }),
  setNearbyDrops: (drops) => set({ nearbyDrops: drops }),
  setSelectedDrop: (drop) => set({ selectedDrop: drop }),
  setPreferredTranslation: (id) => set({ preferredTranslation: id }),
  updateDrop: (id, updates) =>
    set((state) => ({
      nearbyDrops: state.nearbyDrops.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      selectedDrop: state.selectedDrop?.id === id ? { ...state.selectedDrop, ...updates } : state.selectedDrop,
    })),
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 2500);
  },
  clearToast: () => set({ toastMessage: null }),
}));

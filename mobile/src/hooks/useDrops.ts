import { useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAppStore } from '../store/appStore';
import { fetchNearbyDrops } from '../lib/api';

const REFRESH_INTERVAL_MS = 30_000;
const MIN_MOVE_METERS = 50;

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function useDrops() {
  const userLocation = useAppStore((s) => s.userLocation);
  const setNearbyDrops = useAppStore((s) => s.setNearbyDrops);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchedAtRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const refresh = useCallback(
    async (force = false) => {
      if (!userLocation) return;
      if (appStateRef.current !== 'active' && !force) return;

      const last = lastFetchedAtRef.current;
      const now = Date.now();
      if (!force && last) {
        const moved = haversine(last, userLocation);
        const elapsed = now - last.at;
        if (moved < MIN_MOVE_METERS && elapsed < REFRESH_INTERVAL_MS) return;
      }

      try {
        const drops = await fetchNearbyDrops(userLocation.lat, userLocation.lng, 500);
        setNearbyDrops(drops);
        lastFetchedAtRef.current = { ...userLocation, at: now };
      } catch (err) {
        if (__DEV__) console.warn('useDrops refresh failed', err);
      }
    },
    [userLocation, setNearbyDrops]
  );

  // Trigger fetch on location change (subject to throttle in refresh)
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Periodic refresh while foregrounded
  useEffect(() => {
    intervalRef.current = setInterval(() => refresh(), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  // Pause when backgrounded; force-refresh on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev !== 'active' && next === 'active') {
        refresh(true);
      }
    });
    return () => sub.remove();
  }, [refresh]);

  return { refresh: () => refresh(true) };
}

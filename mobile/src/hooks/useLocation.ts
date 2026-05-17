import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

export function useLocation() {
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setLocationPermission = useAppStore((s) => s.setLocationPermission);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const isReady = useAuthStore((s) => s.isReady);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    // Wait until onboarding is complete — OnboardingScreen owns the first permission prompt.
    if (!isReady || !hasOnboarded) return;

    let mounted = true;

    (async () => {
      try {
        const services = await Location.hasServicesEnabledAsync();
        if (!services) {
          if (mounted) setLocationPermission('unavailable');
          return;
        }

        // Check existing state — don't re-prompt; OnboardingScreen handled the initial ask.
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'undetermined') {
          const result = await Location.requestForegroundPermissionsAsync();
          status = result.status;
        }
        if (status !== 'granted') {
          if (mounted) setLocationPermission('denied');
          return;
        }
        if (mounted) setLocationPermission('granted');

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (mounted) {
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }

        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (l) => {
            if (mounted) {
              setUserLocation({ lat: l.coords.latitude, lng: l.coords.longitude });
            }
          }
        );
      } catch {
        if (mounted) setLocationPermission('unavailable');
      }
    })();

    return () => {
      mounted = false;
      watchRef.current?.remove();
    };
  }, [setUserLocation, setLocationPermission, hasOnboarded, isReady]);
}

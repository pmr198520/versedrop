import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useAppStore } from '../store/appStore';
import { colors, spacing, radii } from '../theme';

export default function LocationDeniedBanner() {
  const permission = useAppStore((s) => s.locationPermission);

  if (permission === 'pending' || permission === 'granted') return null;

  const isUnavailable = permission === 'unavailable';
  const title = isUnavailable ? 'Location services are off' : 'Location access is needed';
  const description = isUnavailable
    ? 'Turn on location services so VerseDrop can find drops near you.'
    : 'VerseDrop uses your location to find nearby verse drops. Enable it in Settings to continue.';

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch {
      await Linking.openSettings();
    }
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
    >
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open device settings"
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});

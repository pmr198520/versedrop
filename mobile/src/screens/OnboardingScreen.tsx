import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { colors, radii, spacing, type, shadows } from '../theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; desc: string }[] = [
  { icon: 'location',  color: colors.gold,  title: 'Drop verses anywhere',  desc: 'Pin Bible verses to GPS locations for others to find.' },
  { icon: 'compass',   color: '#60A5FA',    title: 'Discover nearby',       desc: 'Walk near glowing verse orbs on the map and collect them.' },
  { icon: 'book',      color: '#F472B6',    title: 'Build a library',       desc: 'Every verse you pick up is saved with the date you found it.' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const markOnboarded = useAuthStore((s) => s.markOnboarded);
  const setLocationPermission = useAppStore((s) => s.setLocationPermission);
  const [requesting, setRequesting] = useState(false);

  const handleContinue = async () => {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted' ? 'granted' : 'denied');
    } catch {
      setLocationPermission('unavailable');
    } finally {
      await markOnboarded();
      setRequesting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.x4l,
          paddingBottom: spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="map" size={28} color={colors.gold} />
          </View>
          <Text style={styles.brand} accessibilityRole="header">VerseDrop</Text>
          <Text style={styles.tagline}>Scripture, anywhere you go.</Text>
        </View>

        <View style={{ gap: spacing.md }}>
          {FEATURES.map((f) => (
            <View
              key={f.title}
              style={styles.featureCard}
              accessible
              accessibilityLabel={`${f.title}. ${f.desc}`}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: `${f.color}1F` }]}>
                <Ionicons name={f.icon} size={20} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.permissionBlock}>
          <View style={styles.permissionIconWrap}>
            <Ionicons name="navigate" size={16} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permissionTitle}>One thing we'll need</Text>
            <Text style={styles.permissionBody}>
              VerseDrop uses your location to show nearby drops and let you drop verses where you stand.
              We don't store your location history.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Pressable
          onPress={handleContinue}
          disabled={requesting}
          style={({ pressed }) => [
            styles.button,
            requesting && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Continue and request location permission"
        >
          {requesting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} style={{ marginLeft: 6 }} />
            </>
          )}
        </Pressable>
        <Text style={styles.fine}>You can change this later in Settings.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  hero: { alignItems: 'center', marginBottom: spacing.x4l },
  heroIconWrap: {
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: colors.goldDim,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.gold,
  },
  brand: {
    ...type.title1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  featureIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { ...type.headline, color: colors.text, marginBottom: 2 },
  featureDesc: { ...type.footnote, color: colors.textSecondary, lineHeight: 19 },

  permissionBlock: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
    backgroundColor: colors.goldDim,
    borderColor: colors.goldBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  permissionIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  permissionTitle: { ...type.subheadline, color: colors.gold, fontWeight: '700' as const, marginBottom: 2 },
  permissionBody: { ...type.footnote, color: colors.textSecondary, lineHeight: 19 },

  actions: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.gold,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonText: { ...type.headline, color: colors.white },
  fine: { ...type.caption1, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

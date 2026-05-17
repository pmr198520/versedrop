import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, type, shadows } from '../theme';
import { fetchUserProfile } from '../lib/api';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { LargeTitleHeader, SectionHeader } from '../ui';
import type { UserStats } from '../types';
import NotificationsSection from '../components/NotificationsSection';

interface Badge {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  unlocked: boolean;
  color: string;
}

function getBadges(stats: UserStats): Badge[] {
  return [
    { icon: 'leaf-outline',   label: 'First Steps',  desc: 'Pick up your first verse', unlocked: stats.total_pickups >= 1, color: '#34D399' },
    { icon: 'create-outline', label: 'First Drop',   desc: 'Drop your first verse',    unlocked: stats.total_drops   >= 1, color: '#60A5FA' },
    { icon: 'library-outline',label: 'Collector',    desc: 'Pick up 5 verses',         unlocked: stats.total_pickups >= 5, color: '#F472B6' },
    { icon: 'flame-outline',  label: 'On Fire',      desc: '3 day streak',             unlocked: stats.streak_days   >= 3, color: '#FB923C' },
    { icon: 'globe-outline',  label: 'Spreader',     desc: 'Drop 5 verses',            unlocked: stats.total_drops   >= 5, color: '#A78BFA' },
    { icon: 'star-outline',   label: 'Devoted',      desc: '7 day streak',             unlocked: stats.streak_days   >= 7, color: colors.gold },
  ];
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const userToken = useAuthStore((s) => s.userToken);
  const showToast = useAppStore((s) => s.showToast);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchUserProfile()
      .then((s) => { if (!cancelled) { setStats(s); setLoadFailed(false); } })
      .catch((err: any) => {
        if (cancelled) return;
        setLoadFailed(true);
        showToast(err?.status === 0 ? "Can't reach server" : 'Could not load profile');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [showToast]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.warning} />
        <Text style={styles.errorTitle}>
          {loadFailed ? "Couldn't load profile" : 'Profile unavailable'}
        </Text>
        <Text style={styles.errorDesc}>Pull to refresh or check your connection.</Text>
      </View>
    );
  }

  const badges = getBadges(stats);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      showsVerticalScrollIndicator={false}
    >
      <LargeTitleHeader title="Profile" />

      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>VD</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>Anonymous Explorer</Text>
          <Text style={styles.token} numberOfLines={1}>
            {userToken ? `${userToken.slice(0, 8)}…${userToken.slice(-4)}` : ''}
          </Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsRow}>
        <StatTile value={stats.total_drops}   label="Drops"     icon="location-outline" />
        <StatTile value={stats.total_pickups} label="Pickups"   icon="hand-left-outline" />
        <StatTile value={stats.streak_days}   label="Day streak" icon="flame-outline" highlight />
      </View>

      {/* Notifications */}
      <SectionHeader title="Preferences" />
      <View style={styles.section}>
        <NotificationsSection />
      </View>

      {/* Achievements */}
      <SectionHeader title={`Achievements  ·  ${unlockedCount}/${badges.length}`} />
      <View style={styles.badgeGrid}>
        {badges.map((badge) => (
          <View
            key={badge.label}
            style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}
            accessible
            accessibilityLabel={`${badge.label}, ${badge.desc}. ${badge.unlocked ? 'Unlocked.' : 'Locked.'}`}
          >
            <View style={[
              styles.badgeIconWrap,
              { backgroundColor: badge.unlocked ? `${badge.color}22` : colors.bgElevated },
            ]}>
              <Ionicons
                name={badge.icon}
                size={22}
                color={badge.unlocked ? badge.color : colors.textMuted}
              />
            </View>
            <Text style={[styles.badgeLabel, !badge.unlocked && styles.badgeLabelLocked]} numberOfLines={1}>
              {badge.label}
            </Text>
            <Text style={styles.badgeDesc} numberOfLines={2}>{badge.desc}</Text>
          </View>
        ))}
      </View>

      {/* Plus card */}
      <SectionHeader title="VerseDrop Plus" />
      <View style={[styles.plusCard, { marginHorizontal: spacing.lg }]}>
        <View style={styles.plusHeader}>
          <View style={styles.plusBadge}>
            <Ionicons name="sparkles" size={14} color={colors.gold} />
            <Text style={styles.plusBadgeText}>COMING SOON</Text>
          </View>
        </View>
        <Text style={styles.plusTitle}>Unlock custom messages</Text>
        <Text style={styles.plusDesc}>
          Add personal notes to your drops, get more verse translations, and support the app.
        </Text>
      </View>
    </ScrollView>
  );
}

function StatTile({ value, label, icon, highlight }: {
  value: number; label: string; icon: keyof typeof Ionicons.glyphMap; highlight?: boolean;
}) {
  return (
    <View style={[styles.statTile, highlight && styles.statTileHighlight]} accessible accessibilityLabel={`${value} ${label}`}>
      <Ionicons name={icon} size={16} color={highlight ? colors.gold : colors.textMuted} />
      <Text style={[styles.statValue, highlight && { color: colors.gold }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: { ...type.headline, color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
  errorDesc: { ...type.footnote, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },

  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.gold,
  },
  avatarText: { ...type.title3, color: colors.white, fontWeight: '800' as const, letterSpacing: 0.5 },
  name: { ...type.headline, color: colors.text, marginBottom: 2 },
  token: { ...type.caption1, color: colors.textMuted, fontFamily: type.mono.fontFamily },

  statsRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  statTileHighlight: {
    backgroundColor: colors.goldDim,
    borderColor: colors.goldBorder,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statValue: { ...type.title1, color: colors.text, fontWeight: '800' as const, marginTop: 4 },
  statLabel: { ...type.caption1, color: colors.textMuted, marginTop: 2 },

  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  badgeCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  badgeCardLocked: { opacity: 0.55 },
  badgeIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeLabel: { ...type.subheadline, color: colors.text, fontWeight: '700' as const, marginBottom: 2 },
  badgeLabelLocked: { color: colors.textSecondary },
  badgeDesc: { ...type.caption1, color: colors.textMuted },

  plusCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderColor: colors.goldBorder,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadows.sm,
  },
  plusHeader: { flexDirection: 'row', marginBottom: spacing.sm },
  plusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.goldDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  plusBadgeText: { ...type.caption2, color: colors.gold, letterSpacing: 0.6 },
  plusTitle: { ...type.title3, color: colors.text, marginBottom: spacing.xs },
  plusDesc: { ...type.footnote, color: colors.textSecondary, lineHeight: 19 },
});

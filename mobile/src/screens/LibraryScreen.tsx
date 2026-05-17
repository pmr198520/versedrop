import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, type, shadows } from '../theme';
import { fetchMyPickups } from '../lib/api';
import { useAppStore } from '../store/appStore';
import { LargeTitleHeader } from '../ui';
import type { Drop } from '../types';

interface PickupDrop extends Drop {
  picked_up_at?: string;
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const showToast = useAppStore((s) => s.showToast);
  const [drops, setDrops] = useState<PickupDrop[]>([]);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchMyPickups();
      setDrops(data.drops || []);
      setStreak(data.streak || 0);
      setTotal(data.total || 0);
      setLoadFailed(false);
    } catch (err: any) {
      setLoadFailed(true);
      showToast(err?.status === 0 ? "Can't reach server" : 'Could not load library');
    }
  }, [showToast]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = ({ item }: { item: PickupDrop }) => {
    const dateLabel = item.picked_up_at
      ? new Date(item.picked_up_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    return (
      <View
        style={styles.card}
        accessible
        accessibilityLabel={`${item.verse_reference} (${item.verse_translation || 'KJV'}). ${item.verse_text}${dateLabel ? `, collected ${dateLabel}` : ''}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardRef}>{item.verse_reference}</Text>
          <Text style={styles.cardTranslation}>{item.verse_translation || 'KJV'}</Text>
        </View>
        <Text style={styles.cardText} numberOfLines={5}>{item.verse_text}</Text>
        <View style={styles.cardFooter}>
          {dateLabel ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={styles.cardDate}>Collected {dateLabel}</Text>
            </View>
          ) : <View />}
          <View style={styles.pickupBadge}>
            <Ionicons name="people-outline" size={11} color={colors.gold} />
            <Text style={styles.pickupBadgeText}>{item.pickup_count}</Text>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <LargeTitleHeader
        title="Library"
        subtitle={total === 0 ? 'No verses yet' : `${total} ${total === 1 ? 'verse' : 'verses'} collected`}
      />
      {streak > 0 ? (
        <View style={styles.statsRow}>
          <View style={styles.streakChip} accessible accessibilityLabel={`${streak} day streak`}>
            <Ionicons name="flame" size={14} color={colors.gold} />
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  const EmptyComponent = () =>
    loadFailed ? (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}><Ionicons name="warning-outline" size={36} color={colors.warning} /></View>
        <Text style={styles.emptyTitle}>Couldn't load your library</Text>
        <Text style={styles.emptyDesc}>Pull to refresh or check your connection.</Text>
      </View>
    ) : (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}><Ionicons name="book-outline" size={36} color={colors.textMuted} /></View>
        <Text style={styles.emptyTitle}>No verses yet</Text>
        <Text style={styles.emptyDesc}>Head to the map and walk near glowing orbs to pick up your first verse.</Text>
      </View>
    );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={drops}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: spacing.lg,
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginBottom: spacing.lg,
  },
  streakChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.goldDim,
    borderColor: colors.goldBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  streakText: { ...type.footnote, color: colors.gold, fontWeight: '600' as const },

  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardRef: { ...type.subheadline, color: colors.gold, fontWeight: '700' as const },
  cardTranslation: {
    ...type.caption2,
    color: colors.textMuted,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    letterSpacing: 0.5,
  },
  cardText: { ...type.body, color: colors.text, fontStyle: 'italic', marginBottom: spacing.md, lineHeight: 23 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { ...type.caption1, color: colors.textMuted },
  pickupBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.goldDim,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pickupBadgeText: { ...type.caption2, color: colors.gold, fontWeight: '700' as const },

  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.x4l,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  emptyTitle: { ...type.title3, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  emptyDesc: { ...type.footnote, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});

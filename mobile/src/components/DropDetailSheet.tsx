import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import {
  BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, type, shadows } from '../theme';
import {
  pickupDrop, reactToDrop, fetchDropNotes, addNoteToDrop,
  reportDrop, blockUser, type ReportReason,
} from '../lib/api';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import type { Drop, Note } from '../types';

const PICKUP_RANGE = 50;

interface Props {
  drop: Drop;
  onClose: () => void;
  onPickedUp: () => void;
}

const REACTIONS: { key: 'amen' | 'heart' | 'pray'; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'amen',  label: 'Amen',  icon: 'hand-left',  color: '#FBBF24' },
  { key: 'heart', label: 'Heart', icon: 'heart',      color: '#F87171' },
  { key: 'pray',  label: 'Pray',  icon: 'flower',     color: '#A78BFA' },
];

export default function DropDetailSheet({ drop, onClose, onPickedUp }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const updateDrop = useAppStore((s) => s.updateDrop);
  const showToast = useAppStore((s) => s.showToast);
  const userToken = useAuthStore((s) => s.userToken);

  const [isPickingUp, setIsPickingUp] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const isInRange = (drop.distance_meters ?? Infinity) <= PICKUP_RANGE;
  const isPickedUp = !!drop.is_picked_up;
  const isOwnDrop = !!userToken && drop.user_token === userToken;
  const snapPoints = useMemo(() => ['58%', '92%'], []);

  useEffect(() => { sheetRef.current?.present(); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchDropNotes(drop.id);
        if (!cancelled) { setNotes(result); setNotesLoaded(true); }
      } catch {
        if (!cancelled) setNotesLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [drop.id]);

  const distanceText = useMemo(() => {
    if (drop.distance_meters == null) return '';
    return drop.distance_meters < 1000
      ? `${Math.round(drop.distance_meters)} m`
      : `${(drop.distance_meters / 1000).toFixed(1)} km`;
  }, [drop.distance_meters]);

  const handleDismiss = useCallback(() => onClose(), [onClose]);

  const handlePickup = async () => {
    if (isPickingUp || isPickedUp) return;
    setIsPickingUp(true);
    const previousCount = drop.pickup_count;
    updateDrop(drop.id, { is_picked_up: true, pickup_count: previousCount + 1 });
    try {
      await pickupDrop(drop.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Collected ${drop.verse_reference}`);
      onPickedUp();
    } catch (err: any) {
      if (err?.status === 409) {
        showToast('Already in your library');
      } else {
        updateDrop(drop.id, { is_picked_up: false, pickup_count: previousCount });
        showToast(err?.status === 0 ? "Can't reach server" : 'Failed to pick up verse');
      }
    } finally {
      setIsPickingUp(false);
    }
  };

  const handleReact = async (type: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const data = await reactToDrop(drop.id, type);
      updateDrop(drop.id, { reactions: data.reactions });
    } catch (err: any) {
      showToast(err?.status === 0 ? "Can't reach server" : 'Could not save reaction');
    }
  };

  const handleSubmitNote = async () => {
    const text = noteText.trim();
    if (!text || submittingNote) return;
    setSubmittingNote(true);
    try {
      const created = await addNoteToDrop(drop.id, text);
      setNotes((prev) => [created as Note, ...prev]);
      setNoteText('');
      showToast('Note added');
    } catch (err: any) {
      if (err?.status === 422) {
        showToast('Note flagged by content filter');
      } else {
        showToast(err?.status === 0 ? "Can't reach server" : 'Could not add note');
      }
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleReportPress = () => {
    if (isOwnDrop) return;
    const reasons: { label: string; value: ReportReason }[] = [
      { label: 'Spam',              value: 'spam' },
      { label: 'Offensive content', value: 'offensive' },
      { label: 'Harassment',        value: 'harassment' },
      { label: 'Inappropriate',     value: 'inappropriate' },
      { label: 'Other',             value: 'other' },
    ];
    Alert.alert(
      'Report this drop',
      'What seems wrong?',
      [
        ...reasons.map((r) => ({ text: r.label, onPress: () => submitReport(r.value) })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
      { cancelable: true }
    );
  };

  const submitReport = async (reason: ReportReason) => {
    try {
      await reportDrop(drop.id, reason);
      showToast('Reported. Thanks for helping keep VerseDrop safe.');
    } catch (err: any) {
      if (err?.status === 409) showToast('Already reported');
      else showToast(err?.status === 0 ? "Can't reach server" : 'Could not submit report');
    }
  };

  const handleBlockPress = () => {
    if (isOwnDrop) return;
    Alert.alert(
      'Block this user?',
      "You won't see their drops on the map anymore.",
      [
        { text: 'Cancel', style: 'cancel' as const },
        {
          text: 'Block', style: 'destructive' as const,
          onPress: async () => {
            try {
              await blockUser(drop.user_token);
              showToast('User blocked');
              onClose();
            } catch (err: any) {
              showToast(err?.status === 0 ? "Can't reach server" : 'Could not block user');
            }
          },
        },
      ]
    );
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} pressBehavior="close" />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={0}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      accessibilityLabel={`Verse drop: ${drop.verse_reference}`}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Verse hero */}
          <View
            style={styles.verseCard}
            accessible
            accessibilityLabel={`${drop.verse_reference} (${drop.verse_translation || 'KJV'}). ${drop.verse_text}`}
          >
            <View style={styles.verseHeader}>
              <Text style={styles.verseRef}>{drop.verse_reference}</Text>
              <Text style={styles.translationTag}>{drop.verse_translation || 'KJV'}</Text>
            </View>
            <Text style={styles.verseText}>&ldquo;{drop.verse_text}&rdquo;</Text>
            {drop.custom_message ? (
              <View style={styles.customMessageWrap}>
                <View style={styles.customAccent} />
                <Text style={styles.customMessage}>{drop.custom_message}</Text>
              </View>
            ) : null}
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={[styles.pill, isPickedUp && styles.pillSuccess]}>
              <Ionicons
                name={isPickedUp ? 'checkmark-circle' : 'navigate'}
                size={12}
                color={isPickedUp ? colors.success : colors.textSecondary}
              />
              <Text style={[styles.pillText, isPickedUp && { color: colors.success }]}>
                {isPickedUp ? 'Collected' : distanceText || '—'}
              </Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.pillText}>{drop.pickup_count} {drop.pickup_count === 1 ? 'pickup' : 'pickups'}</Text>
            </View>
          </View>

          {/* Reactions */}
          <View style={styles.reactionRow}>
            {REACTIONS.map((r) => {
              const count = drop.reactions[r.key] as number;
              const isActive = drop.reactions.user_reaction === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => handleReact(r.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`React with ${r.label}, current count ${count}`}
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.reactionBtn,
                    isActive && styles.reactionBtnActive,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <Ionicons name={r.icon} size={18} color={isActive ? r.color : colors.textSecondary} />
                  <Text style={[styles.reactionLabel, isActive && { color: r.color }]}>{r.label}</Text>
                  <Text style={[styles.reactionCount, isActive && { color: r.color }]}>{count}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Primary action */}
          <View style={styles.actionArea}>
            {isPickedUp ? (
              <View style={styles.actionDisabled} accessibilityRole="text">
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>In your library</Text>
              </View>
            ) : isInRange ? (
              <Pressable
                onPress={handlePickup}
                disabled={isPickingUp}
                accessibilityRole="button"
                accessibilityLabel="Pick up this verse"
                accessibilityState={{ disabled: isPickingUp }}
                style={({ pressed }) => [
                  styles.actionGold,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
              >
                {isPickingUp ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="download" size={16} color={colors.white} />
                    <Text style={[styles.actionText, { color: colors.white }]}>Pick up</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <View style={styles.actionDisabled} accessibilityRole="text">
                <Ionicons name="walk-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.actionText, { color: colors.textMuted }]}>Get closer to pick up</Text>
              </View>
            )}
          </View>

          {/* Notes section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>NOTES</Text>
              {notes.length > 0 ? (
                <Text style={styles.sectionCount}>{notes.length}</Text>
              ) : null}
            </View>
            {!notesLoaded ? (
              <ActivityIndicator size="small" color={colors.gold} style={{ marginVertical: spacing.md }} />
            ) : notes.length === 0 ? (
              <View style={styles.notesEmptyWrap}>
                <Text style={styles.notesEmpty}>Be the first to leave a note.</Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
                {notes.map((n) => (
                  <View key={n.id} style={styles.noteCard}>
                    <Text style={styles.noteText}>{n.text}</Text>
                    <Text style={styles.noteDate}>{new Date(n.created_at).toLocaleDateString()}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.noteInputRow}>
              <TextInput
                style={styles.noteInput}
                placeholder="Leave a kind word…"
                placeholderTextColor={colors.textPlaceholder}
                value={noteText}
                onChangeText={setNoteText}
                maxLength={500}
                multiline
                accessibilityLabel="Add a note about this drop"
              />
              <Pressable
                onPress={handleSubmitNote}
                disabled={!noteText.trim() || submittingNote}
                style={({ pressed }) => [
                  styles.noteSubmit,
                  (!noteText.trim() || submittingNote) && styles.disabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Submit note"
              >
                {submittingNote
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Ionicons name="arrow-up" size={18} color={colors.white} />}
              </Pressable>
            </View>
          </View>

          {/* Moderation */}
          {!isOwnDrop ? (
            <View style={styles.moderationRow}>
              <Pressable
                onPress={handleReportPress}
                accessibilityRole="button"
                accessibilityLabel="Report this drop"
                hitSlop={8}
                style={({ pressed }) => [styles.moderationBtn, pressed && styles.pressed]}
              >
                <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
                <Text style={styles.moderationLink}>Report</Text>
              </Pressable>
              <View style={styles.moderationSep} />
              <Pressable
                onPress={handleBlockPress}
                accessibilityRole="button"
                accessibilityLabel="Block this user"
                hitSlop={8}
                style={({ pressed }) => [styles.moderationBtn, pressed && styles.pressed]}
              >
                <Ionicons name="ban-outline" size={14} color={colors.textMuted} />
                <Text style={styles.moderationLink}>Block user</Text>
              </Pressable>
            </View>
          ) : null}
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  sheetBackground: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
  },
  handleIndicator: {
    backgroundColor: colors.separatorBold,
    width: 40,
    height: 4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },

  // Verse hero
  verseCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  verseRef: { ...type.headline, color: colors.gold },
  translationTag: {
    ...type.caption2,
    color: colors.textMuted,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    letterSpacing: 0.5,
  },
  verseText: { ...type.body, color: colors.text, fontStyle: 'italic', lineHeight: 23 },
  customMessageWrap: {
    marginTop: spacing.md,
    paddingLeft: spacing.md,
    flexDirection: 'row',
  },
  customAccent: {
    width: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    marginRight: spacing.sm,
    opacity: 0.5,
  },
  customMessage: {
    ...type.footnote,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },

  // Meta pills
  metaRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  pillSuccess: { backgroundColor: 'rgba(48,209,88,0.15)' },
  pillText: { ...type.caption1, color: colors.textSecondary, fontWeight: '600' as const },

  // Reactions
  reactionRow: { flexDirection: 'row', gap: spacing.sm },
  reactionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingVertical: 10,
  },
  reactionBtnActive: {
    backgroundColor: colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separatorBold,
  },
  reactionLabel: { ...type.footnote, color: colors.textSecondary, fontWeight: '600' as const },
  reactionCount: { ...type.footnote, color: colors.textMuted, fontWeight: '700' as const },

  // Primary action button
  actionArea: {},
  actionGold: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    paddingVertical: 14,
    ...shadows.gold,
  },
  actionDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  actionText: { ...type.headline },

  // Notes
  section: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: { ...type.caption2, color: colors.textMuted, letterSpacing: 0.6 },
  sectionCount: { ...type.caption2, color: colors.gold, fontWeight: '700' as const },
  notesEmptyWrap: { marginBottom: spacing.md },
  notesEmpty: { ...type.footnote, color: colors.textMuted, fontStyle: 'italic' },
  noteCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noteText: { ...type.footnote, color: colors.text, lineHeight: 19 },
  noteDate: { ...type.caption2, color: colors.textMuted, marginTop: spacing.xs },

  noteInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  noteInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...type.body,
    color: colors.text,
    maxHeight: 80,
  },
  noteSubmit: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.gold,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },

  // Moderation
  moderationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  moderationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  moderationLink: { ...type.caption1, color: colors.textMuted, textDecorationLine: 'underline' },
  moderationSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },
});

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, type, shadows } from '../theme';
import { searchVerses, createDrop } from '../lib/api';
import { useAppStore } from '../store/appStore';
import type { VerseResult } from '../types';

export default function DropComposerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const userLocation = useAppStore((s) => s.userLocation);
  const showToast = useAppStore((s) => s.showToast);
  const preferredTranslation = useAppStore((s) => s.preferredTranslation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VerseResult[]>([]);
  const [selected, setSelected] = useState<VerseResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const verses = await searchVerses(query, preferredTranslation);
      setResults(verses);
    } catch (err: any) {
      setResults([]);
      showToast(err?.status === 0 ? "Can't reach server" : 'Search failed');
    }
    setIsSearching(false);
  }, [query, preferredTranslation, showToast]);

  const handleDrop = async () => {
    if (!selected || !userLocation) return;
    setIsDropping(true);
    try {
      await createDrop({
        verse_reference: selected.reference,
        verse_text: selected.text,
        verse_translation: selected.translation || preferredTranslation,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      });
      showToast(`Dropped ${selected.reference}`);
      navigation.goBack();
    } catch (err: any) {
      showToast(err?.status === 0 ? "Can't reach server" : 'Failed to drop verse');
    }
    setIsDropping(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* iOS modal header */}
      <View style={[styles.header, { paddingTop: spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel and close drop composer"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">New Drop</Text>
        <View style={styles.translationPill}>
          <Text style={styles.translationPillText}>{preferredTranslation}</Text>
        </View>
      </View>

      {/* iOS rounded search field */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search verses (love, faith, peace)"
            placeholderTextColor={colors.textPlaceholder}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search Bible verses"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => { setQuery(''); setResults([]); }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={handleSearch}
          disabled={isSearching || !query.trim()}
          style={({ pressed }) => [
            styles.searchBtn,
            (!query.trim() || isSearching) && styles.searchBtnDisabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          {isSearching
            ? <ActivityIndicator size="small" color={colors.text} />
            : <Text style={styles.searchBtnText}>Search</Text>}
        </Pressable>
      </View>

      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {results.length === 0 && !isSearching && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="book-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Search for a verse</Text>
            <Text style={styles.emptyDesc}>
              Find verses by keyword or reference. We'll show matches from the {preferredTranslation} translation.
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsCard}>
            {results.map((v, i) => {
              const isSelected = selected?.reference === v.reference;
              return (
                <Pressable
                  key={v.reference}
                  onPress={() => setSelected(v)}
                  accessibilityRole="button"
                  accessibilityLabel={`${v.reference}. ${v.text}`}
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.resultRow,
                    i < results.length - 1 && styles.rowSeparator,
                    isSelected && styles.resultRowSelected,
                    pressed && !isSelected && styles.pressedRow,
                  ]}
                >
                  <View style={styles.resultText}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultRef}>{v.reference}</Text>
                      {v.translation ? <Text style={styles.resultTranslation}>{v.translation}</Text> : null}
                    </View>
                    <Text style={styles.resultBody} numberOfLines={3}>{v.text}</Text>
                  </View>
                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Drop button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={() => setShowConfirm(true)}
          disabled={!selected}
          style={({ pressed }) => [
            styles.primaryBtn,
            !selected && styles.primaryBtnDisabled,
            pressed && selected && styles.primaryBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={selected ? `Drop ${selected.reference} at your current location` : 'Select a verse first'}
          accessibilityState={{ disabled: !selected }}
        >
          <Ionicons
            name="location"
            size={16}
            color={selected ? colors.white : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.primaryBtnText, !selected && styles.primaryBtnTextDisabled]}>
            {selected ? `Drop ${selected.reference}` : 'Select a verse'}
          </Text>
        </Pressable>
      </View>

      {/* Confirm dialog */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmTitle}>Drop this verse?</Text>
            <View style={styles.confirmVerseCard}>
              <Text style={styles.confirmVerseRef}>{selected?.reference}</Text>
              <Text style={styles.confirmVerseText} numberOfLines={6}>{selected?.text}</Text>
            </View>
            <View style={styles.confirmLocationRow}>
              <Ionicons name="location" size={14} color={colors.textSecondary} />
              <Text style={styles.confirmLocationText}>At your current location</Text>
            </View>

            <Pressable
              onPress={handleDrop}
              disabled={isDropping}
              style={({ pressed }) => [
                styles.primaryBtn,
                isDropping && styles.primaryBtnDisabled,
                pressed && styles.primaryBtnPressed,
                { marginTop: spacing.lg },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Confirm drop"
              accessibilityState={{ disabled: isDropping }}
            >
              {isDropping
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Text style={styles.primaryBtnText}>Drop It</Text>}
            </Pressable>
            <Pressable
              onPress={() => setShowConfirm(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={styles.confirmCancelBtn}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  cancelText: { ...type.body, color: colors.gold, fontWeight: '400' as const, minWidth: 60 },
  headerTitle: { ...type.headline, color: colors.text },
  translationPill: {
    backgroundColor: colors.goldDim,
    borderColor: colors.goldBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  translationPillText: { ...type.caption2, color: colors.gold, letterSpacing: 0.5 },

  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    color: colors.text,
    padding: 0,
  },
  searchBtn: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { ...type.subheadline, color: colors.text, fontWeight: '600' as const },
  pressed: { opacity: 0.7 },
  pressedRow: { backgroundColor: colors.cardActive },

  resultsScroll: { flex: 1 },
  resultsContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.x5l,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...type.headline, color: colors.text, marginBottom: spacing.xs },
  emptyDesc: { ...type.footnote, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },

  resultsCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  resultRowSelected: { backgroundColor: colors.goldDim },
  resultText: { flex: 1 },
  resultHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: 2,
  },
  resultRef: { ...type.subheadline, color: colors.gold, fontWeight: '700' as const },
  resultTranslation: { ...type.caption2, color: colors.textMuted, letterSpacing: 0.4 },
  resultBody: { ...type.footnote, color: colors.text, opacity: 0.9 },
  checkBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },

  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    backgroundColor: colors.bg,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.gold,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.card,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  primaryBtnText: { ...type.headline, color: colors.white },
  primaryBtnTextDisabled: { color: colors.textMuted },

  confirmOverlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  confirmSheet: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
  },
  confirmTitle: {
    ...type.title3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmVerseCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  confirmVerseRef: {
    ...type.subheadline,
    color: colors.gold,
    fontWeight: '700' as const,
    marginBottom: spacing.xs,
  },
  confirmVerseText: { ...type.body, color: colors.text },
  confirmLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  confirmLocationText: { ...type.footnote, color: colors.textSecondary },
  confirmCancelBtn: { paddingVertical: spacing.md, alignItems: 'center', marginTop: 4 },
  confirmCancelText: { ...type.body, color: colors.textSecondary },
});

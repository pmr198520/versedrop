import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Switch, TextInput,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, type, shadows } from '../theme';
import {
  getNotificationPrefs, updateNotificationPrefs, clearPushToken,
  setEmail, listBibleTranslations, type NotificationPrefs,
} from '../lib/api';
import { requestAndRegisterPush } from '../hooks/usePushRegistration';
import { useAppStore } from '../store/appStore';
import type { BibleTranslation } from '../types';

export default function NotificationsSection() {
  const showToast = useAppStore((s) => s.showToast);
  const setPreferredTranslation = useAppStore((s) => s.setPreferredTranslation);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [emailJustSent, setEmailJustSent] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([
        getNotificationPrefs(),
        listBibleTranslations().catch(() => [] as BibleTranslation[]),
      ]);
      setPrefs(p);
      setTranslations(t);
      if (p.email) setEmailInput(p.email);
      if (p.preferred_translation) setPreferredTranslation(p.preferred_translation);
    } catch {
      // Silent — section just shows defaults
    } finally {
      setLoading(false);
    }
  }, [setPreferredTranslation]);

  useEffect(() => { refresh(); }, [refresh]);

  const pickTranslation = async (id: string) => {
    if (!prefs || prefs.preferred_translation === id) return;
    const prev = prefs.preferred_translation;
    setPrefs({ ...prefs, preferred_translation: id });
    setPreferredTranslation(id);
    setBusyKey('translation');
    try {
      await updateNotificationPrefs({ preferred_translation: id });
      showToast(`Translation set to ${id}`);
    } catch {
      setPrefs({ ...prefs, preferred_translation: prev });
      setPreferredTranslation(prev);
      showToast("Couldn't save translation");
    } finally {
      setBusyKey(null);
    }
  };

  const togglePush = async () => {
    if (!prefs) return;
    setBusyKey('push');
    try {
      if (prefs.push_enabled) {
        await clearPushToken();
        setPrefs({ ...prefs, push_enabled: false });
        showToast('Push notifications turned off');
      } else {
        const result = await requestAndRegisterPush();
        if (result === 'granted') {
          setPrefs({ ...prefs, push_enabled: true });
          showToast('Push notifications enabled');
        } else if (result === 'denied') {
          showToast('Permission denied. Enable in Settings.');
        } else {
          showToast('Push not available on this device');
        }
      }
    } catch {
      showToast("Couldn't update notification settings");
    } finally {
      setBusyKey(null);
    }
  };

  const togglePref = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) return;
    const prev = prefs[key];
    setPrefs({ ...prefs, [key]: value });
    setBusyKey(key);
    try {
      await updateNotificationPrefs({ [key]: value } as Partial<NotificationPrefs>);
    } catch {
      setPrefs({ ...prefs, [key]: prev });
      showToast("Couldn't save preference");
    } finally {
      setBusyKey(null);
    }
  };

  const submitEmail = async () => {
    const value = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showToast('Enter a valid email address');
      return;
    }
    setSubmittingEmail(true);
    try {
      await setEmail(value);
      setEmailJustSent(true);
      setPrefs((p) => (p ? { ...p, email: value, email_verified: false } : p));
      showToast('Check your email to confirm');
    } catch {
      showToast("Couldn't send verification email");
    } finally {
      setSubmittingEmail(false);
    }
  };

  const openSettings = async () => {
    try {
      if (Platform.OS === 'ios') await Linking.openURL('app-settings:');
      else await Linking.openSettings();
    } catch {
      await Linking.openSettings();
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }

  const loadedTranslations = translations.filter((t) => t.loaded);
  const activeTranslation = prefs?.preferred_translation || 'KJV';
  const activeMeta = translations.find((t) => t.id === activeTranslation);

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Translation group */}
      <View style={styles.card}>
        <Text style={styles.groupLabel}>BIBLE TRANSLATION</Text>
        {loadedTranslations.length === 0 ? (
          <Text style={styles.muted}>No translations loaded.</Text>
        ) : (
          <View style={styles.chipGrid}>
            {loadedTranslations.map((t) => {
              const active = t.id === activeTranslation;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => pickTranslation(t.id)}
                  disabled={busyKey === 'translation'}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${t.name}`}
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.translationChip,
                    active && styles.translationChipActive,
                    pressed && !active && styles.pressed,
                  ]}
                >
                  <Text style={[styles.translationChipId, active && styles.translationChipIdActive]}>{t.id}</Text>
                  {active ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={11} color={colors.white} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
        {activeMeta ? (
          <Text style={styles.attribution}>{activeMeta.attribution}</Text>
        ) : null}
      </View>

      {/* Push group */}
      <View style={styles.card}>
        <Text style={styles.groupLabel}>PUSH NOTIFICATIONS</Text>
        <View style={styles.row}>
          <View style={styles.iconChip}>
            <Ionicons name="notifications" size={16} color={colors.gold} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Push on this device</Text>
            <Text style={styles.rowDesc}>Pickup, reactions, and nearby drops.</Text>
          </View>
          <Switch
            value={!!prefs?.push_enabled}
            onValueChange={togglePush}
            disabled={busyKey === 'push'}
            trackColor={{ false: colors.cardActive, true: colors.gold }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* Email group */}
      <View style={styles.card}>
        <Text style={styles.groupLabel}>EMAIL</Text>
        <View style={styles.row}>
          <View style={styles.iconChip}>
            <Ionicons name="mail" size={16} color={colors.gold} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>
              {prefs?.email && prefs.email_verified ? 'Email verified' :
               prefs?.email ? 'Verify email' : 'Add email'}
            </Text>
            <Text style={styles.rowDesc} numberOfLines={1}>
              {prefs?.email
                ? (prefs.email_verified ? prefs.email : `${prefs.email} · check inbox`)
                : 'Optional. For pickup updates and weekly recap.'}
            </Text>
          </View>
          {prefs?.email_verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>
          ) : null}
        </View>
        <View style={styles.divider} />
        <View style={styles.emailInputRow}>
          <TextInput
            style={styles.emailInput}
            placeholder="you@example.com"
            placeholderTextColor={colors.textPlaceholder}
            value={emailInput}
            onChangeText={(t) => { setEmailInput(t); setEmailJustSent(false); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="Email address"
          />
          <Pressable
            onPress={submitEmail}
            disabled={submittingEmail}
            style={({ pressed }) => [
              styles.emailBtn,
              submittingEmail && styles.disabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={prefs?.email ? 'Update email' : 'Send verification email'}
          >
            {submittingEmail
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.emailBtnText}>{emailJustSent ? 'Resend' : 'Verify'}</Text>}
          </Pressable>
        </View>
      </View>

      {/* What to notify about */}
      {(prefs?.push_enabled || prefs?.email_verified) && (
        <View style={styles.card}>
          <Text style={styles.groupLabel}>NOTIFY ME WHEN…</Text>
          <PrefRow label="Someone picks up my drop"   value={!!prefs?.notify_on_pickup}      busy={busyKey === 'notify_on_pickup'}      onChange={(v) => togglePref('notify_on_pickup', v)} />
          <PrefRow label="Someone reacts to my drop"  value={!!prefs?.notify_on_reaction}    busy={busyKey === 'notify_on_reaction'}    onChange={(v) => togglePref('notify_on_reaction', v)} />
          <PrefRow label="A new drop appears nearby"  value={!!prefs?.notify_on_nearby_drop} busy={busyKey === 'notify_on_nearby_drop'} onChange={(v) => togglePref('notify_on_nearby_drop', v)} />
          <PrefRow label="Weekly recap email"         value={!!prefs?.notify_weekly_digest}  busy={busyKey === 'notify_weekly_digest'}  onChange={(v) => togglePref('notify_weekly_digest', v)} last />
        </View>
      )}

      {!prefs?.push_enabled && (
        <Pressable onPress={openSettings} accessibilityRole="link" accessibilityLabel="Open device notification settings" hitSlop={6}>
          <Text style={styles.linkText}>Manage notification permissions in Settings</Text>
        </Pressable>
      )}
    </View>
  );
}

function PrefRow({ label, value, busy, onChange, last }: {
  label: string; value: boolean; busy: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
        { paddingVertical: spacing.sm + 2 },
      ]}
      accessible
      accessibilityLabel={`${label} ${value ? 'on' : 'off'}`}
    >
      <Text style={[styles.rowTitle, { flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={busy}
        trackColor={{ false: colors.cardActive, true: colors.gold }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  center: { alignItems: 'center' },
  groupLabel: {
    ...type.caption2,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  muted: { ...type.footnote, color: colors.textMuted },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconChip: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.goldDim,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { ...type.body, color: colors.text, fontWeight: '500' as const },
  rowDesc: { ...type.caption1, color: colors.textSecondary, marginTop: 2 },
  verifiedBadge: { marginLeft: 'auto' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  translationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgElevated,
    borderColor: colors.separator,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minWidth: 64,
  },
  translationChipActive: {
    backgroundColor: colors.goldDim,
    borderColor: colors.goldBorder,
  },
  translationChipId: { ...type.subheadline, color: colors.text, fontWeight: '700' as const, letterSpacing: 0.5 },
  translationChipIdActive: { color: colors.gold },
  checkBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  attribution: { ...type.caption1, color: colors.textMuted, fontStyle: 'italic' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: spacing.md },

  emailInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emailInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...type.body,
    color: colors.text,
  },
  emailBtn: {
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
    ...shadows.gold,
  },
  emailBtnText: { ...type.subheadline, color: colors.white, fontWeight: '700' as const },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
  linkText: {
    ...type.footnote,
    color: colors.gold,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});

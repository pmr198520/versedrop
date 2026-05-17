import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}

/** iOS-style large title header. Sits at the top of a screen. */
export default function LargeTitleHeader({ title, subtitle, trailing }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.lg) + spacing.sm }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  title: {
    ...type.largeTitle,
    color: colors.text,
  },
  subtitle: {
    ...type.subheadline,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

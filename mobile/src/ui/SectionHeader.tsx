import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, type } from '../theme';

interface Props {
  title: string;
  caption?: string;
  inset?: number;
}

/** iOS Settings-style grouped section header. */
export default function SectionHeader({ title, caption, inset = spacing.lg }: Props) {
  return (
    <View style={[styles.wrapper, { paddingHorizontal: inset }]}>
      <Text style={styles.title} accessibilityRole="header">{title.toUpperCase()}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...type.caption1,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  caption: {
    ...type.footnote,
    color: colors.textMuted,
    marginTop: 2,
  },
});

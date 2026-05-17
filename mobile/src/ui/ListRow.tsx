import React from 'react';
import {
  View, Text, StyleSheet, Pressable,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, type } from '../theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  first?: boolean;   // hides top separator (kept for caller compatibility)
  last?: boolean;    // hides bottom separator
}

/** iOS Settings-style row. Use inside a Card variant='grouped' or directly. */
export default function ListRow({
  icon, iconColor, iconBg,
  title, subtitle, trailing, chevron,
  destructive, onPress,
  accessibilityLabel, style, last,
}: Props) {
  const titleColor = destructive ? colors.danger : colors.text;
  const Comp: any = onPress ? Pressable : View;

  return (
    <Comp
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }: { pressed: boolean }) => [
        styles.row,
        !last && styles.separator,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconChip,
            { backgroundColor: iconBg ?? colors.cardActive },
          ]}
        >
          <Ionicons name={icon} size={18} color={iconColor ?? colors.text} />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
      ) : null}
    </Comp>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'transparent',
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  pressed: { backgroundColor: colors.cardActive },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: { ...type.body, fontWeight: '500' as const },
  subtitle: { ...type.footnote, color: colors.textSecondary, marginTop: 2 },
});

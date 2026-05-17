import React from 'react';
import { Pressable, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;            // overall square (default 44 — iOS touch target)
  iconSize?: number;
  color?: string;
  background?: string;
  variant?: 'glass' | 'solid' | 'tint';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/** Circular icon button. Glass = translucent surface with shadow. */
export default function IconButton({
  icon, onPress, size = 44, iconSize, color, background,
  variant = 'glass', accessibilityLabel, style, disabled,
}: Props) {
  const resolvedBg =
    background ??
    (variant === 'solid' ? colors.gold :
     variant === 'tint'  ? colors.goldDim :
     /* glass */          colors.card);
  const iconColor =
    color ??
    (variant === 'solid' ? colors.white :
     variant === 'tint'  ? colors.gold :
     /* glass */          colors.text);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: resolvedBg },
        variant === 'glass' && shadows.md,
        variant === 'solid' && shadows.gold,
        pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize ?? Math.round(size * 0.46)} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

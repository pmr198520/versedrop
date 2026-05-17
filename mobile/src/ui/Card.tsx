import React from 'react';
import { View, type ViewProps, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radii, shadows } from '../theme';

export interface CardProps extends ViewProps {
  variant?: 'flat' | 'elevated' | 'grouped';
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * iOS-style card. Three variants:
 *   - flat:     subtle background, no shadow (use inside grouped sections)
 *   - elevated: shadow + raised surface (default)
 *   - grouped:  iOS Settings-style continuous list container
 */
export default function Card({
  variant = 'elevated',
  padding,
  style,
  children,
  ...rest
}: CardProps) {
  const base: ViewStyle = {
    backgroundColor: variant === 'flat' ? 'transparent' : colors.card,
    borderRadius: variant === 'grouped' ? radii.lg : radii.lg,
    overflow: 'hidden',
    ...(padding != null ? { padding } : null),
  };
  const shadow = variant === 'elevated' ? shadows.md : shadows.none;
  return (
    <View style={[base, shadow, style]} {...rest}>
      {children}
    </View>
  );
}

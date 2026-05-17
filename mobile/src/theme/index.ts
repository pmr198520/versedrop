// VerseDrop design system. Tuned toward iOS HIG conventions:
//   - 4pt spacing grid
//   - SF-like type scale (largeTitle / title / headline / body / footnote ...)
//   - System-feeling neutral palette with a warm gold accent
//   - Material-style shadows (subtle, layered, not heavy borders)

import { Platform } from 'react-native';

const PALETTE = {
  // Backgrounds — darker base, slightly elevated surfaces
  bg:         '#0F0F12',   // base canvas
  bgElevated: '#17171C',   // grouped lists / sheets
  card:       '#1E1E24',   // raised surfaces
  cardActive: '#272730',   // pressed / hover
  scrim:      'rgba(0,0,0,0.55)',

  // Borders / separators — almost invisible, iOS-style hairlines
  separator:    'rgba(255,255,255,0.06)',
  separatorBold:'rgba(255,255,255,0.10)',

  // Accent (warm gold) — used for primary actions, highlights, brand
  gold:       '#D4A857',
  goldLight:  '#E8C079',
  goldDim:    'rgba(212,168,87,0.12)',
  goldBorder: 'rgba(212,168,87,0.32)',

  // Text — iOS dynamic-like contrast tiers
  text:        '#F5F5F7',   // primary
  textSecondary:'#A1A1AA',  // secondary
  textMuted:   '#71717A',   // tertiary
  textPlaceholder:'#52525B',

  // System colors
  white:   '#FFFFFF',
  black:   '#000000',
  success: '#30D158',   // iOS green
  warning: '#FF9F0A',   // iOS orange
  danger:  '#FF453A',   // iOS red
  blue:    '#0A84FF',   // iOS blue
  transparent: 'transparent',
};

// Back-compat aliases for older code that referenced `border` / `borderLight`.
export const colors = {
  ...PALETTE,
  border:      PALETTE.separator,
  borderLight: PALETTE.separatorBold,
};

// 4pt spacing grid — Apple's foundation.
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
  x4l: 40,
  x5l: 56,
};

// Corner radii — iOS uses smooth squircles; we approximate with these.
export const radii = {
  sm:   8,
  md:   12,   // controls, chips
  lg:   16,   // cards
  xl:   22,   // sheets, large cards
  xxl:  28,
  full: 9999,
};

// SF Pro-like type scale. iOS values, rounded for cross-platform.
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '800' as const, letterSpacing: 0.37 },
  title1:     { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: 0.36 },
  title2:     { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: 0.35 },
  title3:     { fontSize: 20, lineHeight: 25, fontWeight: '700' as const, letterSpacing: 0.38 },
  headline:   { fontSize: 17, lineHeight: 22, fontWeight: '700' as const, letterSpacing: -0.41 },
  body:       { fontSize: 17, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout:    { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, letterSpacing: -0.32 },
  subheadline:{ fontSize: 15, lineHeight: 20, fontWeight: '500' as const, letterSpacing: -0.24 },
  footnote:   { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: -0.08 },
  caption1:   { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0 },
  caption2:   { fontSize: 11, lineHeight: 13, fontWeight: '600' as const, letterSpacing: 0.06 },
  // Section header convention — small caps style used by iOS Settings.
  sectionLabel: {
    fontSize: 13, lineHeight: 18, fontWeight: '600' as const,
    letterSpacing: -0.08, textTransform: 'none' as const,
  },
  // Monospace fallback for tokens, debug, etc.
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 },
};

// Shadow presets — iOS-style, soft + layered.
export const shadows = {
  none: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18, shadowRadius: 3, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 5,
  },
  lg: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30, shadowRadius: 22, elevation: 12,
  },
  // Used for the gold FAB / primary CTAs — colored glow
  gold: {
    shadowColor: PALETTE.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
};

// Back-compat: old code referenced `fonts.body`, `fonts.heading`, etc.
export const fonts = {
  regular:    { fontSize: 14, color: colors.text },
  small:      { fontSize: 12, color: colors.textSecondary },
  body:       { ...type.body, color: colors.text },
  heading:    { ...type.title1, color: colors.text },
  subheading: { ...type.headline, color: colors.text },
  caption:    { ...type.caption2, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
};

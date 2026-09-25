/**
 * SurplusLink Design System — colour tokens
 *
 * Primary: deep charcoal near-black  (#1e1e1e ≈ oklch 0.18 0.006 75)
 * Background light: warm-white paper (#faf9f8 ≈ oklch 0.98 0.002 75)
 * Background dark:  near-black graphite (#1a1a18 ≈ oklch 0.11 0.003 75)
 *
 * Mirrors the web app's monochromatic palette exactly.
 */

const palette = {
  // Core brand
  primary: '#1e1e1e',          // deep charcoal
  primaryForeground: '#f7f6f5', // warm off-white

  // Backgrounds
  backgroundLight: '#faf9f8',   // warm paper-white
  backgroundDark: '#1a1a18',    // near-black graphite

  // Surfaces (cards)
  cardLight: '#ffffff',
  cardDark: '#232320',

  // Muted / secondary
  mutedLight: '#eeeceb',
  mutedDark: '#2e2e2b',

  // Muted foreground
  mutedFgLight: '#7a7872',
  mutedFgDark: '#8a887f',

  // Borders
  borderLight: '#dddbd8',
  borderDark: 'rgba(255,255,255,0.10)',

  // Semantic
  destructive: '#c94a2a',
  success: '#38875a',
  warning: '#c89520',

  // Tab bar
  tabIconDefault: '#b0aea8',
};

export default {
  light: {
    text: palette.primary,
    background: palette.backgroundLight,
    tint: palette.primary,
    tabIconDefault: palette.tabIconDefault,
    tabIconSelected: palette.primary,
    card: palette.cardLight,
    muted: palette.mutedLight,
    mutedForeground: palette.mutedFgLight,
    border: palette.borderLight,
    primary: palette.primary,
    primaryForeground: palette.primaryForeground,
    destructive: palette.destructive,
    success: palette.success,
  },
  dark: {
    text: palette.primaryForeground,
    background: palette.backgroundDark,
    tint: palette.primaryForeground,
    tabIconDefault: palette.tabIconDefault,
    tabIconSelected: palette.primaryForeground,
    card: palette.cardDark,
    muted: palette.mutedDark,
    mutedForeground: palette.mutedFgDark,
    border: palette.borderDark,
    primary: palette.primaryForeground,
    primaryForeground: palette.primary,
    destructive: '#e05a3a',
    success: '#4aab72',
  },
};

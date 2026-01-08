/**
 * ClimbZone color palette - earthy climbing-inspired colors
 */

const tintColorLight = '#8B5A2B'; // Terracotta/rock
const tintColorDark = '#D4A574'; // Warm amber

export const Colors = {
  light: {
    text: '#2D2418',
    textSecondary: '#6B5B4F',
    background: '#FAF8F5',
    card: '#FFFFFF',
    border: '#E8E2DA',
    tint: tintColorLight,
    tabIconDefault: '#9B8B7A',
    tabIconSelected: tintColorLight,
    primary: '#8B5A2B',
    primaryForeground: '#FAF8F5',
    secondary: '#E8F5E9',
    secondaryForeground: '#2E7D32',
    accent: '#2E7D32',
    accentForeground: '#FAF8F5',
    destructive: '#D32F2F',
    muted: '#F5F0EB',
    mutedForeground: '#6B5B4F',
  },
  dark: {
    text: '#FAF8F5',
    textSecondary: '#A89B8E',
    background: '#1A1612',
    card: '#252019',
    border: '#3D352D',
    tint: tintColorDark,
    tabIconDefault: '#6B5B4F',
    tabIconSelected: tintColorDark,
    primary: '#D4A574',
    primaryForeground: '#1A1612',
    secondary: '#1B3D20',
    secondaryForeground: '#A5D6A7',
    accent: '#4CAF50',
    accentForeground: '#1A1612',
    destructive: '#EF5350',
    muted: '#2D2620',
    mutedForeground: '#8B7B6E',
  },
};

// Climbing condition colors
export const ConditionColors = {
  excellent: { light: '#4CAF50', dark: '#66BB6A' },
  good: { light: '#8BC34A', dark: '#9CCC65' },
  fair: { light: '#FFC107', dark: '#FFCA28' },
  poor: { light: '#FF9800', dark: '#FFB74D' },
  unsuitable: { light: '#F44336', dark: '#EF5350' },
};

// Climbing type colors
export const ClimbingTypeColors = {
  sport: { light: '#2196F3', dark: '#64B5F6' },
  trad: { light: '#FF9800', dark: '#FFB74D' },
  boulder: { light: '#4CAF50', dark: '#81C784' },
  'multi-pitch': { light: '#9C27B0', dark: '#BA68C8' },
  mixed: { light: '#607D8B', dark: '#90A4AE' },
};





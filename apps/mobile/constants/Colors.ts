/**
 * ClimbZone color palette - Professional modern design
 */

const tintColorLight = '#4F46E5'; // Indigo - professional & modern
const tintColorDark = '#818CF8'; // Light indigo for dark mode

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    primary: '#4F46E5',
    primaryForeground: '#FFFFFF',
    secondary: '#F1F5F9',
    secondaryForeground: '#475569',
    accent: '#10B981',
    accentForeground: '#FFFFFF',
    destructive: '#EF4444',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    primary: '#818CF8',
    primaryForeground: '#0F172A',
    secondary: '#1E293B',
    secondaryForeground: '#CBD5E1',
    accent: '#34D399',
    accentForeground: '#0F172A',
    destructive: '#F87171',
    muted: '#1E293B',
    mutedForeground: '#94A3B8',
  },
};

// Climbing condition colors - refined palette
export const ConditionColors = {
  excellent: { light: '#10B981', dark: '#34D399' },
  good: { light: '#22C55E', dark: '#4ADE80' },
  fair: { light: '#F59E0B', dark: '#FBBF24' },
  poor: { light: '#F97316', dark: '#FB923C' },
  unsuitable: { light: '#EF4444', dark: '#F87171' },
};

// Climbing type colors - cohesive professional palette
export const ClimbingTypeColors = {
  sport: { light: '#3B82F6', dark: '#60A5FA' },
  trad: { light: '#F59E0B', dark: '#FBBF24' },
  boulder: { light: '#10B981', dark: '#34D399' },
  'multi-pitch': { light: '#8B5CF6', dark: '#A78BFA' },
  mixed: { light: '#64748B', dark: '#94A3B8' },
};

// Gradient colors for orientation-based visuals
export const OrientationGradients = {
  sun: {
    light: ['#FB923C', '#F59E0B', '#FBBF24'],
    dark: ['#F97316', '#FB923C', '#FCD34D'],
  },
  shade: {
    light: ['#64748B', '#6366F1', '#818CF8'],
    dark: ['#475569', '#4F46E5', '#6366F1'],
  },
  neutral: {
    light: ['#6366F1', '#4F46E5', '#4338CA'],
    dark: ['#4338CA', '#4F46E5', '#6366F1'],
  },
};





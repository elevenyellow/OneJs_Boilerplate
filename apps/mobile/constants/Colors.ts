/**
 * ClimbZone color palette - Modern glassmorphism design
 */

const tintColorLight = '#6366F1' // Indigo - modern & vibrant
const tintColorDark = '#A5B4FC' // Light indigo for dark mode

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F1F5F9',
    card: '#FFFFFF',
    cardGlass: 'rgba(255, 255, 255, 0.85)',
    border: '#E2E8F0',
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    primaryForeground: '#FFFFFF',
    secondary: '#F1F5F9',
    secondaryForeground: '#475569',
    accent: '#10B981',
    accentLight: '#34D399',
    accentForeground: '#FFFFFF',
    destructive: '#EF4444',
    destructiveLight: '#FCA5A5',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    success: '#22C55E',
    successLight: '#86EFAC',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    info: '#3B82F6',
    infoLight: '#93C5FD',
    // Gradient colors
    gradientPrimary: ['#6366F1', '#8B5CF6', '#A855F7'] as const,
    gradientAccent: ['#10B981', '#14B8A6', '#06B6D4'] as const,
    gradientSunny: ['#F59E0B', '#FB923C', '#F97316'] as const,
    gradientCool: ['#6366F1', '#8B5CF6', '#EC4899'] as const,
    // Glass effects
    glassBackground: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    // Shadows
    shadowColor: '#0F172A',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0F172A',
    card: '#1E293B',
    cardGlass: 'rgba(30, 41, 59, 0.85)',
    border: '#334155',
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    primary: '#A5B4FC',
    primaryLight: '#C7D2FE',
    primaryDark: '#818CF8',
    primaryForeground: '#0F172A',
    secondary: '#1E293B',
    secondaryForeground: '#CBD5E1',
    accent: '#34D399',
    accentLight: '#6EE7B7',
    accentForeground: '#0F172A',
    destructive: '#F87171',
    destructiveLight: '#FECACA',
    muted: '#1E293B',
    mutedForeground: '#94A3B8',
    success: '#4ADE80',
    successLight: '#BBF7D0',
    warning: '#FBBF24',
    warningLight: '#FDE68A',
    info: '#60A5FA',
    infoLight: '#BFDBFE',
    // Gradient colors
    gradientPrimary: ['#818CF8', '#A78BFA', '#C084FC'] as const,
    gradientAccent: ['#34D399', '#2DD4BF', '#22D3EE'] as const,
    gradientSunny: ['#FBBF24', '#FB923C', '#F97316'] as const,
    gradientCool: ['#818CF8', '#A78BFA', '#F472B6'] as const,
    // Glass effects
    glassBackground: 'rgba(30, 41, 59, 0.7)',
    glassBorder: 'rgba(71, 85, 105, 0.5)',
    // Shadows
    shadowColor: '#000000',
  },
}

// Climbing condition colors - refined palette
export const ConditionColors = {
  excellent: { light: '#10B981', dark: '#34D399' },
  good: { light: '#22C55E', dark: '#4ADE80' },
  fair: { light: '#F59E0B', dark: '#FBBF24' },
  poor: { light: '#F97316', dark: '#FB923C' },
  unsuitable: { light: '#EF4444', dark: '#F87171' },
}

// Climbing type colors - cohesive professional palette
export const ClimbingTypeColors = {
  sport: { light: '#3B82F6', dark: '#60A5FA' },
  trad: { light: '#F59E0B', dark: '#FBBF24' },
  boulder: { light: '#10B981', dark: '#34D399' },
  'multi-pitch': { light: '#8B5CF6', dark: '#A78BFA' },
  mixed: { light: '#64748B', dark: '#94A3B8' },
}

// Gradient colors for orientation-based visuals
export const OrientationGradients = {
  sun: {
    light: ['#FB923C', '#F59E0B', '#FBBF24'] as const,
    dark: ['#F97316', '#FB923C', '#FCD34D'] as const,
  },
  shade: {
    light: ['#64748B', '#6366F1', '#818CF8'] as const,
    dark: ['#475569', '#4F46E5', '#6366F1'] as const,
  },
  neutral: {
    light: ['#6366F1', '#4F46E5', '#4338CA'] as const,
    dark: ['#4338CA', '#4F46E5', '#6366F1'] as const,
  },
}

// Score colors for relevance
export const ScoreColors = {
  excellent: '#10B981',
  good: '#22C55E',
  fair: '#F59E0B',
  poor: '#EF4444',
  neutral: '#64748B',
}

export function getScoreColor(score: number): string {
  if (score >= 80) return ScoreColors.excellent
  if (score >= 60) return ScoreColors.good
  if (score >= 40) return ScoreColors.fair
  if (score >= 20) return ScoreColors.poor
  return ScoreColors.neutral
}

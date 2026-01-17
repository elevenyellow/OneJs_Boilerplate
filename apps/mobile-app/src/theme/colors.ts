/**
 * Mobile App Color System
 *
 * This is the SINGLE SOURCE OF TRUTH for all colors in the mobile app.
 * - DO NOT hardcode hex values in components
 * - Import colors from '@/theme/colors' for JS/TS usage
 * - Use Tailwind classes (bg-card, text-accent) which are generated from these values
 *
 * @see tailwind.colors.ts for Tailwind integration
 */
export const colors = {
  /** Background colors for different surface levels */
  bg: {
    /** Main app background (#0a0a0a) */
    primary: '#0a0a0a',
    /** Card/container background (#1a1a1a) */
    card: '#1a1a1a',
    /** Elevated card background (#262626) */
    elevated: '#262626',
    /** Intermediate surface like modals (#121212) */
    surface: '#121212',
    /** Bottom navigation bar (#1e1e1e) */
    nav: '#1e1e1e',
  },

  /** Border colors */
  border: {
    /** Default border color (#2d2d2d) */
    default: '#2d2d2d',
    /** Subtle/muted border (#1f1f1f) */
    muted: '#1f1f1f',
  },

  /** Legacy aliases - prefer using bg.* instead */
  background: '#0a0a0a',
  card: '#1a1a1a',
  cardElevated: '#262626',

  accent: {
    DEFAULT: '#14b8a6',
    dark: '#0d9488',
  },

  orange: {
    DEFAULT: '#f97316',
    dark: '#ea580c',
  },

  grade: {
    easy: '#22c55e',
    medium: '#eab308',
    hard: '#ef4444',
    extreme: '#a855f7',
    unknown: '#6b7280',
  },

  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',
    muted: '#6b7280',
  },

  condition: {
    sol: '#fbbf24',
    sombra: '#60a5fa',
    parcial: '#f97316',
    nublado: '#9ca3af',
  },

  /** Status colors for UI feedback */
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    neutral: '#6b7280',
  },

  /** Protection rating colors for routes */
  protection: {
    wellProtected: '#22c55e',
    normal: '#6b7280',
    spaced: '#f59e0b',
    runout: '#ef4444',
    unknown: '#6b7280',
  },

  /** Temperature recommendation colors */
  temperature: {
    good: '#22c55e',
    moderate: '#f59e0b',
    poor: '#ef4444',
    unknown: '#6b7280',
  },

  /** Crowd level colors */
  crowds: {
    deserted: '#22c55e',
    quiet: '#3b82f6',
    busy: '#f59e0b',
    crowded: '#ef4444',
    unknown: '#6b7280',
  },

  /** Icon default colors by category */
  icon: {
    /** Default icon color */
    default: '#9ca3af',
    /** Accent/highlighted icons */
    accent: '#14b8a6',
    /** Info icons (blue) */
    info: '#3b82f6',
    /** Walk/distance icons (purple) */
    walk: '#8b5cf6',
    /** Navigation icons (material blue) */
    navigation: '#2196F3',
    /** Footsteps/approach icons (orange) */
    approach: '#FF9800',
    /** Success/positive icons */
    success: '#22c55e',
    /** Warning icons */
    warning: '#f59e0b',
    /** Error/danger icons */
    error: '#ef4444',
  },

  /** Route selection highlight color */
  selection: {
    active: '#00FF7F',
  },
} as const

export type GradeBand = 'easy' | 'medium' | 'hard' | 'extreme' | 'unknown'
export type ProtectionRating =
  | 'well-protected'
  | 'normal'
  | 'spaced'
  | 'runout'
  | 'unknown'
export type TemperatureRecommendation = 'good' | 'moderate' | 'poor' | null
export type CrowdLevel =
  | 'DESERTED'
  | 'QUIET'
  | 'BUSY'
  | 'CROWDED'
  | null
  | undefined

export const getGradeColor = (band: GradeBand): string => {
  return colors.grade[band] ?? colors.grade.unknown
}

export const getConditionColor = (
  condition: 'sun' | 'shade' | 'partial' | 'cloudy',
): string => {
  const map = {
    sun: colors.condition.sol,
    shade: colors.condition.sombra,
    partial: colors.condition.parcial,
    cloudy: colors.condition.nublado,
  }
  return map[condition]
}

export const getProtectionColor = (rating: ProtectionRating): string => {
  const map: Record<ProtectionRating, string> = {
    'well-protected': colors.protection.wellProtected,
    normal: colors.protection.normal,
    spaced: colors.protection.spaced,
    runout: colors.protection.runout,
    unknown: colors.protection.unknown,
  }
  return map[rating]
}

export const getTemperatureRecommendationColor = (
  recommendation: TemperatureRecommendation,
): string => {
  if (!recommendation) return colors.temperature.unknown
  return colors.temperature[recommendation]
}

export const getCrowdsColor = (level: CrowdLevel): string => {
  if (!level) return colors.crowds.unknown
  const map: Record<string, string> = {
    DESERTED: colors.crowds.deserted,
    QUIET: colors.crowds.quiet,
    BUSY: colors.crowds.busy,
    CROWDED: colors.crowds.crowded,
  }
  return map[level] ?? colors.crowds.unknown
}

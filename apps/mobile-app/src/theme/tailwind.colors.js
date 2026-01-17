/**
 * Tailwind Color Generator
 *
 * This file generates Tailwind-compatible color configuration from our
 * color system. It's a JS file (not TS) because tailwind.config.js needs
 * to require it directly without transpilation.
 *
 * IMPORTANT: Keep this in sync with colors.ts
 * The values here should match the colors.ts definitions.
 *
 * @see colors.ts for the TypeScript source of truth
 */

const tailwindColors = {
  // Background colors
  background: '#0a0a0a',
  card: '#1a1a1a',
  'card-elevated': '#262626',
  surface: '#121212',
  nav: '#1e1e1e',

  // Border colors
  border: '#2d2d2d',
  'border-muted': '#1f1f1f',

  // Accent colors
  accent: {
    DEFAULT: '#14b8a6',
    dark: '#0d9488',
  },

  // Orange
  orange: {
    DEFAULT: '#f97316',
    dark: '#ea580c',
  },

  // Grade colors
  grade: {
    easy: '#22c55e',
    medium: '#eab308',
    hard: '#ef4444',
    extreme: '#a855f7',
    unknown: '#6b7280',
  },

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',
    muted: '#6b7280',
  },

  // Condition colors
  condition: {
    sol: '#fbbf24',
    sombra: '#60a5fa',
    parcial: '#f97316',
    nublado: '#9ca3af',
  },

  // Status colors
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    neutral: '#6b7280',
  },

  // Protection colors
  protection: {
    'well-protected': '#22c55e',
    normal: '#6b7280',
    spaced: '#f59e0b',
    runout: '#ef4444',
  },

  // Temperature colors
  temperature: {
    good: '#22c55e',
    moderate: '#f59e0b',
    poor: '#ef4444',
  },

  // Crowd colors
  crowds: {
    deserted: '#22c55e',
    quiet: '#3b82f6',
    busy: '#f59e0b',
    crowded: '#ef4444',
  },

  // Icon colors
  icon: {
    DEFAULT: '#9ca3af',
    accent: '#14b8a6',
    info: '#3b82f6',
    walk: '#8b5cf6',
    navigation: '#2196F3',
    approach: '#FF9800',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },

  // Selection colors
  selection: {
    active: '#00FF7F',
  },
}

module.exports = { tailwindColors }

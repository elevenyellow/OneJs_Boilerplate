/**
 * User Preferences Type Definitions
 *
 * This file defines all preference types for the mobile app.
 * Preferences are stored locally via AsyncStorage and will support
 * backend sync when authentication is implemented.
 */

import * as Localization from 'expo-localization'

/**
 * Detect the device language and return a supported language preference.
 * Falls back to 'en' if the device language is not supported.
 */
function getDeviceLanguage(): 'en' | 'es' {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en'
  if (deviceLocale === 'es') {
    return 'es'
  }
  return 'en'
}

// =============================================================================
// Grade System Preferences
// =============================================================================

/**
 * Supported climbing grade systems
 * @see apps/mobile-app/src/utils/grades.ts for grade conversion utilities
 */
export type GradeSystemPreference =
  | 'french'
  | 'yds'
  | 'uiaa'
  | 'british'
  | 'font'
  | 'hueco'

/**
 * Climbing disciplines for filtering and default views
 */
export type ClimbingDiscipline =
  | 'sport'
  | 'boulder'
  | 'trad'
  | 'multipitch'
  | 'all'

// =============================================================================
// Unit Preferences
// =============================================================================

/**
 * Distance measurement system (for approach distances, search radius)
 */
export type DistanceUnit = 'metric' | 'imperial'

/**
 * Height measurement unit (for route heights, wall heights)
 */
export type HeightUnit = 'meters' | 'feet'

/**
 * Temperature unit (for weather display)
 */
export type TemperatureUnit = 'celsius' | 'fahrenheit'

// =============================================================================
// Display Preferences
// =============================================================================

/**
 * App theme preference
 */
export type ThemePreference = 'system' | 'light' | 'dark'

/**
 * Supported app languages
 */
export type LanguagePreference = 'en' | 'es'

// =============================================================================
// Offline Preferences
// =============================================================================

/**
 * Download quality for offline maps and topos
 */
export type DownloadQuality = 'low' | 'medium' | 'high'

// =============================================================================
// Main Preferences Interface
// =============================================================================

/**
 * Complete user preferences structure
 *
 * All preferences have default values and are optional during partial updates.
 * The preferences context handles merging partial updates with defaults.
 */
export interface UserPreferences {
  // -------------------------------------------------------------------------
  // Climbing Preferences
  // -------------------------------------------------------------------------

  /**
   * Preferred grade system for displaying route difficulties
   * @default 'french'
   */
  gradeSystem: GradeSystemPreference

  /**
   * Default climbing discipline filter
   * @default 'all'
   */
  defaultDiscipline: ClimbingDiscipline

  /**
   * Whether to show boulder-specific grades (Font/Hueco) alongside sport grades
   * @default true
   */
  showBoulderGrades: boolean

  /**
   * Whether to show aid climbing grades (A0-A5) when available
   * @default false
   */
  showAidGrades: boolean

  // -------------------------------------------------------------------------
  // Unit Preferences
  // -------------------------------------------------------------------------

  /**
   * Distance measurement unit (km/mi for search radius, approach distances)
   * @default 'metric'
   */
  distanceUnit: DistanceUnit

  /**
   * Height measurement unit (meters/feet for route heights)
   * @default 'meters'
   */
  heightUnit: HeightUnit

  /**
   * Temperature display unit
   * @default 'celsius'
   */
  temperatureUnit: TemperatureUnit

  // -------------------------------------------------------------------------
  // Search Default Preferences
  // -------------------------------------------------------------------------

  /**
   * Default search radius in kilometers
   * @default 50
   */
  defaultSearchRadiusKm: number

  /**
   * Default minimum grade filter (universal grade index, null = no minimum)
   * @default null
   */
  defaultMinGrade: number | null

  /**
   * Default maximum grade filter (universal grade index, null = no maximum)
   * @default null
   */
  defaultMaxGrade: number | null

  /**
   * Whether to remember and restore the last search parameters
   * @default true
   */
  rememberLastSearch: boolean

  // -------------------------------------------------------------------------
  // Display Preferences
  // -------------------------------------------------------------------------

  /**
   * App language (overrides device language when set)
   * @default 'es'
   */
  language: LanguagePreference

  /**
   * App theme preference
   * @default 'dark'
   */
  theme: ThemePreference

  /**
   * Use compact layout for route lists (denser information)
   * @default false
   */
  compactRouteList: boolean

  /**
   * Show color coding for grade categories (easy=green, hard=red, etc.)
   * @default true
   */
  showGradeColors: boolean

  // -------------------------------------------------------------------------
  // Notification Preferences
  // -------------------------------------------------------------------------

  /**
   * Receive weather alerts for saved/favorite crags
   * @default true
   */
  weatherAlerts: boolean

  /**
   * Receive notifications when new routes are added to saved crags
   * @default false
   */
  newRouteAlerts: boolean

  /**
   * Receive notifications about climbing condition changes
   * @default true
   */
  conditionAlerts: boolean

  // -------------------------------------------------------------------------
  // Offline & Storage Preferences
  // -------------------------------------------------------------------------

  /**
   * Automatically download data for saved/favorite areas
   * @default false
   */
  autoDownloadSaved: boolean

  /**
   * Quality setting for downloaded maps and images
   * @default 'medium'
   */
  downloadQuality: DownloadQuality

  /**
   * Only download data when connected to WiFi
   * @default true
   */
  wifiOnlyDownloads: boolean

  // -------------------------------------------------------------------------
  // Safety Preferences
  // -------------------------------------------------------------------------

  /**
   * Emergency contact phone number
   * @default ''
   */
  emergencyContact: string

  /**
   * Show safety warnings for dangerous areas/routes
   * @default true
   */
  showSafetyWarnings: boolean

  /**
   * Enable location logging during climbing sessions (for safety/sharing)
   * @default false
   */
  logClimbingSessions: boolean
}

// =============================================================================
// Default Preferences
// =============================================================================

/**
 * Default values for all user preferences
 *
 * These values are used when:
 * - App is launched for the first time
 * - A preference key is missing from storage
 * - Resetting preferences to defaults
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  // Climbing
  gradeSystem: 'french',
  defaultDiscipline: 'all',
  showBoulderGrades: true,
  showAidGrades: false,

  // Units
  distanceUnit: 'metric',
  heightUnit: 'meters',
  temperatureUnit: 'celsius',

  // Search Defaults
  defaultSearchRadiusKm: 50,
  defaultMinGrade: null,
  defaultMaxGrade: null,
  rememberLastSearch: true,

  // Display
  language: getDeviceLanguage(),
  theme: 'dark',
  compactRouteList: false,
  showGradeColors: true,

  // Notifications
  weatherAlerts: true,
  newRouteAlerts: false,
  conditionAlerts: true,

  // Offline
  autoDownloadSaved: false,
  downloadQuality: 'medium',
  wifiOnlyDownloads: true,

  // Safety
  emergencyContact: '',
  showSafetyWarnings: true,
  logClimbingSessions: false,
}

// =============================================================================
// Storage Types
// =============================================================================

/**
 * Partial preferences for updates
 * All fields are optional when updating preferences
 */
export type PartialPreferences = Partial<UserPreferences>

/**
 * Storage wrapper with metadata for sync and migrations
 */
export interface StoredPreferences {
  /**
   * Schema version for migration support
   */
  version: number

  /**
   * Last modification timestamp (ISO string)
   */
  updatedAt: string

  /**
   * Device ID for conflict resolution in future sync
   */
  deviceId: string

  /**
   * The actual preferences data
   */
  preferences: UserPreferences
}

/**
 * Current schema version
 * Increment this when making breaking changes to the preferences structure
 */
export const PREFERENCES_SCHEMA_VERSION = 1

/**
 * Storage key for AsyncStorage
 */
export const PREFERENCES_STORAGE_KEY = '@climb_app_preferences'

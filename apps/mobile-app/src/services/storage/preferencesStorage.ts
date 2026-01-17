/**
 * Preferences Storage Service
 *
 * Provides typed AsyncStorage wrapper for user preferences with:
 * - JSON serialization/deserialization
 * - Schema version tracking for migrations
 * - Device ID generation for future sync
 * - Error handling and logging
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { devLog } from '@/utils/logger'
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_SCHEMA_VERSION,
  PREFERENCES_STORAGE_KEY,
  type PartialPreferences,
  type StoredPreferences,
  type UserPreferences,
} from '@/types/preferences'

// =============================================================================
// Device ID Generation
// =============================================================================

/**
 * Generate a unique device identifier for sync conflict resolution
 * Uses a simple UUID-like format stored persistently
 */
async function getOrCreateDeviceId(): Promise<string> {
  const DEVICE_ID_KEY = '@climb_app_device_id'

  try {
    const existingId = await AsyncStorage.getItem(DEVICE_ID_KEY)
    if (existingId) {
      return existingId
    }

    // Generate a simple UUID-like identifier
    const newId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId)
    return newId
  } catch (error) {
    devLog.error('Failed to get/create device ID', error)
    return `device_fallback_${Date.now()}`
  }
}

// =============================================================================
// Migration Support
// =============================================================================

/**
 * Migrate preferences from older schema versions
 *
 * Add migration logic here when PREFERENCES_SCHEMA_VERSION is incremented.
 * Each migration should handle upgrading from version N to N+1.
 */
function migratePreferences(stored: StoredPreferences): StoredPreferences {
  const currentVersion = stored.version
  const preferences = { ...stored.preferences }

  // Migration from version 1 to 2 (example for future use)
  // if (currentVersion === 1) {
  //   // Add new field with default value
  //   preferences.newField = preferences.newField ?? 'default'
  //   currentVersion = 2
  // }

  return {
    ...stored,
    version: currentVersion,
    preferences,
  }
}

// =============================================================================
// Storage Service
// =============================================================================

/**
 * Load preferences from AsyncStorage
 *
 * Returns the full UserPreferences object, merging stored values with defaults
 * to handle missing fields from older versions or first launch.
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const storedJson = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)

    if (!storedJson) {
      devLog.log('No stored preferences found, using defaults')
      return DEFAULT_PREFERENCES
    }

    const stored: StoredPreferences = JSON.parse(storedJson)

    // Handle schema migrations if needed
    const migrated =
      stored.version < PREFERENCES_SCHEMA_VERSION
        ? migratePreferences(stored)
        : stored

    // If migration occurred, persist the migrated data
    if (migrated.version !== stored.version) {
      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(migrated),
      )
      devLog.log(
        `Migrated preferences from v${stored.version} to v${migrated.version}`,
      )
    }

    // Merge with defaults to handle any missing fields
    const mergedPreferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...migrated.preferences,
    }

    return mergedPreferences
  } catch (error) {
    devLog.error('Failed to load preferences', error)
    return DEFAULT_PREFERENCES
  }
}

/**
 * Save preferences to AsyncStorage
 *
 * Accepts partial preferences and merges with existing values.
 * Updates the timestamp and maintains the storage wrapper structure.
 */
export async function savePreferences(
  updates: PartialPreferences,
): Promise<UserPreferences> {
  try {
    // Load current preferences
    const current = await loadPreferences()

    // Merge updates with current preferences
    const updated: UserPreferences = {
      ...current,
      ...updates,
    }

    // Get device ID for sync metadata
    const deviceId = await getOrCreateDeviceId()

    // Create storage wrapper
    const stored: StoredPreferences = {
      version: PREFERENCES_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      deviceId,
      preferences: updated,
    }

    // Persist to AsyncStorage
    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(stored))

    devLog.log('Preferences saved successfully')
    return updated
  } catch (error) {
    devLog.error('Failed to save preferences', error)
    throw error
  }
}

/**
 * Reset all preferences to defaults
 *
 * Useful for "Reset to Defaults" functionality in settings.
 */
export async function resetPreferences(): Promise<UserPreferences> {
  try {
    const deviceId = await getOrCreateDeviceId()

    const stored: StoredPreferences = {
      version: PREFERENCES_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      deviceId,
      preferences: DEFAULT_PREFERENCES,
    }

    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(stored))

    devLog.log('Preferences reset to defaults')
    return DEFAULT_PREFERENCES
  } catch (error) {
    devLog.error('Failed to reset preferences', error)
    throw error
  }
}

/**
 * Clear all preferences from storage
 *
 * Used primarily for debugging and testing.
 * After clearing, the next load will return defaults.
 */
export async function clearPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFERENCES_STORAGE_KEY)
    devLog.log('Preferences cleared from storage')
  } catch (error) {
    devLog.error('Failed to clear preferences', error)
    throw error
  }
}

/**
 * Get raw stored preferences with metadata
 *
 * Useful for debugging and future sync implementation.
 */
export async function getStoredPreferencesWithMetadata(): Promise<StoredPreferences | null> {
  try {
    const storedJson = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)

    if (!storedJson) {
      return null
    }

    return JSON.parse(storedJson)
  } catch (error) {
    devLog.error('Failed to get stored preferences metadata', error)
    return null
  }
}

/**
 * Export preferences for backup/export feature
 */
export async function exportPreferences(): Promise<string> {
  const stored = await getStoredPreferencesWithMetadata()
  return JSON.stringify(stored, null, 2)
}

/**
 * Import preferences from backup
 *
 * Validates the imported data and merges with defaults.
 */
export async function importPreferences(
  jsonString: string,
): Promise<UserPreferences> {
  try {
    const imported = JSON.parse(jsonString) as Partial<StoredPreferences>

    if (!imported.preferences) {
      throw new Error('Invalid preferences format: missing preferences object')
    }

    // Merge with defaults to ensure all fields exist
    const mergedPreferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...imported.preferences,
    }

    // Save the imported preferences
    return await savePreferences(mergedPreferences)
  } catch (error) {
    devLog.error('Failed to import preferences', error)
    throw error
  }
}

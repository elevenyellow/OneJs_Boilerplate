import * as Haptics from 'expo-haptics'

/**
 * Centralized haptic feedback service for consistent tactile feedback across the app.
 * Provides different intensities for various interaction types.
 *
 * Usage:
 * - `light`: Filter chips, toggles, tab changes, photo snaps
 * - `medium`: Sector area selection, important actions
 * - `heavy`: Significant confirmations (rarely used)
 * - `selection`: Route selection, list item selection
 * - `success/warning/error`: Notification feedback
 */
export const haptics = {
  /**
   * Light impact feedback for subtle interactions
   * Use for: tab changes, filter selections, photo carousel snaps
   */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /**
   * Medium impact feedback for important interactions
   * Use for: sector area press, significant selections
   */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /**
   * Heavy impact feedback for significant actions
   * Use sparingly for major confirmations
   */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /**
   * Selection feedback optimized for list/toggle selections
   * Use for: route selection, toggle switches, list item press
   */
  selection: () => Haptics.selectionAsync(),

  /**
   * Success notification feedback
   * Use for: successful operations, confirmations
   */
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /**
   * Warning notification feedback
   * Use for: warning states, caution notifications
   */
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /**
   * Error notification feedback
   * Use for: error states, failed operations
   */
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
}

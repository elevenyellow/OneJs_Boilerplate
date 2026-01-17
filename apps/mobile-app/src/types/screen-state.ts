/**
 * Shared navigation props for screen state components (LoadingState, ErrorState, EmptyState).
 * These props are passed through to ScreenStateWrapper for consistent navigation handling.
 */
export interface ScreenStateNavigationProps {
  /** Show back button in header or as floating button */
  showBackButton?: boolean
  /** Callback when back button is pressed */
  onBack?: () => void
  /** If true, uses a floating back button instead of ScreenHeader */
  useFloatingBackButton?: boolean
}

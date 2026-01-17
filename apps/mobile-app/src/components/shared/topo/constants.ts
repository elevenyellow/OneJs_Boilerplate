import { Dimensions } from 'react-native'
import { colors } from '@/theme/colors'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Screen dimensions
export { SCREEN_WIDTH, SCREEN_HEIGHT }

// Zoom configuration
export const MIN_ZOOM = 1
export const MAX_ZOOM = 4
export const DOUBLE_TAP_ZOOM = 2.5

// Image dimensions
export const IMAGE_HEIGHT = SCREEN_WIDTH * 1.0

// Thumbnail configuration
export const THUMBNAIL_SIZE = 48
export const THUMBNAIL_SPACING = 6

// Gesture thresholds
export const SWIPE_THRESHOLD = 50
export const DOUBLE_TAP_DELAY = 300

// Default colors
export const DEFAULT_ROUTE_COLOR = colors.text.secondary

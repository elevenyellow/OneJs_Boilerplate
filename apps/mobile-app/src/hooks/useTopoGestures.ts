import { useRef, useEffect, useCallback } from 'react'
import { PanResponder, Animated as RNAnimated } from 'react-native'
import {
  SWIPE_THRESHOLD,
  SCREEN_WIDTH,
  DOUBLE_TAP_DELAY,
} from '@/components/shared/topo/constants'

interface UseTopoGesturesProps {
  /**
   * Whether swipe gestures are enabled (requires multiple photos)
   */
  enabled: boolean

  /**
   * Current photo index
   */
  currentIndex: number

  /**
   * Total number of photos
   */
  totalPhotos: number

  /**
   * Callback when swiping to previous photo
   */
  onSwipePrevious: () => void

  /**
   * Callback when swiping to next photo
   */
  onSwipeNext: () => void

  /**
   * Callback when double tap is detected
   */
  onDoubleTap?: () => void
}

interface UseTopoGesturesResult {
  /**
   * Animated translateX value for swipe feedback
   */
  translateX: RNAnimated.Value

  /**
   * Pan responder handlers to attach to component
   */
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers']

  /**
   * Handle image press for double tap detection
   */
  handleImagePress: () => void
}

/**
 * Hook to manage swipe and double-tap gestures for topo image navigation.
 *
 * Uses React Native's PanResponder for horizontal swipe detection and
 * time-based double-tap detection for triggering custom actions.
 *
 * **Note**: This hook uses the legacy PanResponder API. The double-tap
 * detection here is for triggering custom callbacks (e.g., open fullscreen),
 * NOT for zoom. Use `useTopoZoom` for pinch-zoom and double-tap-to-zoom.
 *
 * @see {@link file://./topo-hooks.md} for architecture documentation
 * @see {@link useTopoZoom} for pinch-zoom and pan gestures
 * @see {@link useTopoPhotoNavigation} for photo selection state management
 */
export function useTopoGestures({
  enabled,
  currentIndex,
  totalPhotos,
  onSwipePrevious,
  onSwipeNext,
  onDoubleTap,
}: UseTopoGesturesProps): UseTopoGesturesResult {
  // Swipe animation
  const translateX = useRef(new RNAnimated.Value(0)).current

  // Store current values in refs so PanResponder can access latest values
  const currentIndexRef = useRef(currentIndex)
  const totalPhotosRef = useRef(totalPhotos)

  // Keep refs in sync with props
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    totalPhotosRef.current = totalPhotos
  }, [totalPhotos])

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return (
          totalPhotosRef.current > 1 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 10
        )
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit the drag to avoid over-scrolling
        const maxDrag = SCREEN_WIDTH * 0.3
        const limitedDx = Math.max(-maxDrag, Math.min(maxDrag, gestureState.dx))
        translateX.setValue(limitedDx)
      },
      onPanResponderRelease: (_, gestureState) => {
        const index = currentIndexRef.current
        const total = totalPhotosRef.current

        if (gestureState.dx > SWIPE_THRESHOLD && index > 0) {
          // Swipe right - go to previous photo
          onSwipePrevious()
        } else if (gestureState.dx < -SWIPE_THRESHOLD && index < total - 1) {
          // Swipe left - go to next photo
          onSwipeNext()
        }

        // Animate back to center
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start()
      },
    }),
  ).current

  // Double tap gesture for opening fullscreen
  const lastTap = useRef<number>(0)

  const handleImagePress = useCallback(() => {
    const now = Date.now()
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      onDoubleTap?.()
    }
    lastTap.current = now
  }, [onDoubleTap])

  return {
    translateX,
    panHandlers: enabled ? panResponder.panHandlers : {},
    handleImagePress,
  }
}

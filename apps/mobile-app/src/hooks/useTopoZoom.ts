import { useCallback } from 'react'
import type { ViewStyle } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated'
import {
  MIN_ZOOM,
  MAX_ZOOM,
  DOUBLE_TAP_ZOOM,
} from '@/components/shared/topo/constants'

interface UseTopoZoomProps {
  /**
   * Width of the zoomable container
   */
  containerWidth: number

  /**
   * Height of the zoomable container
   */
  containerHeight: number
}

interface UseTopoZoomResult {
  /**
   * Animated style for the zoom container
   */
  animatedZoomStyle: AnimatedStyle<ViewStyle>

  /**
   * Combined gesture handler for pinch, pan, and double-tap
   */
  composedGestures: ReturnType<typeof Gesture.Simultaneous>

  /**
   * Reset zoom to initial state
   */
  resetZoom: () => void
}

/**
 * Hook to manage pinch-zoom, pan, and double-tap zoom gestures.
 *
 * Uses Reanimated Gesture Handler for smooth, performant animations.
 * This hook handles the zoom/pan interactions on a topo image.
 *
 * **Note**: Double-tap in this hook toggles zoom (1x ↔ 2x).
 * If you need double-tap for other actions (e.g., opening fullscreen),
 * use `useTopoGestures` instead.
 *
 * @see {@link file://./topo-hooks.md} for architecture documentation
 * @see {@link useTopoGestures} for swipe navigation and custom double-tap actions
 * @see {@link useTopoPhotoNavigation} for photo selection state management
 */
export function useTopoZoom({
  containerWidth,
  containerHeight,
}: UseTopoZoomProps): UseTopoZoomResult {
  // Zoom state
  const zoomScale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateXZoom = useSharedValue(0)
  const translateYZoom = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  // Reset zoom
  const resetZoom = useCallback(() => {
    zoomScale.value = withSpring(1)
    savedScale.value = 1
    translateXZoom.value = withSpring(0)
    translateYZoom.value = withSpring(0)
    savedTranslateX.value = 0
    savedTranslateY.value = 0
  }, [
    zoomScale,
    savedScale,
    translateXZoom,
    translateYZoom,
    savedTranslateX,
    savedTranslateY,
  ])

  // Animated style for zoom container
  const animatedZoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateXZoom.value },
      { translateY: translateYZoom.value },
      { scale: zoomScale.value },
    ],
  }))

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale
      zoomScale.value = Math.min(Math.max(newScale, MIN_ZOOM), MAX_ZOOM)
    })
    .onEnd(() => {
      savedScale.value = zoomScale.value
      // Snap back if below minimum
      if (zoomScale.value < MIN_ZOOM) {
        zoomScale.value = withSpring(MIN_ZOOM)
        savedScale.value = MIN_ZOOM
      }
    })

  // Pan gesture for moving around when zoomed
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (zoomScale.value > 1) {
        const maxTranslateX = ((zoomScale.value - 1) * containerWidth) / 2
        const maxTranslateY = ((zoomScale.value - 1) * containerHeight) / 2

        translateXZoom.value = Math.min(
          Math.max(savedTranslateX.value + event.translationX, -maxTranslateX),
          maxTranslateX,
        )
        translateYZoom.value = Math.min(
          Math.max(savedTranslateY.value + event.translationY, -maxTranslateY),
          maxTranslateY,
        )
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateXZoom.value
      savedTranslateY.value = translateYZoom.value
    })

  // Double tap to toggle zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (zoomScale.value > 1) {
        // Reset zoom
        zoomScale.value = withSpring(1)
        savedScale.value = 1
        translateXZoom.value = withSpring(0)
        translateYZoom.value = withSpring(0)
        savedTranslateX.value = 0
        savedTranslateY.value = 0
      } else {
        // Zoom in to tap point
        const tapX = event.x - containerWidth / 2
        const tapY = event.y - containerHeight / 2

        zoomScale.value = withSpring(DOUBLE_TAP_ZOOM)
        savedScale.value = DOUBLE_TAP_ZOOM

        // Calculate offset to center on tap point
        const offsetX = -tapX * (DOUBLE_TAP_ZOOM - 1)
        const offsetY = -tapY * (DOUBLE_TAP_ZOOM - 1)

        const maxTranslateX = ((DOUBLE_TAP_ZOOM - 1) * containerWidth) / 2
        const maxTranslateY = ((DOUBLE_TAP_ZOOM - 1) * containerHeight) / 2

        translateXZoom.value = withSpring(
          Math.min(Math.max(offsetX, -maxTranslateX), maxTranslateX),
        )
        translateYZoom.value = withSpring(
          Math.min(Math.max(offsetY, -maxTranslateY), maxTranslateY),
        )
        savedTranslateX.value = translateXZoom.value
        savedTranslateY.value = translateYZoom.value
      }
    })

  // Combine gestures - pinch and pan can happen simultaneously
  const composedGestures = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  )

  return {
    animatedZoomStyle,
    composedGestures,
    resetZoom,
  }
}

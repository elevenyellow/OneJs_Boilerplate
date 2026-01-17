import { useState, useCallback, useRef, useEffect } from 'react'
import { Animated as RNAnimated } from 'react-native'

interface UseTopoPhotoNavigationProps {
  /**
   * Controlled photo index (external state)
   */
  controlledPhotoIndex?: number

  /**
   * Callback when photo changes
   */
  onPhotoChange?: (index: number) => void

  /**
   * Total number of photos
   */
  totalPhotos: number
}

interface UseTopoPhotoNavigationResult {
  /**
   * Current selected photo index
   */
  selectedPhotoIndex: number

  /**
   * Photo index currently displayed (with fade animation)
   */
  displayedPhotoIndex: number

  /**
   * Fade animation value for transitions
   */
  fadeAnim: RNAnimated.Value

  /**
   * Set the selected photo index
   */
  setSelectedPhotoIndex: (index: number) => void

  /**
   * Go to next photo
   */
  goToNextPhoto: () => void

  /**
   * Go to previous photo
   */
  goToPreviousPhoto: () => void

  /**
   * Whether there are multiple photos
   */
  hasMultiplePhotos: boolean

  /**
   * Whether can go to next photo
   */
  canGoNext: boolean

  /**
   * Whether can go to previous photo
   */
  canGoPrevious: boolean
}

/**
 * Hook to manage photo navigation state with fade animations.
 *
 * Handles photo selection state in controlled or uncontrolled mode,
 * providing smooth fade transitions when changing photos.
 *
 * This is a state-only hook - it does not handle gestures.
 * Compose with `useTopoGestures` for swipe navigation or
 * `useTopoZoom` for zoom interactions.
 *
 * @see {@link file://./topo-hooks.md} for architecture documentation
 * @see {@link useTopoZoom} for pinch-zoom and pan gestures
 * @see {@link useTopoGestures} for swipe navigation
 */
export function useTopoPhotoNavigation({
  controlledPhotoIndex,
  onPhotoChange,
  totalPhotos,
}: UseTopoPhotoNavigationProps): UseTopoPhotoNavigationResult {
  const [internalPhotoIndex, setInternalPhotoIndex] = useState(0)
  const [displayedPhotoIndex, setDisplayedPhotoIndex] = useState(
    controlledPhotoIndex ?? 0,
  )

  // Fade animation for photo transitions
  const fadeAnim = useRef(new RNAnimated.Value(1)).current

  // Use controlled or internal state
  const selectedPhotoIndex = controlledPhotoIndex ?? internalPhotoIndex

  const setSelectedPhotoIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalPhotos) return

      if (onPhotoChange) {
        onPhotoChange(index)
      } else {
        setInternalPhotoIndex(index)
      }
    },
    [onPhotoChange, totalPhotos],
  )

  // Animate fade transition when photo changes
  useEffect(() => {
    if (selectedPhotoIndex !== displayedPhotoIndex) {
      // Fade out, change image, fade in
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setDisplayedPhotoIndex(selectedPhotoIndex)
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start()
      })
    }
  }, [selectedPhotoIndex, displayedPhotoIndex, fadeAnim])

  const goToNextPhoto = useCallback(() => {
    if (selectedPhotoIndex < totalPhotos - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1)
    }
  }, [selectedPhotoIndex, totalPhotos, setSelectedPhotoIndex])

  const goToPreviousPhoto = useCallback(() => {
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1)
    }
  }, [selectedPhotoIndex, setSelectedPhotoIndex])

  return {
    selectedPhotoIndex,
    displayedPhotoIndex,
    fadeAnim,
    setSelectedPhotoIndex,
    goToNextPhoto,
    goToPreviousPhoto,
    hasMultiplePhotos: totalPhotos > 1,
    canGoNext: selectedPhotoIndex < totalPhotos - 1,
    canGoPrevious: selectedPhotoIndex > 0,
  }
}

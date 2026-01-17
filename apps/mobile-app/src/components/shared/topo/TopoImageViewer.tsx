import { useState, useCallback } from 'react'
import { View } from 'react-native'
import { useTopoPhotoNavigation } from '@/hooks/useTopoPhotoNavigation'
import { useTopoGestures } from '@/hooks/useTopoGestures'
import { TopoImage } from './TopoImage'
import { TopoFullscreenModal } from './TopoFullscreenModal'
import { TopoLegendModal } from './TopoLegendModal'
import { TopoThumbnailStrip } from './TopoThumbnailStrip'
import type { TopoImageViewerProps } from './types'

/**
 * TopoImageViewer - Displays climbing route photos with SVG route lines
 *
 * Features:
 * - Renders route lines from SVG paths (backend format)
 * - Supports multiple photos with thumbnails and counter
 * - Swipe left/right to change photos
 * - Shows route numbers at the bottom of each line
 * - Highlights selected route
 * - Supports legacy marker format for backwards compatibility
 */
export function TopoImageViewer({
  photos = [],
  imageUrl,
  markers = [],
  selectedRouteId,
  selectedRouteExternalId,
  selectedRouteColor,
  selectedPhotoIndex: controlledPhotoIndex,
  onRoutePress,
  onPhotoChange,
  onFullscreen,
}: TopoImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLegend, setShowLegend] = useState(false)

  // Photo navigation with fade animations
  const {
    selectedPhotoIndex,
    displayedPhotoIndex,
    fadeAnim,
    setSelectedPhotoIndex,
    goToNextPhoto,
    goToPreviousPhoto,
    hasMultiplePhotos,
  } = useTopoPhotoNavigation({
    controlledPhotoIndex,
    onPhotoChange,
    totalPhotos: photos.length,
  })

  // Determine image state
  const hasTopoPhotos = photos.length > 0
  const currentPhoto = photos[displayedPhotoIndex]
  const isFallbackImage = !hasTopoPhotos && !!imageUrl

  // Swipe and double-tap gestures
  const { translateX, panHandlers, handleImagePress } = useTopoGestures({
    enabled: hasMultiplePhotos,
    currentIndex: selectedPhotoIndex,
    totalPhotos: photos.length,
    onSwipePrevious: goToPreviousPhoto,
    onSwipeNext: goToNextPhoto,
    onDoubleTap: useCallback(() => {
      if (hasTopoPhotos) {
        setIsFullscreen(true)
      }
    }, [hasTopoPhotos]),
  })

  // Handle fullscreen toggle
  const handleFullscreenPress = useCallback(() => {
    if (onFullscreen) {
      onFullscreen()
    } else if (hasTopoPhotos) {
      setIsFullscreen(true)
    }
  }, [onFullscreen, hasTopoPhotos])

  // Handle legend toggle
  const handleLegendPress = useCallback(() => {
    setShowLegend(true)
  }, [])

  // Handle fullscreen close
  const handleFullscreenClose = useCallback(() => {
    setIsFullscreen(false)
  }, [])

  // Handle legend close
  const handleLegendClose = useCallback(() => {
    setShowLegend(false)
  }, [])

  return (
    <View className="bg-background">
      {/* Main topo image with overlays and controls */}
      <TopoImage
        currentPhoto={currentPhoto}
        fallbackImageUrl={imageUrl}
        isFallbackImage={isFallbackImage}
        legacyMarkers={markers}
        translateX={translateX}
        fadeAnim={fadeAnim}
        panHandlers={panHandlers}
        selectedPhotoIndex={selectedPhotoIndex}
        totalPhotos={photos.length}
        hasMultiplePhotos={hasMultiplePhotos}
        selectedRouteId={selectedRouteId}
        selectedRouteExternalId={selectedRouteExternalId}
        selectedRouteColor={selectedRouteColor}
        onImagePress={handleImagePress}
        onRoutePress={onRoutePress}
        onPrevious={goToPreviousPhoto}
        onNext={goToNextPhoto}
        onFullscreenPress={handleFullscreenPress}
        onLegendPress={handleLegendPress}
      />

      {/* Fullscreen modal viewer */}
      <TopoFullscreenModal
        visible={isFullscreen}
        currentPhoto={currentPhoto}
        photos={photos}
        selectedPhotoIndex={selectedPhotoIndex}
        selectedRouteId={selectedRouteId}
        selectedRouteExternalId={selectedRouteExternalId}
        selectedRouteColor={selectedRouteColor}
        onClose={handleFullscreenClose}
        onPhotoChange={setSelectedPhotoIndex}
        onRoutePress={onRoutePress}
      />

      {/* Routes symbols legend modal */}
      <TopoLegendModal visible={showLegend} onClose={handleLegendClose} />

      {/* Thumbnails strip for multiple photos */}
      {hasMultiplePhotos && (
        <TopoThumbnailStrip
          photos={photos}
          selectedIndex={selectedPhotoIndex}
          onThumbnailPress={setSelectedPhotoIndex}
        />
      )}
    </View>
  )
}

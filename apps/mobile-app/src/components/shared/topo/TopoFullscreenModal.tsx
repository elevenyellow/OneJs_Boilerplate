import {
  View,
  Image,
  TouchableOpacity,
  Text,
  Modal,
  StatusBar,
} from 'react-native'
import {
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { CloseIcon } from '@/components/shared/icons'
import type { SectorPhotoWithAreasDto } from '@/types/api'
import { useTopoZoom } from '@/hooks/useTopoZoom'
import { TopoRouteOverlay } from './TopoRouteOverlay'
import { TopoRouteLabels } from './TopoRouteLabels'
import { TopoThumbnailStrip } from './TopoThumbnailStrip'
import { TopoNavigationArrows } from './TopoNavigationArrows'
import { TopoPhotoBadges } from './TopoPhotoBadges'
import { calculateFullscreenDimensions } from './utils'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './constants'

interface TopoFullscreenModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean

  /**
   * Current photo to display
   */
  currentPhoto: SectorPhotoWithAreasDto | undefined

  /**
   * All photos for navigation
   */
  photos: SectorPhotoWithAreasDto[]

  /**
   * Current photo index
   */
  selectedPhotoIndex: number

  /**
   * Selected route ID
   */
  selectedRouteId?: string

  /**
   * Selected route external ID
   */
  selectedRouteExternalId?: string

  /**
   * Color for selected route
   */
  selectedRouteColor?: string

  /**
   * Callback to close the modal
   */
  onClose: () => void

  /**
   * Callback when photo changes
   */
  onPhotoChange: (index: number) => void

  /**
   * Callback when route is pressed
   */
  onRoutePress?: (routeId: string) => void
}

/**
 * Fullscreen modal for viewing topo images with zoom and pan
 */
export function TopoFullscreenModal({
  visible,
  currentPhoto,
  photos,
  selectedPhotoIndex,
  selectedRouteId,
  selectedRouteExternalId,
  selectedRouteColor,
  onClose,
  onPhotoChange,
  onRoutePress,
}: TopoFullscreenModalProps) {
  const hasMultiplePhotos = photos.length > 1

  // Calculate fullscreen dimensions
  const { width: fullscreenWidth, height: fullscreenHeight } =
    calculateFullscreenDimensions(currentPhoto, SCREEN_WIDTH, SCREEN_HEIGHT)

  // Zoom and pan gestures
  const { animatedZoomStyle, composedGestures, resetZoom } = useTopoZoom({
    containerWidth: fullscreenWidth,
    containerHeight: fullscreenHeight,
  })

  // Calculate scale factors for route lines
  const origW = currentPhoto?.originalWidth || currentPhoto?.width || 1350
  const origH = currentPhoto?.originalHeight || currentPhoto?.height || 900
  const fullscreenScaleX = fullscreenWidth / origW
  const fullscreenScaleY = fullscreenHeight / origH

  // Handle photo change with zoom reset
  const handlePhotoChange = (index: number) => {
    resetZoom()
    onPhotoChange(index)
  }

  // Handle close with zoom reset
  const handleClose = () => {
    resetZoom()
    onClose()
  }

  if (!currentPhoto) return null

  // Find selected route for info display
  const selectedLine = currentPhoto.routeLines?.find(
    (l) => l.routeId === selectedRouteId,
  )
  const infoColor = selectedRouteColor || selectedLine?.color

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black items-center justify-center">
          {/* Close button */}
          <TouchableOpacity
            className="absolute top-12 right-4 z-50 bg-black/60 w-10 h-10 rounded-full items-center justify-center"
            onPress={handleClose}
          >
            <CloseIcon size={24} color="#fff" />
          </TouchableOpacity>

          {/* Photo counter */}
          <TopoPhotoBadges
            currentIndex={selectedPhotoIndex + 1}
            totalPhotos={photos.length}
            isFullscreen
          />

          {/* Zoom level indicator */}
          <View className="absolute top-12 left-1/2 -translate-x-8 z-50 bg-black/60 px-3 py-1.5 rounded-full">
            <Text className="text-white text-xs font-semibold">
              Pellizca para zoom
            </Text>
          </View>

          {/* Selected route info */}
          {selectedRouteId && selectedLine && (
            <View className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 px-4 py-2 rounded-full">
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: infoColor,
                  }}
                />
                <Text className="text-white text-sm font-semibold">
                  {selectedLine.topoNumber}. {selectedLine.routeName}
                </Text>
              </View>
            </View>
          )}

          {/* Zoomable image container */}
          <GestureDetector gesture={composedGestures}>
            <Animated.View
              style={[
                {
                  width: fullscreenWidth,
                  height: fullscreenHeight,
                  position: 'relative',
                },
                animatedZoomStyle,
              ]}
            >
              <Image
                source={{ uri: currentPhoto.fullImageUrl }}
                style={{
                  width: fullscreenWidth,
                  height: fullscreenHeight,
                }}
                resizeMode="contain"
              />

              {/* SVG overlay for route lines in fullscreen */}
              {currentPhoto.routeLines && (
                <TopoRouteOverlay
                  routeLines={currentPhoto.routeLines}
                  width={fullscreenWidth}
                  height={fullscreenHeight}
                  scaleX={fullscreenScaleX}
                  scaleY={fullscreenScaleY}
                  selectedRouteId={selectedRouteId}
                  selectedRouteExternalId={selectedRouteExternalId}
                  selectedRouteColor={selectedRouteColor}
                  onRoutePress={onRoutePress}
                />
              )}

              {/* Route number labels in fullscreen */}
              {currentPhoto.routeLines && (
                <TopoRouteLabels
                  routeLines={currentPhoto.routeLines}
                  scaleX={fullscreenScaleX}
                  scaleY={fullscreenScaleY}
                  selectedRouteId={selectedRouteId}
                  selectedRouteExternalId={selectedRouteExternalId}
                  selectedRouteColor={selectedRouteColor}
                  onRoutePress={onRoutePress}
                  isFullscreen
                />
              )}
            </Animated.View>
          </GestureDetector>

          {/* Navigation arrows for multiple photos */}
          {hasMultiplePhotos && (
            <TopoNavigationArrows
              showPrevious={selectedPhotoIndex > 0}
              showNext={selectedPhotoIndex < photos.length - 1}
              onPrevious={() => handlePhotoChange(selectedPhotoIndex - 1)}
              onNext={() => handlePhotoChange(selectedPhotoIndex + 1)}
              isFullscreen
            />
          )}

          {/* Thumbnail strip at bottom */}
          {hasMultiplePhotos && (
            <View className="absolute bottom-8 left-0 right-0">
              <TopoThumbnailStrip
                photos={photos}
                selectedIndex={selectedPhotoIndex}
                onThumbnailPress={handlePhotoChange}
                isFullscreen
              />
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  )
}

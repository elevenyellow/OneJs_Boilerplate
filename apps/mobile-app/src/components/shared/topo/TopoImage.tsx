import {
  View,
  Image,
  TouchableOpacity,
  Text,
  Animated as RNAnimated,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  ImageOutlineIcon,
  InformationCircleOutlineIcon,
  ExpandOutlineIcon,
} from '@/components/shared/icons'
import type { SectorPhotoWithAreasDto } from '@/types/api'
import { TopoRouteOverlay } from './TopoRouteOverlay'
import { TopoRouteLabels } from './TopoRouteLabels'
import { TopoPhotoBadges } from './TopoPhotoBadges'
import { TopoNavigationArrows } from './TopoNavigationArrows'
import { calculateDisplayDimensions } from './utils'
import { SCREEN_WIDTH, IMAGE_HEIGHT } from './constants'
import type { LegacyTopoMarker } from './types'
import { TopoLegacyMarkers } from './TopoLegacyMarkers'

interface TopoImageProps {
  /**
   * Current photo to display
   */
  currentPhoto?: SectorPhotoWithAreasDto

  /**
   * Fallback image URL when no topo photos available
   */
  fallbackImageUrl?: string

  /**
   * Whether this is a fallback (non-topo) image
   */
  isFallbackImage: boolean

  /**
   * Legacy markers (deprecated)
   */
  legacyMarkers?: LegacyTopoMarker[]

  /**
   * Animated translateX value for swipe feedback
   */
  translateX: RNAnimated.Value

  /**
   * Fade animation value for photo transitions
   */
  fadeAnim: RNAnimated.Value

  /**
   * Pan responder handlers for swipe gestures
   */
  panHandlers: object

  /**
   * Current photo index
   */
  selectedPhotoIndex: number

  /**
   * Total number of photos
   */
  totalPhotos: number

  /**
   * Whether there are multiple photos
   */
  hasMultiplePhotos: boolean

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
   * Callback when image is pressed
   */
  onImagePress: () => void

  /**
   * Callback when route is pressed
   */
  onRoutePress?: (routeId: string) => void

  /**
   * Callback when previous button is pressed
   */
  onPrevious: () => void

  /**
   * Callback when next button is pressed
   */
  onNext: () => void

  /**
   * Callback when fullscreen button is pressed
   */
  onFullscreenPress: () => void

  /**
   * Callback when legend button is pressed
   */
  onLegendPress: () => void
}

/**
 * Main topo image component with route overlays and controls
 */
export function TopoImage({
  currentPhoto,
  fallbackImageUrl,
  isFallbackImage,
  legacyMarkers,
  translateX,
  fadeAnim,
  panHandlers,
  selectedPhotoIndex,
  totalPhotos,
  hasMultiplePhotos,
  selectedRouteId,
  selectedRouteExternalId,
  selectedRouteColor,
  onImagePress,
  onRoutePress,
  onPrevious,
  onNext,
  onFullscreenPress,
  onLegendPress,
}: TopoImageProps) {
  const { t } = useTranslation()
  const currentPhotoUrl = currentPhoto?.fullImageUrl || fallbackImageUrl || ''
  const { width, height, scaleX, scaleY } =
    calculateDisplayDimensions(currentPhoto)
  const displayHeight = currentPhoto ? height : IMAGE_HEIGHT
  const routeCount = currentPhoto?.routeLines?.length || 0

  return (
    <RNAnimated.View style={{ transform: [{ translateX }] }} {...panHandlers}>
      <View className="relative">
        {/* Animated container for photo and overlays with fade transition */}
        <RNAnimated.View style={{ opacity: fadeAnim }}>
          {/* Main topo image */}
          <TouchableOpacity activeOpacity={1} onPress={onImagePress}>
            <Image
              source={{ uri: currentPhotoUrl }}
              style={{
                width: SCREEN_WIDTH,
                height: displayHeight,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>

          {/* Fallback image overlay - when no topo photos available */}
          {isFallbackImage && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <View className="bg-black/70 px-4 py-3 rounded-xl items-center max-w-[80%]">
                <View style={{ marginBottom: 8 }}>
                  <ImageOutlineIcon size={32} color="#fff" />
                </View>
                <Text className="text-white text-sm font-semibold text-center">
                  {t('sector.generalSectorPhoto')}
                </Text>
                <Text className="text-white/70 text-xs text-center mt-1">
                  {t('sector.noTopoAvailable')}
                </Text>
              </View>
            </View>
          )}

          {/* SVG overlay for route lines */}
          {currentPhoto?.routeLines && (
            <TopoRouteOverlay
              routeLines={currentPhoto.routeLines}
              width={width}
              height={displayHeight}
              scaleX={scaleX}
              scaleY={scaleY}
              selectedRouteId={selectedRouteId}
              selectedRouteExternalId={selectedRouteExternalId}
              selectedRouteColor={selectedRouteColor}
              onRoutePress={onRoutePress}
            />
          )}

          {/* Route number labels */}
          {currentPhoto?.routeLines && (
            <TopoRouteLabels
              routeLines={currentPhoto.routeLines}
              scaleX={scaleX}
              scaleY={scaleY}
              selectedRouteId={selectedRouteId}
              selectedRouteExternalId={selectedRouteExternalId}
              selectedRouteColor={selectedRouteColor}
              onRoutePress={onRoutePress}
            />
          )}

          {/* Legacy markers (backwards compatibility) */}
          {!currentPhoto &&
            !isFallbackImage &&
            legacyMarkers &&
            legacyMarkers.length > 0 && (
              <TopoLegacyMarkers
                markers={legacyMarkers}
                selectedRouteId={selectedRouteId}
                onRoutePress={onRoutePress}
              />
            )}
        </RNAnimated.View>

        {/* Photo badges */}
        <TopoPhotoBadges
          currentIndex={selectedPhotoIndex + 1}
          totalPhotos={totalPhotos}
          routeCount={routeCount}
        />

        {/* Navigation arrows */}
        {hasMultiplePhotos && (
          <TopoNavigationArrows
            showPrevious={selectedPhotoIndex > 0}
            showNext={selectedPhotoIndex < totalPhotos - 1}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        )}

        {/* Action buttons */}
        <View className="absolute bottom-3 right-3 gap-2">
          {/* Info button - Show routes legend */}
          {routeCount > 0 && (
            <TouchableOpacity
              className="bg-black/60 w-10 h-10 rounded-full items-center justify-center"
              onPress={onLegendPress}
            >
              <InformationCircleOutlineIcon size={22} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Fullscreen button */}
          <TouchableOpacity
            className="bg-black/60 w-10 h-10 rounded-full items-center justify-center"
            onPress={onFullscreenPress}
          >
            <ExpandOutlineIcon size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </RNAnimated.View>
  )
}

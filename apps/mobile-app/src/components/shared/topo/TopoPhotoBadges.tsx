import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  ImagesOutlineIcon,
  GitBranchOutlineIcon,
} from '@/components/shared/icons'

interface TopoPhotoBadgesProps {
  /**
   * Current photo index (1-based for display)
   */
  currentIndex: number

  /**
   * Total number of photos
   */
  totalPhotos: number

  /**
   * Number of routes in current photo
   */
  routeCount?: number

  /**
   * Whether in fullscreen mode (different styling)
   */
  isFullscreen?: boolean
}

/**
 * Photo counter and route count badges
 */
export function TopoPhotoBadges({
  currentIndex,
  totalPhotos,
  routeCount,
  isFullscreen = false,
}: TopoPhotoBadgesProps) {
  const { t } = useTranslation()
  const showPhotoCounter = totalPhotos > 1
  const showRouteCount = routeCount !== undefined && routeCount > 0

  if (!showPhotoCounter && !showRouteCount) {
    return null
  }

  return (
    <>
      {/* Photo counter badge (top-left) */}
      {showPhotoCounter && (
        <View
          className={`absolute ${isFullscreen ? 'top-12 left-4' : 'top-3 left-3'} bg-black/60 px-2.5 py-1 rounded-full flex-row items-center`}
          style={{ gap: 4, zIndex: 50 }}
        >
          <ImagesOutlineIcon size={isFullscreen ? 16 : 14} color="#fff" />
          <Text
            className={`text-white ${isFullscreen ? 'text-sm' : 'text-xs'} font-semibold`}
          >
            {currentIndex}/{totalPhotos}
          </Text>
        </View>
      )}

      {/* Route count badge (top-right) - only for topo photos */}
      {showRouteCount && !isFullscreen && (
        <View
          className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-full flex-row items-center"
          style={{ gap: 4 }}
        >
          <GitBranchOutlineIcon size={14} color="#fff" />
          <Text className="text-white text-xs font-semibold">
            {t('sector.routesCountBadge', { count: routeCount })}
          </Text>
        </View>
      )}
    </>
  )
}

import { View, Image, TouchableOpacity, ScrollView, Text } from 'react-native'
import type { SectorPhotoWithAreasDto } from '@/types/api'
import { THUMBNAIL_SIZE, THUMBNAIL_SPACING } from './constants'
import { colors } from '@/theme/colors'

interface TopoThumbnailStripProps {
  /**
   * Array of photos to display as thumbnails
   */
  photos: SectorPhotoWithAreasDto[]

  /**
   * Currently selected photo index
   */
  selectedIndex: number

  /**
   * Callback when a thumbnail is pressed
   */
  onThumbnailPress: (index: number) => void

  /**
   * Whether to show in fullscreen mode (larger thumbnails)
   */
  isFullscreen?: boolean
}

/**
 * Horizontal thumbnail strip for photo navigation
 */
export function TopoThumbnailStrip({
  photos,
  selectedIndex,
  onThumbnailPress,
  isFullscreen = false,
}: TopoThumbnailStripProps) {
  const thumbnailSize = isFullscreen ? 64 : THUMBNAIL_SIZE

  return (
    <View className={isFullscreen ? '' : 'bg-card/50 py-1.5'}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: isFullscreen ? 16 : 8,
          gap: THUMBNAIL_SPACING,
          justifyContent: isFullscreen ? 'center' : 'flex-start',
          flexGrow: isFullscreen ? 1 : 0,
        }}
      >
        {photos.map((photo, index) => {
          const isActive = index === selectedIndex
          const routeCount = photo.routeLines?.length || 0

          return (
            <TouchableOpacity
              key={photo.id}
              onPress={() => onThumbnailPress(index)}
              activeOpacity={0.8}
              style={{
                marginRight: index < photos.length - 1 ? THUMBNAIL_SPACING : 0,
              }}
            >
              <View
                className={`relative rounded-lg overflow-hidden ${
                  isActive
                    ? isFullscreen
                      ? 'border-2 border-green-500'
                      : 'border-2 border-accent'
                    : 'border border-border'
                }`}
                style={{
                  width: thumbnailSize,
                  height: thumbnailSize,
                  borderColor:
                    isActive && isFullscreen ? colors.grade.easy : undefined,
                }}
              >
                <Image
                  source={{ uri: photo.thumbnailUrl || photo.fullImageUrl }}
                  style={{
                    width: thumbnailSize,
                    height: thumbnailSize,
                  }}
                  resizeMode="cover"
                />

                {/* Route count badge on thumbnail */}
                {routeCount > 0 && !isFullscreen && (
                  <View className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded">
                    <Text className="text-white text-[10px] font-bold">
                      {routeCount}
                    </Text>
                  </View>
                )}

                {/* Active indicator overlay */}
                {isActive && (
                  <View
                    className="absolute inset-0"
                    style={{
                      backgroundColor: isFullscreen
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(20, 184, 166, 0.2)',
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

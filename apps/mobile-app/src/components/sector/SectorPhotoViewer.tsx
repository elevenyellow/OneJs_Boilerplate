import { View, Dimensions, TouchableOpacity } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { ScanOutlineIcon, LayersOutlineIcon } from '@/components/shared/icons'
import { haptics } from '@/services/haptics'
import { OptimizedImage } from '@/components/shared/OptimizedImage'
import type { SectorPhotoWithAreas, SectorAreaAnnotation } from '@/types/api'
import { colors } from '@/theme/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.85

interface SectorPhotoViewerProps {
  photo: SectorPhotoWithAreas
  selectedSectorId?: string | null
  onSectorAreaPress?: (sectorId: string) => void
  onFullscreen?: () => void
  enableZoom?: boolean
}

/**
 * Viewer component for sector photos with interactive SVG areas
 * Displays a photo with sector areas marked as SVG paths
 * When a sector is selected, highlights its area
 */
export function SectorPhotoViewer({
  photo,
  selectedSectorId = null,
  onSectorAreaPress,
  onFullscreen,
  enableZoom = true,
}: SectorPhotoViewerProps) {
  return (
    <View className="relative">
      <OptimizedImage
        source={photo.fullImageUrl}
        width={SCREEN_WIDTH}
        height={IMAGE_HEIGHT}
        contentFit="cover"
        placeholder="skeleton"
      />

      <Svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SCREEN_WIDTH,
          height: IMAGE_HEIGHT,
        }}
        viewBox={`0 0 ${photo.originalWidth} ${photo.originalHeight}`}
      >
        {photo.sectorAreas.map((area: SectorAreaAnnotation) => {
          const isSelected = area.sectorId === selectedSectorId
          const fillColor = isSelected ? colors.selection.active : area.color
          const strokeColor = isSelected
            ? colors.selection.active
            : colors.text.primary
          const strokeWidth = isSelected ? 4 : 2

          return (
            <Path
              key={area.id}
              d={area.svgPath}
              fill={fillColor}
              fillOpacity={isSelected ? 0.4 : 0.2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              onPress={() => {
                if (area.sectorId && onSectorAreaPress) {
                  haptics.medium()
                  onSectorAreaPress(area.sectorId)
                }
              }}
            />
          )
        })}
      </Svg>

      {enableZoom && (
        <View className="absolute bottom-4 right-4 gap-2">
          <TouchableOpacity
            className="bg-card/80 w-10 h-10 rounded-lg items-center justify-center"
            onPress={onFullscreen}
          >
            <ScanOutlineIcon size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity className="bg-card/80 w-10 h-10 rounded-lg items-center justify-center">
            <LayersOutlineIcon size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

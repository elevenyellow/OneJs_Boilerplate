import { memo } from 'react'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useUnits } from '@/hooks/useUnits'
import { StarRating } from '../StarRating'
import {
  ResizeOutlineIcon,
  EllipseIcon,
  FlashIcon,
  LayersOutlineIcon,
} from '../icons'

interface RouteStatsRowProps {
  isClosed: boolean
  warningText?: string
  stars?: number
  height?: number
  bolts?: number
  primaryStyle?: string
  isMultiPitch?: boolean
  pitches?: number
}

/**
 * Displays the route stats row: stars, height, bolts, style, multi-pitch.
 * When route is closed, shows a red "closed" badge instead.
 */
export const RouteStatsRow = memo(function RouteStatsRow({
  isClosed,
  warningText,
  stars,
  height,
  bolts,
  primaryStyle,
  isMultiPitch,
  pitches,
}: RouteStatsRowProps) {
  const { t } = useTranslation()
  const { formatHeight } = useUnits()

  if (isClosed) {
    return (
      <View className="flex-row items-center mt-1 flex-wrap">
        <View className="bg-red-500/20 px-2 py-1 rounded">
          <Text className="text-red-400 text-xs">
            {warningText || t('route.closed')}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-row items-center mt-1 flex-wrap">
      {/* Stars */}
      {stars != null && stars > 0 && (
        <StarRating rating={stars} maxStars={3} size={12} />
      )}

      {/* Height */}
      {height != null && (
        <View className="flex-row items-center ml-2">
          <ResizeOutlineIcon />
          <Text className="text-gray-400 text-xs ml-0.5">
            {formatHeight(height)}
          </Text>
        </View>
      )}

      {/* Bolts */}
      {bolts != null && bolts > 0 && (
        <View className="flex-row items-center ml-2">
          <EllipseIcon />
          <Text className="text-gray-400 text-xs ml-0.5">{bolts}</Text>
        </View>
      )}

      {/* Style */}
      {primaryStyle && primaryStyle !== 'UNKNOWN' && (
        <View className="flex-row items-center ml-2">
          <FlashIcon />
          <Text className="text-gray-400 text-xs ml-0.5">{primaryStyle}</Text>
        </View>
      )}

      {/* Multi-pitch indicator */}
      {isMultiPitch && (
        <View className="flex-row items-center ml-2">
          <LayersOutlineIcon />
          <Text className="text-gray-400 text-xs ml-0.5">{pitches}L</Text>
        </View>
      )}
    </View>
  )
})

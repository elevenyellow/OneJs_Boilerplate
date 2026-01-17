import { View, Text } from 'react-native'
import { memo } from 'react'
import { StarIcon } from './icons'
import { colors } from '@/theme/colors'

interface QualityBadgeProps {
  /** Quality rating (0-3 scale) */
  rating?: number
  /** Compact mode (smaller size) */
  compact?: boolean
}

/**
 * Quality badge component showing star rating
 * Displays quality rating from 0-3 stars
 */
export const QualityBadge = memo(function QualityBadge({
  rating = 0,
  compact = false,
}: QualityBadgeProps) {
  if (rating === 0) return null

  const stars = Math.round(rating)
  const iconSize = compact ? 10 : 12

  return (
    <View className="flex-row items-center bg-grade-medium/20 px-2 py-1 rounded">
      {Array.from({ length: stars }).map((_, i) => (
        <StarIcon key={i} size={iconSize} color={colors.grade.medium} filled />
      ))}
      {compact && (
        <Text className="text-xs ml-1" style={{ color: colors.grade.medium }}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  )
})

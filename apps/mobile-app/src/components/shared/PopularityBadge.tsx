import { View, Text } from 'react-native'
import { memo } from 'react'
import { TrendingUpOutlineIcon } from './icons'
import { colors } from '@/theme/colors'

interface PopularityBadgeProps {
  /** Popularity score (0-3 scale) */
  score?: number
  /** Compact mode (smaller size) */
  compact?: boolean
}

/**
 * Popularity badge component showing trending indicator
 * Displays popularity score from 0-3
 */
export const PopularityBadge = memo(function PopularityBadge({
  score = 0,
  compact = false,
}: PopularityBadgeProps) {
  if (score === 0) return null

  const iconSize = compact ? 12 : 14
  const textSize = compact ? 'text-xs' : 'text-sm'

  // Color based on popularity level
  const color =
    score >= 2.5
      ? colors.status.success
      : score >= 2.0
        ? colors.accent.DEFAULT
        : colors.grade.medium

  return (
    <View
      className="flex-row items-center px-2 py-1 rounded"
      style={{ backgroundColor: `${color}20` }}
    >
      <TrendingUpOutlineIcon size={iconSize} color={color} />
      <Text className={`${textSize} ml-1 font-semibold`} style={{ color }}>
        {score.toFixed(1)}
      </Text>
    </View>
  )
})

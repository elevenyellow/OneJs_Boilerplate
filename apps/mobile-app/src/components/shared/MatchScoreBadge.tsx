import { View, Text } from 'react-native'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatMatchScore, getMatchScoreColor } from '@/utils/cragHelpers'

interface MatchScoreBadgeProps {
  totalScore?: number
  compact?: boolean
  /** Show as stars instead of percentage */
  showAsStars?: boolean
}

/**
 * Badge showing match score as percentage or stars
 */
export const MatchScoreBadge = memo(function MatchScoreBadge({
  totalScore,
  compact = false,
  showAsStars = false,
}: MatchScoreBadgeProps) {
  const { t } = useTranslation()

  if (totalScore === undefined || totalScore === null) return null

  const scoreColor = getMatchScoreColor(totalScore)
  const scoreText = formatMatchScore(totalScore)

  if (showAsStars) {
    // Convert 0-1 score to 0-3 stars
    const stars = Math.round(totalScore * 3)
    const fullStars = '⭐'.repeat(stars)
    const emptyStars = '☆'.repeat(3 - stars)

    return (
      <View className="flex-row items-center">
        <Text className="text-sm" style={{ color: scoreColor }}>
          {fullStars}
        </Text>
        <Text className="text-sm text-gray-600">{emptyStars}</Text>
      </View>
    )
  }

  if (compact) {
    return (
      <View
        className="flex-row items-center px-2 py-1 rounded"
        style={{ backgroundColor: `${scoreColor}20` }}
      >
        <Text className="text-xs font-bold" style={{ color: scoreColor }}>
          {scoreText}
        </Text>
      </View>
    )
  }

  return (
    <View
      className="flex-row items-center bg-background/50 px-2 py-1 rounded"
      style={{
        borderWidth: 1,
        borderColor: scoreColor,
      }}
    >
      <Text
        className="text-xs font-semibold mr-1"
        style={{ color: scoreColor }}
      >
        {scoreText}
      </Text>
      <Text className="text-xs text-gray-400">{t('crag.match')}</Text>
    </View>
  )
})

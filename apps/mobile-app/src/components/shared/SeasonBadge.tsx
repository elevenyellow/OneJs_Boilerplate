import { View, Text } from 'react-native'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { isInOptimalSeason, formatSeasonalityRange } from '@/utils/cragHelpers'
import { colors } from '@/theme/colors'
import { LeafOutlineIcon, BanOutlineIcon } from '@/components/shared/icons'

interface SeasonBadgeProps {
  seasonality?: number[]
  compact?: boolean
  /** Show only the icon without text label */
  iconOnly?: boolean
}

/**
 * Badge showing if crag is in optimal season
 * Shows green leaf icon "In Season" or gray ban icon "Off Season"
 * Plus the optimal months range when compact=false
 */
export const SeasonBadge = memo(function SeasonBadge({
  seasonality,
  compact = false,
  iconOnly = false,
}: SeasonBadgeProps) {
  const { t } = useTranslation()

  if (!seasonality || seasonality.length === 0) return null

  const inSeason = isInOptimalSeason(seasonality)
  const monthsRange = formatSeasonalityRange(seasonality)

  const SeasonIcon = inSeason ? LeafOutlineIcon : BanOutlineIcon
  const iconColor = inSeason ? colors.status.success : colors.text.muted

  // Icon-only mode for compact list view with legend
  if (iconOnly) {
    return (
      <View
        className="items-center justify-center px-1.5 py-1 rounded"
        style={{
          backgroundColor: inSeason
            ? `${colors.status.success}20`
            : `${colors.text.muted}20`,
        }}
      >
        <SeasonIcon size={14} color={iconColor} />
      </View>
    )
  }

  if (compact) {
    return (
      <View
        className="flex-row items-center px-2 py-1 rounded"
        style={{
          backgroundColor: inSeason
            ? `${colors.status.success}20`
            : `${colors.text.muted}20`,
        }}
      >
        <SeasonIcon size={12} color={iconColor} />
        <Text
          className="text-xs font-medium ml-1"
          style={{
            color: inSeason ? colors.status.success : colors.text.muted,
          }}
        >
          {t(inSeason ? 'crag.inSeason' : 'crag.offSeason')}
        </Text>
      </View>
    )
  }

  return (
    <View
      className="flex-row items-center bg-background/50 px-2 py-1 rounded"
      style={{
        borderWidth: 1,
        borderColor: inSeason ? colors.status.success : colors.border.muted,
      }}
    >
      <SeasonIcon size={14} color={iconColor} />
      <View className="ml-1">
        <Text
          className="text-xs font-medium"
          style={{
            color: inSeason ? colors.status.success : colors.text.muted,
          }}
        >
          {t(inSeason ? 'crag.inSeason' : 'crag.offSeason')}
        </Text>
        {monthsRange && (
          <Text className="text-[10px]" style={{ color: colors.text.muted }}>
            {monthsRange}
          </Text>
        )}
      </View>
    </View>
  )
})

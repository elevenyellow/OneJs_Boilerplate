import { memo } from 'react'
import { View, Text } from 'react-native'
import { CheckIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'

interface RouteGradeBadgeProps {
  gradeLabel: string
  gradeColor: string
  gradeStyle?: string
  displayNumber?: string
  /** Number of times this route has been climbed. Shows checkmark if 1, counter if >1 */
  ascentCount?: number
}

/**
 * Displays the route grade badge with topo number overlay.
 * Shows ascent indicator (checkmark or counter) if the route has been climbed.
 */
export const RouteGradeBadge = memo(function RouteGradeBadge({
  gradeLabel,
  gradeColor,
  gradeStyle,
  displayNumber,
  ascentCount,
}: RouteGradeBadgeProps) {
  const showAscentIndicator = ascentCount !== undefined && ascentCount > 0

  return (
    <View
      className="w-14 h-14 rounded-xl items-center justify-center mr-3"
      style={{ backgroundColor: `${gradeColor}20` }}
    >
      {displayNumber && (
        <View
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: gradeColor }}
        >
          <Text className="text-white text-xs font-bold">{displayNumber}</Text>
        </View>
      )}
      {showAscentIndicator && (
        <View
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
          style={{
            backgroundColor:
              ascentCount === 1
                ? `${colors.grade.easy}80`
                : colors.accent.DEFAULT,
          }}
        >
          {ascentCount === 1 ? (
            <CheckIcon size={12} color={colors.text.primary} />
          ) : (
            <Text className="text-white text-xs font-bold">{ascentCount}</Text>
          )}
        </View>
      )}
      <Text className="text-lg font-bold" style={{ color: gradeColor }}>
        {gradeLabel}
      </Text>
      {gradeStyle && (
        <Text className="text-gray-500 text-[10px] uppercase">
          {gradeStyle}
        </Text>
      )}
    </View>
  )
})

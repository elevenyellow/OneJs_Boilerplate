import { View, Text } from 'react-native'
import { memo } from 'react'
import { getClimbingStyleInfo } from '@/utils/cragHelpers'

interface ClimbingStyleBadgeProps {
  type?: string
  subType?: string
  compact?: boolean
  /** Show only the icon without text label */
  iconOnly?: boolean
}

/**
 * Badge showing climbing style (Sport, Trad, Boulder, etc.)
 */
export const ClimbingStyleBadge = memo(function ClimbingStyleBadge({
  type,
  subType,
  compact = false,
  iconOnly = false,
}: ClimbingStyleBadgeProps) {
  const styleInfo = getClimbingStyleInfo(type, subType)

  if (!styleInfo) return null

  // Icon-only mode for compact list view with legend
  if (iconOnly) {
    return (
      <View
        className="items-center justify-center px-1.5 py-1 rounded"
        style={{ backgroundColor: `${styleInfo.color}20` }}
      >
        <Text style={{ fontSize: 14 }}>{styleInfo.icon}</Text>
      </View>
    )
  }

  if (compact) {
    return (
      <View
        className="flex-row items-center px-2 py-1 rounded"
        style={{ backgroundColor: `${styleInfo.color}20` }}
      >
        <Text className="text-xs mr-1">{styleInfo.icon}</Text>
        <Text
          className="text-xs font-semibold"
          style={{ color: styleInfo.color }}
        >
          {styleInfo.label.toUpperCase()}
        </Text>
      </View>
    )
  }

  return (
    <View
      className="flex-row items-center bg-background/50 px-2 py-1 rounded"
      style={{
        borderWidth: 1,
        borderColor: styleInfo.color,
      }}
    >
      <Text className="text-xs mr-1">{styleInfo.icon}</Text>
      <Text className="text-xs font-medium" style={{ color: styleInfo.color }}>
        {styleInfo.label}
      </Text>
    </View>
  )
})

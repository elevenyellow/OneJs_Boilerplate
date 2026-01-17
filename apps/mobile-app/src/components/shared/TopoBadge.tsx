import { View, Text } from 'react-native'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { colors } from '@/theme/colors'
import { MapOutlineIcon } from '@/components/shared/icons'

interface TopoBadgeProps {
  hasTopo?: boolean
  compact?: boolean
  /** Show only the icon without text label */
  iconOnly?: boolean
}

/**
 * Badge showing if topo is available
 * Uses map icon to indicate route diagrams/topos are available
 */
export const TopoBadge = memo(function TopoBadge({
  hasTopo,
  compact = false,
  iconOnly = false,
}: TopoBadgeProps) {
  const { t } = useTranslation()

  if (!hasTopo) return null

  // Icon-only mode for compact list view with legend
  if (iconOnly) {
    return (
      <View
        className="items-center justify-center px-1.5 py-1 rounded"
        style={{ backgroundColor: `${colors.accent.DEFAULT}20` }}
      >
        <MapOutlineIcon size={14} color={colors.accent.DEFAULT} />
      </View>
    )
  }

  if (compact) {
    return (
      <View
        className="flex-row items-center px-2 py-1 rounded"
        style={{ backgroundColor: `${colors.accent.DEFAULT}20` }}
      >
        <MapOutlineIcon size={12} color={colors.accent.DEFAULT} />
        <Text
          className="text-xs font-semibold ml-1"
          style={{ color: colors.accent.DEFAULT }}
        >
          {t('crag.topo').toUpperCase()}
        </Text>
      </View>
    )
  }

  return (
    <View
      className="flex-row items-center bg-background/50 px-2 py-1 rounded"
      style={{
        borderWidth: 1,
        borderColor: colors.accent.DEFAULT,
      }}
    >
      <MapOutlineIcon size={14} color={colors.accent.DEFAULT} />
      <Text
        className="text-xs font-medium ml-1"
        style={{ color: colors.accent.DEFAULT }}
      >
        {t('crag.topo')}
      </Text>
    </View>
  )
})

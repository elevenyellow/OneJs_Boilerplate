import { memo } from 'react'
import type { ComponentType } from 'react'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useUnits } from '@/hooks/useUnits'
import { colors } from '@/theme/colors'
import { WarningIcon, ConstructIcon } from '../icons'

type IconComponent = ComponentType<{ size?: number; color?: string }>

interface RouteWarningBadgesProps {
  showProtection: boolean
  protectionIcon: IconComponent
  protectionColor: string
  boltSpacing?: number
  hasWarning?: boolean
  warningText?: string
  needsMaintenanceReview?: boolean
  equipmentAgeYears?: number
}

/**
 * Displays the route protection and warning badges row.
 */
export const RouteWarningBadges = memo(function RouteWarningBadges({
  showProtection,
  protectionIcon: ProtectionIcon,
  protectionColor,
  boltSpacing,
  hasWarning,
  warningText,
  needsMaintenanceReview,
  equipmentAgeYears,
}: RouteWarningBadgesProps) {
  const { t } = useTranslation()
  const { formatHeight } = useUnits()

  if (!showProtection && !hasWarning && !needsMaintenanceReview) {
    return null
  }

  return (
    <View className="flex-row items-center mt-2 flex-wrap gap-1">
      {/* Protection badge */}
      {showProtection && (
        <View
          className="p-1 rounded-full flex-row items-center gap-1"
          style={{ backgroundColor: `${protectionColor}20` }}
        >
          <ProtectionIcon size={14} color={protectionColor} />
          {boltSpacing != null && (
            <Text
              className="text-xs font-medium pr-1"
              style={{ color: protectionColor }}
            >
              {formatHeight(boltSpacing, { decimals: 1 })}
            </Text>
          )}
        </View>
      )}

      {/* Warning icon with text from DB */}
      {hasWarning && (
        <View className="bg-amber-500/20 px-2 py-1 rounded-full flex-row items-center gap-1">
          <WarningIcon size={14} color={colors.status.warning} />
          <Text className="text-amber-500 text-xs" numberOfLines={1}>
            {warningText
              ?.replace(/^Warning\s*/i, '')
              .replace(/Fixed Gear:\s*/i, '')
              .trim() || t('route.danger')}
          </Text>
        </View>
      )}

      {/* Maintenance warning */}
      {needsMaintenanceReview && (
        <View className="bg-orange-500/20 p-1 rounded-full flex-row items-center gap-1">
          <ConstructIcon size={14} color={colors.orange.DEFAULT} />
          <Text className="text-orange-400 text-xs pr-1">
            {t('route.yearsOld', { years: equipmentAgeYears })}
          </Text>
        </View>
      )}
    </View>
  )
})

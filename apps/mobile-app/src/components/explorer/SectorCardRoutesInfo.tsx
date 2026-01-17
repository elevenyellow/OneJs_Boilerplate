import { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { LayersOutlineIcon, NavigateIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import { haptics } from '@/services/haptics'

interface SectorCardRoutesInfoProps {
  /** Total number of routes in the sector */
  routeCount: number
  /** Grade range display string (e.g., "5c - 7a") */
  gradeRange: string
  /** Callback when navigation button is pressed (opens GPS navigator) */
  onNavigatePress?: () => void
}

/**
 * Routes information row with badge and GPS navigation button.
 * Shows route count, grade range, and a button to open external navigation.
 */
export const SectorCardRoutesInfo = memo(function SectorCardRoutesInfo({
  routeCount,
  gradeRange,
  onNavigatePress,
}: SectorCardRoutesInfoProps) {
  const { t } = useTranslation()

  const handleNavigatePress = useCallback(() => {
    haptics.light()
    onNavigatePress?.()
  }, [onNavigatePress])

  return (
    <View className="flex-row items-center justify-between mt-3">
      {/* Routes Badge */}
      <View className="flex-row items-center bg-card-elevated px-3 py-2 rounded-full">
        <LayersOutlineIcon size={16} color={colors.accent.DEFAULT} />
        <Text className="text-white text-sm font-medium ml-2">
          {t('explorer.routesWithGradeRange', {
            count: routeCount,
            gradeRange,
          })}
        </Text>
      </View>

      {/* GPS Navigation Button */}
      <TouchableOpacity
        onPress={handleNavigatePress}
        activeOpacity={0.7}
        disabled={!onNavigatePress}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          onNavigatePress ? 'bg-accent' : 'bg-card-elevated'
        }`}
      >
        <NavigateIcon
          size={20}
          color={onNavigatePress ? colors.bg.primary : colors.text.muted}
        />
      </TouchableOpacity>
    </View>
  )
})

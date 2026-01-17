import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  CompassOutlineIcon,
  WalkOutlineIcon,
  ResizeOutlineIcon,
  BarChartOutlineIcon,
} from '@/components/shared/icons'
import { useUnits } from '@/hooks/useUnits'
import { usePreferences } from '@/contexts/PreferencesContext'
import { formatGradeRangeFromBands, type GradeSystem } from '@/utils/grades'
import { colors } from '@/theme/colors'

interface SectorConditionsRowProps {
  aspectLabel: string | null
  walkInTimeLabel: string | null
  averageHeight: number | null
  // Grade range as gradeBand indices - converted to display internally
  minGradeBand: number | null
  maxGradeBand: number | null
  climbingStyle: string | null
}

export function SectorConditionsRow({
  aspectLabel,
  walkInTimeLabel,
  averageHeight,
  minGradeBand,
  maxGradeBand,
  climbingStyle,
}: SectorConditionsRowProps) {
  const { t } = useTranslation()
  const { formatHeight } = useUnits()
  const { preferences } = usePreferences()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem
  const iconColor = colors.accent.DEFAULT

  // Convert gradeBand to display string
  const gradeRange = formatGradeRangeFromBands(
    minGradeBand,
    maxGradeBand,
    gradeSystem,
  )

  return (
    <View className="flex-row justify-around mt-4 pt-4 border-t border-border">
      {/* Orientation */}
      <View className="items-center">
        <CompassOutlineIcon size={20} color={iconColor} />
        <Text className="text-gray-500 text-[9px] tracking-wider mt-1">
          {t('sector.labels.orientation')}
        </Text>
        <Text className="text-white text-xs font-semibold mt-0.5">
          {aspectLabel || '-'}
        </Text>
      </View>

      {/* Walk-in time */}
      <View className="items-center">
        <WalkOutlineIcon size={20} color={iconColor} />
        <Text className="text-gray-500 text-[9px] tracking-wider mt-1">
          {t('sector.labels.approach')}
        </Text>
        <Text className="text-white text-xs font-semibold mt-0.5">
          {walkInTimeLabel || '-'}
        </Text>
      </View>

      {/* Height */}
      <View className="items-center">
        <ResizeOutlineIcon size={20} color={iconColor} />
        <Text className="text-gray-500 text-[9px] tracking-wider mt-1">
          {t('sector.labels.height')}
        </Text>
        <Text className="text-white text-xs font-semibold mt-0.5">
          {averageHeight ? formatHeight(averageHeight) : '-'}
        </Text>
      </View>

      {/* Difficulty / Grade range with style */}
      <View className="items-center">
        <BarChartOutlineIcon size={20} color={iconColor} />
        <Text className="text-gray-500 text-[9px] tracking-wider mt-1">
          {t('sector.labels.difficulty')}
        </Text>
        <Text className="text-white text-xs font-semibold mt-0.5">
          {gradeRange || '-'}
          {climbingStyle && (
            <Text className="text-gray-500 text-[10px] font-medium">
              {'\n'}
              {climbingStyle}
            </Text>
          )}
        </Text>
      </View>
    </View>
  )
}

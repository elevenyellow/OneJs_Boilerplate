import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { GradeBar } from './GradeBar'
import { GradeLegendItem } from './GradeLegendItem'
import type { GradeDistributionItem } from '../types'

interface GradeDistributionCardProps {
  distribution: GradeDistributionItem[]
  month: string
}

export function GradeDistributionCard({
  distribution,
  month,
}: GradeDistributionCardProps) {
  const { t } = useTranslation()
  const maxCount = Math.max(...distribution.map((d) => d.count))

  return (
    <View className="bg-card rounded-2xl p-4 mx-4 mt-4">
      <Text className="text-white font-semibold text-sm mb-16 uppercase">
        {t('performance.distribution.title')}
      </Text>

      {/* Bars */}
      <View className="flex-row items-end h-24 mb-4">
        {distribution.map((item) => (
          <GradeBar
            key={item.label}
            count={item.count}
            maxCount={maxCount}
            color={item.color}
          />
        ))}
      </View>

      {/* Legend */}
      <View className="flex-row border-t border-border pt-3">
        {distribution.map((item) => (
          <GradeLegendItem
            key={item.label}
            color={item.color}
            label={item.label}
          />
        ))}
      </View>

      {/* Footer */}
      <Text className="text-gray-500 text-xs text-center mt-4 italic">
        {t('performance.distribution.footer', { month })}
      </Text>
    </View>
  )
}

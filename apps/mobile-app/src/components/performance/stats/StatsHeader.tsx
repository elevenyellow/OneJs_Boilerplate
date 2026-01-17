import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

interface StatsHeaderProps {
  monthLabel: string
  comparisonPercentage: number
  comparisonMonthLabel: string
}

export function StatsHeader({
  monthLabel,
  comparisonPercentage,
  comparisonMonthLabel,
}: StatsHeaderProps) {
  const { t } = useTranslation()

  const isPositive = comparisonPercentage >= 0
  const percentageText = isPositive
    ? `+${comparisonPercentage}%`
    : `${comparisonPercentage}%`

  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-white font-semibold text-sm uppercase">
        {t('performance.stats.title', { month: monthLabel })}
      </Text>
      <View className="bg-accent/20 px-3 py-1 rounded-full">
        <Text className="text-accent text-xs font-bold">
          {percentageText} VS {comparisonMonthLabel.toUpperCase()}
        </Text>
      </View>
    </View>
  )
}

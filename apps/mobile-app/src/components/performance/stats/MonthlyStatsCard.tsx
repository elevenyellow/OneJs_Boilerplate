import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { StatItem } from './StatItem'
import { StatsHeader } from './StatsHeader'
import type { MonthlyStats } from '../types'

interface MonthlyStatsCardProps {
  stats: MonthlyStats
  monthLabel: string
  comparisonMonthLabel: string
}

export function MonthlyStatsCard({
  stats,
  monthLabel,
  comparisonMonthLabel,
}: MonthlyStatsCardProps) {
  const { t } = useTranslation()

  return (
    <View className="bg-card rounded-2xl p-4 mx-4 mt-4">
      <StatsHeader
        monthLabel={monthLabel}
        comparisonPercentage={stats.comparisonPercentage}
        comparisonMonthLabel={comparisonMonthLabel}
      />

      <View className="flex-row">
        <StatItem
          value={stats.totalRoutes}
          label={t('performance.stats.totalRoutes')}
        />
        <StatItem
          value={stats.maxGrade}
          label={t('performance.stats.maxGrade')}
          valueColor={stats.maxGradeColor}
        />
        <StatItem
          value={stats.daysOutdoor}
          label={t('performance.stats.daysOutdoor')}
        />
      </View>
    </View>
  )
}

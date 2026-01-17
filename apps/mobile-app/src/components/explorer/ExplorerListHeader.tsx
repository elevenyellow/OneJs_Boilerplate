import { View, Text } from 'react-native'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FiltersBar } from './FiltersBar'
import { OrderingChip } from './OrderingChip'
import { BadgesLegend } from '@/components/shared/BadgesLegend'
import { useUnits } from '@/hooks/useUnits'
import { usePreferences } from '@/contexts/PreferencesContext'
import { GradeConverter, type GradeSystem } from '@climb-zone/grades'
import type { ExplorerSearchParams, SortOption } from './types'

interface ExplorerListHeaderProps {
  searchParams: ExplorerSearchParams
  onFilterChange: (updates: Partial<ExplorerSearchParams>) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

function ExplorerListHeaderComponent({
  searchParams,
  onFilterChange,
  sortBy,
  onSortChange,
}: ExplorerListHeaderProps) {
  const { t } = useTranslation()
  const { formatDistance } = useUnits()
  const { preferences } = usePreferences()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem

  const minGrade =
    GradeConverter.fromIndex(searchParams.minGradeBand ?? 24, gradeSystem) ??
    '6a'
  const maxGrade =
    GradeConverter.fromIndex(searchParams.maxGradeBand ?? 32, gradeSystem) ??
    '7b'

  return (
    <View className="mb-4">
      {/* Filter chips - tap to cycle through options */}
      <View className="py-2">
        <FiltersBar
          searchParams={searchParams}
          onFilterChange={onFilterChange}
          size="sm"
        />
      </View>

      {/* Sort, legend, and summary row */}
      <View className="px-4 py-2 flex-row items-center justify-between">
        <Text className="text-gray-400 text-xs flex-1">
          {t('explorer.searchSummary', {
            radius: formatDistance(searchParams.radiusKm ?? 50),
            minGrade,
            maxGrade,
          })}
        </Text>
        <View className="flex-row items-center gap-2">
          <BadgesLegend />
          <OrderingChip
            currentSort={sortBy}
            onSortChange={onSortChange}
            size="sm"
          />
        </View>
      </View>
    </View>
  )
}

// Memoized to prevent unnecessary re-renders during data fetching
export const ExplorerListHeader = memo(ExplorerListHeaderComponent)

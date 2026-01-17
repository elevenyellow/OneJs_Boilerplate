import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { FilterChips } from '@/components/shared/FilterChips'
import { SectorInfoBadges } from './SectorInfoBadges'
import type { SectorDto } from '@/types/api'

interface GradeFilterOption {
  id: string
  label: string
  color?: string
}

interface SectorRoutesListHeaderProps {
  sector: SectorDto | null
  gradeFilters: GradeFilterOption[]
  selectedFilter: string
  filteredCount: number
  onFilterChange: (filterId: string) => void
}

export function SectorRoutesListHeader({
  sector,
  gradeFilters,
  selectedFilter,
  filteredCount,
  onFilterChange,
}: SectorRoutesListHeaderProps) {
  const { t } = useTranslation()

  return (
    <View>
      {/* Sector Info Badges */}
      {sector && (
        <SectorInfoBadges
          aspectLabel={sector.aspectLabel}
          walkInTimeLabel={sector.walkInTimeLabel}
          averageHeight={sector.averageHeight}
          familyLabel={sector.familyLabel}
          tagFamily={sector.tagFamily}
          crowdsLabel={sector.crowdsLabel}
          starRating={sector.starRating}
        />
      )}

      {/* Grade Filter Chips */}
      <View className="py-2">
        <FilterChips
          options={gradeFilters}
          selectedId={selectedFilter}
          onSelect={onFilterChange}
        />
      </View>

      {/* Route Count Header */}
      <View className="px-4 mb-2">
        <Text className="text-gray-400 font-bold uppercase tracking-wider text-xs">
          {t('sector.routeCount', { count: filteredCount })}
          {selectedFilter !== 'all' && ` ${t('sector.filtered')}`}
        </Text>
      </View>
    </View>
  )
}

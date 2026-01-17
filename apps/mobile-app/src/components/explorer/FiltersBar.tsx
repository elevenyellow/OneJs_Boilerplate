/**
 * Filters Bar
 *
 * A horizontal scrollable bar showing current search filters as tappable chips.
 * Tapping a chip cycles through its available options and updates the search.
 */

import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { useUnits } from '@/hooks/useUnits'
import { usePreferences } from '@/contexts/PreferencesContext'
import { GradeConverter, type GradeSystem } from '@climb-zone/grades'
import type { ExplorerSearchParams } from './types'

interface FiltersBarProps {
  /**
   * Current search parameters
   */
  searchParams: ExplorerSearchParams

  /**
   * Callback when a filter value changes
   */
  onFilterChange: (updates: Partial<ExplorerSearchParams>) => void

  /**
   * Size variant for the chips
   */
  size?: 'sm' | 'md'
}

// Predefined radius options (in km)
const RADIUS_OPTIONS = [10, 25, 50, 75, 100, 150, 200]

// Quality options
const QUALITY_OPTIONS = [0, 1, 2, 3]

// Exposure options
const EXPOSURE_OPTIONS = ['any', 'sun', 'shade'] as const

function FiltersBarComponent({
  searchParams,
  onFilterChange,
  size = 'sm',
}: FiltersBarProps) {
  const { t } = useTranslation()
  const { formatDistance } = useUnits()
  const { preferences } = usePreferences()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem

  const chipHeight = size === 'sm' ? 'h-8' : 'h-10'
  const chipPadding = size === 'sm' ? 'px-3' : 'px-4'
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'
  const iconSize = size === 'sm' ? 14 : 16

  // Cycle to next radius value
  const handleRadiusCycle = useCallback(() => {
    const currentRadius = searchParams.radiusKm ?? 50
    const currentIndex = RADIUS_OPTIONS.findIndex((r) => r >= currentRadius)
    const nextIndex =
      currentIndex === -1 || currentIndex >= RADIUS_OPTIONS.length - 1
        ? 0
        : currentIndex + 1
    onFilterChange({ radiusKm: RADIUS_OPTIONS[nextIndex] })
  }, [searchParams.radiusKm, onFilterChange])

  // Cycle to next quality value
  const handleQualityCycle = useCallback(() => {
    const currentQuality = searchParams.minQualityRating ?? 0
    const nextQuality =
      currentQuality >= QUALITY_OPTIONS.length - 1 ? 0 : currentQuality + 1
    onFilterChange({ minQualityRating: nextQuality })
  }, [searchParams.minQualityRating, onFilterChange])

  // Cycle to next exposure value
  const handleExposureCycle = useCallback(() => {
    const currentExposure = searchParams.exposurePreference ?? 'any'
    const currentIndex = EXPOSURE_OPTIONS.indexOf(currentExposure)
    const nextIndex =
      currentIndex >= EXPOSURE_OPTIONS.length - 1 ? 0 : currentIndex + 1
    onFilterChange({ exposurePreference: EXPOSURE_OPTIONS[nextIndex] })
  }, [searchParams.exposurePreference, onFilterChange])

  // Format grade for display
  const formatGrade = useCallback(
    (gradeIndex: number) => {
      return (
        GradeConverter.fromIndex(gradeIndex, gradeSystem) ?? `${gradeIndex}`
      )
    },
    [gradeSystem],
  )

  // Get quality display
  const qualityDisplay = useMemo(() => {
    const quality = searchParams.minQualityRating ?? 0
    if (quality === 0) return t('filters.quality.anyQuality')
    return '★'.repeat(quality)
  }, [searchParams.minQualityRating, t])

  // Get exposure display
  const exposureDisplay = useMemo(() => {
    const exposure = searchParams.exposurePreference ?? 'any'
    switch (exposure) {
      case 'sun':
        return t('filters.exposure.sunShort')
      case 'shade':
        return t('filters.exposure.shadeShort')
      default:
        return t('filters.exposure.any')
    }
  }, [searchParams.exposurePreference, t])

  // Get exposure icon
  const exposureIcon = useMemo(() => {
    const exposure = searchParams.exposurePreference ?? 'any'
    switch (exposure) {
      case 'sun':
        return 'sunny'
      case 'shade':
        return 'cloudy'
      default:
        return 'partly-sunny'
    }
  }, [searchParams.exposurePreference])

  // Get grade range display
  const gradeRangeDisplay = useMemo(() => {
    const minGrade = searchParams.minGradeBand ?? 24
    const maxGrade = searchParams.maxGradeBand ?? 32
    return `${formatGrade(minGrade)} - ${formatGrade(maxGrade)}`
  }, [searchParams.minGradeBand, searchParams.maxGradeBand, formatGrade])

  // Check if any styles are selected
  const stylesDisplay = useMemo(() => {
    const styles = searchParams.climbingStyles ?? []
    if (styles.length === 0) return t('filters.style.any')
    if (styles.length === 1) return t(`filters.style.${styles[0]}`)
    return `${styles.length} ${t('filters.style.selected')}`
  }, [searchParams.climbingStyles, t])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {/* Radius chip */}
      <TouchableOpacity
        onPress={handleRadiusCycle}
        className={`${chipHeight} ${chipPadding} bg-card border border-border rounded-full flex-row items-center`}
        activeOpacity={0.7}
      >
        <Ionicons
          name="locate-outline"
          size={iconSize}
          color={colors.icon.info}
        />
        <Text className={`${textSize} text-white font-medium ml-1.5`}>
          {formatDistance(searchParams.radiusKm ?? 50)}
        </Text>
      </TouchableOpacity>

      {/* Quality chip */}
      <TouchableOpacity
        onPress={handleQualityCycle}
        className={`${chipHeight} ${chipPadding} bg-card border border-border rounded-full flex-row items-center`}
        activeOpacity={0.7}
      >
        <Ionicons
          name="star"
          size={iconSize}
          color={
            (searchParams.minQualityRating ?? 0) > 0
              ? colors.grade.medium
              : colors.text.muted
          }
        />
        <Text className={`${textSize} text-white font-medium ml-1.5`}>
          {qualityDisplay}
        </Text>
      </TouchableOpacity>

      {/* Exposure chip */}
      <TouchableOpacity
        onPress={handleExposureCycle}
        className={`${chipHeight} ${chipPadding} bg-card border border-border rounded-full flex-row items-center`}
        activeOpacity={0.7}
      >
        <Ionicons
          name={exposureIcon as keyof typeof Ionicons.glyphMap}
          size={iconSize}
          color={
            searchParams.exposurePreference === 'sun'
              ? colors.grade.medium
              : searchParams.exposurePreference === 'shade'
                ? colors.icon.info
                : colors.text.muted
          }
        />
        <Text className={`${textSize} text-white font-medium ml-1.5`}>
          {exposureDisplay}
        </Text>
      </TouchableOpacity>

      {/* Grade range chip (opens modal, shows current value) */}
      <View
        className={`${chipHeight} ${chipPadding} bg-card border border-border rounded-full flex-row items-center opacity-80`}
      >
        <Ionicons
          name="speedometer-outline"
          size={iconSize}
          color={colors.accent.DEFAULT}
        />
        <Text className={`${textSize} text-gray-400 font-medium ml-1.5`}>
          {gradeRangeDisplay}
        </Text>
      </View>

      {/* Climbing styles chip (shows count, opens modal) */}
      {(searchParams.climbingStyles?.length ?? 0) > 0 && (
        <View
          className={`${chipHeight} ${chipPadding} bg-accent/20 border border-accent/40 rounded-full flex-row items-center`}
        >
          <Ionicons
            name="fitness-outline"
            size={iconSize}
            color={colors.accent.DEFAULT}
          />
          <Text className={`${textSize} text-accent font-medium ml-1.5`}>
            {stylesDisplay}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

// Memoized to prevent unnecessary re-renders when parent updates
export const FiltersBar = memo(FiltersBarComponent)

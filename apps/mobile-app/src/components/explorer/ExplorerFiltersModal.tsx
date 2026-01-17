import { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import {
  SettingSection,
  SettingSlider,
  SettingChips,
  type ChipOption,
} from '@/components/settings'
import { colors } from '@/theme/colors'
import { usePreferences } from '@/contexts/PreferencesContext'
import { useUnits } from '@/hooks/useUnits'
import { GradeConverter, type GradeSystem } from '@climb-zone/grades'
import type { SearchFiltersValues, ExplorerSearchParams } from './types'
import { GRADE_CATEGORY_THRESHOLDS } from '@/utils/grades'

interface ExplorerFiltersModalProps {
  visible: boolean
  onClose: () => void
  searchParams: ExplorerSearchParams
  onApply: (filters: SearchFiltersValues) => void
}

// Default gradeBand values: 24 = 6a, 32 = 7b (French)
const DEFAULT_MIN_GRADE_BAND = GRADE_CATEGORY_THRESHOLDS.medium.min // 24
const DEFAULT_MAX_GRADE_BAND = 32 // 7b

const CLIMBING_STYLES = [
  'sport',
  'trad',
  'boulder',
  'aid',
  'alpine',
  'mixed',
  'ice',
  'topRope',
] as const

export function ExplorerFiltersModal({
  visible,
  onClose,
  searchParams,
  onApply,
}: ExplorerFiltersModalProps) {
  const { t } = useTranslation()
  const { preferences } = usePreferences()
  const { formatDistance } = useUnits()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem

  const [tempRadiusKm, setTempRadiusKm] = useState(searchParams.radiusKm ?? 50)
  const [tempMinGradeBand, setTempMinGradeBand] = useState(
    searchParams.minGradeBand ?? DEFAULT_MIN_GRADE_BAND,
  )
  const [tempMaxGradeBand, setTempMaxGradeBand] = useState(
    searchParams.maxGradeBand ?? DEFAULT_MAX_GRADE_BAND,
  )
  const [tempExposure, setTempExposure] = useState<'sun' | 'shade' | 'any'>(
    searchParams.exposurePreference ?? 'any',
  )
  const [tempStyles, setTempStyles] = useState<string[]>(
    searchParams.climbingStyles ?? [],
  )
  const [tempMinQuality, setTempMinQuality] = useState<number>(
    searchParams.minQualityRating ?? 0,
  )
  const [scrollEnabled, setScrollEnabled] = useState(true)

  // Disable scroll while sliding to prevent gesture conflicts
  const handleSlidingStart = useCallback(() => setScrollEnabled(false), [])
  const handleSlidingEnd = useCallback(() => setScrollEnabled(true), [])

  // Handle min grade change - adjust max if min exceeds it
  const handleMinGradeChange = useCallback(
    (value: number) => {
      setTempMinGradeBand(value)
      // If min exceeds max, adjust max to match min
      if (value > tempMaxGradeBand) {
        setTempMaxGradeBand(value)
      }
    },
    [tempMaxGradeBand],
  )

  // Handle max grade change - adjust min if max goes below it
  const handleMaxGradeChange = useCallback(
    (value: number) => {
      setTempMaxGradeBand(value)
      // If max goes below min, adjust min to match max
      if (value < tempMinGradeBand) {
        setTempMinGradeBand(value)
      }
    },
    [tempMinGradeBand],
  )

  useEffect(() => {
    if (visible) {
      setTempRadiusKm(searchParams.radiusKm ?? 50)
      setTempMinGradeBand(searchParams.minGradeBand ?? DEFAULT_MIN_GRADE_BAND)
      setTempMaxGradeBand(searchParams.maxGradeBand ?? DEFAULT_MAX_GRADE_BAND)
      setTempExposure(searchParams.exposurePreference ?? 'any')
      setTempStyles(searchParams.climbingStyles ?? [])
      setTempMinQuality(searchParams.minQualityRating ?? 0)
    }
  }, [visible, searchParams])

  // Format radius value for display
  const formatRadiusValue = (value: number) => formatDistance(value)

  // Format grade value for display
  const formatGradeValue = (value: number) => {
    const grade = GradeConverter.fromIndex(value, gradeSystem)
    return grade ?? value.toString()
  }

  // Format quality value for display
  const formatQualityValue = (value: number) => {
    if (value === 0) return t('filters.quality.anyQuality')
    return '★'.repeat(value)
  }

  // Exposure options
  const exposureOptions = useMemo<ChipOption<'sun' | 'shade' | 'any'>[]>(
    () => [
      { id: 'any', label: t('filters.exposure.any') },
      {
        id: 'sun',
        label: t('filters.exposure.sun'),
        icon: (
          <Ionicons
            name="sunny"
            size={16}
            color={
              tempExposure === 'sun'
                ? colors.grade.medium
                : colors.text.secondary
            }
          />
        ),
      },
      {
        id: 'shade',
        label: t('filters.exposure.shade'),
        icon: (
          <Ionicons
            name="cloudy"
            size={16}
            color={
              tempExposure === 'shade'
                ? colors.icon.info
                : colors.text.secondary
            }
          />
        ),
      },
    ],
    [t, tempExposure],
  )

  // Climbing style options
  const styleOptions = useMemo<ChipOption<string>[]>(
    () =>
      CLIMBING_STYLES.map((style) => ({
        id: style,
        label: t(`filters.style.${style}`),
      })),
    [t],
  )

  const handleApply = () => {
    onApply({
      radiusKm: tempRadiusKm,
      minGradeBand: tempMinGradeBand,
      maxGradeBand: tempMaxGradeBand,
      exposurePreference: tempExposure,
      climbingStyles: tempStyles,
      minQualityRating: tempMinQuality,
    })
  }

  const handleClearAll = () => {
    setTempRadiusKm(50)
    setTempMinGradeBand(DEFAULT_MIN_GRADE_BAND)
    setTempMaxGradeBand(DEFAULT_MAX_GRADE_BAND)
    setTempExposure('any')
    setTempStyles([])
    setTempMinQuality(0)
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-surface">
        {/* Header */}
        <View className="pt-2 pb-3">
          <View className="items-center">
            <View className="w-10 h-1 bg-border rounded-full mb-3" />
          </View>
          <View className="flex-row items-center justify-between px-4">
            <TouchableOpacity
              onPress={onClose}
              className="py-2 px-3"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-gray-400 text-base">
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">
              {t('filters.searchFilters')}
            </Text>
            <View className="w-16" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Search Section */}
          <SettingSection title={t('filters.searchFilters')}>
            <SettingSlider
              label={t('filters.searchRadius')}
              value={tempRadiusKm}
              minimumValue={5}
              maximumValue={200}
              step={5}
              formatValue={formatRadiusValue}
              onValueChange={setTempRadiusKm}
              onSlidingStart={handleSlidingStart}
              onSlidingEnd={handleSlidingEnd}
            />
            <SettingSlider
              label={t('filters.minGrade')}
              value={tempMinGradeBand}
              minimumValue={10}
              maximumValue={46}
              step={1}
              formatValue={formatGradeValue}
              onValueChange={handleMinGradeChange}
              onSlidingStart={handleSlidingStart}
              onSlidingEnd={handleSlidingEnd}
            />
            <SettingSlider
              label={t('filters.maxGrade')}
              value={tempMaxGradeBand}
              minimumValue={10}
              maximumValue={46}
              step={1}
              formatValue={formatGradeValue}
              onValueChange={handleMaxGradeChange}
              onSlidingStart={handleSlidingStart}
              onSlidingEnd={handleSlidingEnd}
              isLast
            />
          </SettingSection>

          {/* Preferences Section */}
          <SettingSection title={t('filters.preferences')}>
            <SettingChips
              label={t('filters.exposure.title')}
              description={t('filters.exposure.description')}
              options={exposureOptions}
              value={tempExposure}
              onValueChange={(v) =>
                setTempExposure(v as 'sun' | 'shade' | 'any')
              }
              horizontal
            />
            <SettingChips
              label={t('filters.style.title')}
              options={styleOptions}
              value={tempStyles}
              onValueChange={(v) => setTempStyles(v as string[])}
              multiple
              horizontal
            />
            <SettingSlider
              label={t('filters.quality.title')}
              value={tempMinQuality}
              minimumValue={0}
              maximumValue={3}
              step={1}
              formatValue={formatQualityValue}
              onValueChange={setTempMinQuality}
              onSlidingStart={handleSlidingStart}
              onSlidingEnd={handleSlidingEnd}
              isLast
            />
          </SettingSection>

          {/* Clear All button */}
          <View className="px-4 mt-2">
            <TouchableOpacity
              onPress={handleClearAll}
              className="bg-card border border-border rounded-xl py-3 items-center"
              testID="clear-all-button"
            >
              <Text className="text-gray-300 text-base font-medium">
                {t('filters.clearAll')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Apply button */}
        <View className="px-4 pb-8 pt-2 bg-surface border-t border-border-muted">
          <TouchableOpacity
            onPress={handleApply}
            className="bg-accent rounded-xl py-3.5 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold">
              {t('filters.applyFilters')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

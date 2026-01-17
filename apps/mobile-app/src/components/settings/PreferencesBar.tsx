/**
 * Preferences Bar
 *
 * A horizontal scrollable bar showing user preferences as tappable chips.
 * Tapping a chip cycles through its available options.
 */

import { ScrollView } from 'react-native'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { SettingCycleChip, type CycleOption } from './SettingCycleChip'
import { usePreferences } from '@/contexts/PreferencesContext'
import { useUnits } from '@/hooks/useUnits'
import { colors } from '@/theme/colors'
import type {
  GradeSystemPreference,
  DistanceUnit,
  ClimbingDiscipline,
} from '@/types/preferences'

interface PreferencesBarProps {
  /**
   * Which preferences to show
   * @default ['gradeSystem', 'distanceUnit', 'discipline']
   */
  show?: Array<
    'gradeSystem' | 'distanceUnit' | 'discipline' | 'searchRadius' | 'quality'
  >

  /**
   * Size variant for the chips
   */
  size?: 'sm' | 'md'
}

export function PreferencesBar({
  show = ['gradeSystem', 'distanceUnit', 'discipline'],
  size = 'sm',
}: PreferencesBarProps) {
  const { t } = useTranslation()
  const { preferences, updatePreferences } = usePreferences()
  const { formatDistance } = useUnits()

  // Grade system options
  const gradeSystemOptions = useMemo<CycleOption<GradeSystemPreference>[]>(
    () => [
      { id: 'french', label: 'French', shortLabel: 'FR' },
      { id: 'yds', label: 'YDS', shortLabel: 'YDS' },
      { id: 'uiaa', label: 'UIAA', shortLabel: 'UIAA' },
      { id: 'british', label: 'British', shortLabel: 'UK' },
      { id: 'font', label: 'Font', shortLabel: 'Font' },
      { id: 'hueco', label: 'Hueco', shortLabel: 'V' },
    ],
    [],
  )

  // Distance unit options
  const distanceUnitOptions = useMemo<CycleOption<DistanceUnit>[]>(
    () => [
      {
        id: 'metric',
        label: t('options.distance.metric.label'),
        shortLabel: 'km',
      },
      {
        id: 'imperial',
        label: t('options.distance.imperial.label'),
        shortLabel: 'mi',
      },
    ],
    [t],
  )

  // Discipline options
  const disciplineOptions = useMemo<CycleOption<ClimbingDiscipline>[]>(
    () => [
      {
        id: 'all',
        label: t('options.discipline.all'),
        shortLabel: t('options.discipline.all'),
      },
      {
        id: 'sport',
        label: t('options.discipline.sport'),
        shortLabel: t('options.discipline.sport'),
      },
      {
        id: 'boulder',
        label: t('options.discipline.boulder'),
        shortLabel: 'Boulder',
      },
      { id: 'trad', label: t('options.discipline.trad'), shortLabel: 'Trad' },
      {
        id: 'multipitch',
        label: t('options.discipline.multipitch'),
        shortLabel: 'Multi',
      },
    ],
    [t],
  )

  // Search radius options (predefined steps)
  const radiusOptions = useMemo<CycleOption<string>[]>(
    () => [
      { id: '10', label: formatDistance(10), shortLabel: formatDistance(10) },
      { id: '25', label: formatDistance(25), shortLabel: formatDistance(25) },
      { id: '50', label: formatDistance(50), shortLabel: formatDistance(50) },
      {
        id: '100',
        label: formatDistance(100),
        shortLabel: formatDistance(100),
      },
    ],
    [formatDistance],
  )

  // Quality options
  const qualityOptions = useMemo<CycleOption<string>[]>(
    () => [
      { id: '0', label: t('filters.quality.anyQuality'), shortLabel: '★' },
      { id: '1', label: '★', shortLabel: '★' },
      { id: '2', label: '★★', shortLabel: '★★' },
      { id: '3', label: '★★★', shortLabel: '★★★' },
    ],
    [t],
  )

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {show.includes('gradeSystem') && (
        <SettingCycleChip
          icon={
            <Ionicons
              name="speedometer-outline"
              size={14}
              color={colors.accent.DEFAULT}
            />
          }
          options={gradeSystemOptions}
          value={preferences.gradeSystem}
          onValueChange={(value) => updatePreferences({ gradeSystem: value })}
          size={size}
        />
      )}

      {show.includes('distanceUnit') && (
        <SettingCycleChip
          icon={
            <Ionicons
              name="resize-outline"
              size={14}
              color={colors.grade.easy}
            />
          }
          options={distanceUnitOptions}
          value={preferences.distanceUnit}
          onValueChange={(value) => updatePreferences({ distanceUnit: value })}
          size={size}
        />
      )}

      {show.includes('discipline') && (
        <SettingCycleChip
          icon={
            <Ionicons
              name="fitness-outline"
              size={14}
              color={colors.grade.medium}
            />
          }
          options={disciplineOptions}
          value={preferences.defaultDiscipline}
          onValueChange={(value) =>
            updatePreferences({ defaultDiscipline: value })
          }
          size={size}
        />
      )}

      {show.includes('searchRadius') && (
        <SettingCycleChip
          icon={
            <Ionicons
              name="locate-outline"
              size={14}
              color={colors.icon.info}
            />
          }
          options={radiusOptions}
          value={String(preferences.defaultSearchRadiusKm)}
          onValueChange={(value) =>
            updatePreferences({ defaultSearchRadiusKm: Number(value) })
          }
          size={size}
        />
      )}

      {show.includes('quality') && (
        <SettingCycleChip
          icon={
            <Ionicons name="star-outline" size={14} color={colors.grade.hard} />
          }
          options={qualityOptions}
          value={String(preferences.defaultMinGrade ?? 0)}
          onValueChange={(value) =>
            updatePreferences({
              defaultMinGrade: Number(value) || null,
            })
          }
          size={size}
        />
      )}
    </ScrollView>
  )
}

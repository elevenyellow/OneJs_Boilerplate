/**
 * Settings Option Builders
 *
 * Functions that build localized option arrays for settings selectors.
 * Extracted from SettingsScreen for reusability and cleaner code.
 */

import type { SelectOption } from '@/components/settings'
import type {
  GradeSystemPreference,
  ClimbingDiscipline,
  DistanceUnit,
  HeightUnit,
  TemperatureUnit,
  LanguagePreference,
  ThemePreference,
  DownloadQuality,
} from '@/types/preferences'

/**
 * Translator function type for i18n
 */
type Translator = (key: string) => string

/**
 * Build grade system options with translations
 */
export function buildGradeSystemOptions(
  t: Translator,
): SelectOption<GradeSystemPreference>[] {
  return [
    {
      id: 'french',
      label: t('options.gradeSystem.french.label'),
      description: t('options.gradeSystem.french.description'),
    },
    {
      id: 'yds',
      label: t('options.gradeSystem.yds.label'),
      description: t('options.gradeSystem.yds.description'),
    },
    {
      id: 'uiaa',
      label: t('options.gradeSystem.uiaa.label'),
      description: t('options.gradeSystem.uiaa.description'),
    },
    {
      id: 'british',
      label: t('options.gradeSystem.british.label'),
      description: t('options.gradeSystem.british.description'),
    },
    {
      id: 'font',
      label: t('options.gradeSystem.font.label'),
      description: t('options.gradeSystem.font.description'),
    },
    {
      id: 'hueco',
      label: t('options.gradeSystem.hueco.label'),
      description: t('options.gradeSystem.hueco.description'),
    },
  ]
}

/**
 * Build climbing discipline options with translations
 */
export function buildDisciplineOptions(
  t: Translator,
): SelectOption<ClimbingDiscipline>[] {
  return [
    { id: 'all', label: t('options.discipline.all') },
    { id: 'sport', label: t('options.discipline.sport') },
    { id: 'boulder', label: t('options.discipline.boulder') },
    { id: 'trad', label: t('options.discipline.trad') },
    { id: 'multipitch', label: t('options.discipline.multipitch') },
  ]
}

/**
 * Build distance unit options with translations
 */
export function buildDistanceUnitOptions(
  t: Translator,
): SelectOption<DistanceUnit>[] {
  return [
    {
      id: 'metric',
      label: t('options.distance.metric.label'),
      description: t('options.distance.metric.description'),
    },
    {
      id: 'imperial',
      label: t('options.distance.imperial.label'),
      description: t('options.distance.imperial.description'),
    },
  ]
}

/**
 * Build height unit options with translations
 */
export function buildHeightUnitOptions(
  t: Translator,
): SelectOption<HeightUnit>[] {
  return [
    { id: 'meters', label: t('options.height.meters') },
    { id: 'feet', label: t('options.height.feet') },
  ]
}

/**
 * Build temperature unit options with translations
 */
export function buildTemperatureUnitOptions(
  t: Translator,
): SelectOption<TemperatureUnit>[] {
  return [
    { id: 'celsius', label: t('options.temperature.celsius') },
    { id: 'fahrenheit', label: t('options.temperature.fahrenheit') },
  ]
}

/**
 * Build language options with translations
 */
export function buildLanguageOptions(
  t: Translator,
): SelectOption<LanguagePreference>[] {
  return [
    { id: 'es', label: t('options.language.es') },
    { id: 'en', label: t('options.language.en') },
  ]
}

/**
 * Build theme options with translations
 */
export function buildThemeOptions(
  t: Translator,
): SelectOption<ThemePreference>[] {
  return [
    { id: 'dark', label: t('options.theme.dark') },
    { id: 'light', label: t('options.theme.light') },
    { id: 'system', label: t('options.theme.system') },
  ]
}

/**
 * Build download quality options with translations
 */
export function buildDownloadQualityOptions(
  t: Translator,
): SelectOption<DownloadQuality>[] {
  return [
    {
      id: 'low',
      label: t('options.downloadQuality.low.label'),
      description: t('options.downloadQuality.low.description'),
    },
    {
      id: 'medium',
      label: t('options.downloadQuality.medium.label'),
      description: t('options.downloadQuality.medium.description'),
    },
    {
      id: 'high',
      label: t('options.downloadQuality.high.label'),
      description: t('options.downloadQuality.high.description'),
    },
  ]
}

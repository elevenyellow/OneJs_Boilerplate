/**
 * Search Settings Section
 *
 * Settings section for search-related preferences:
 * default search radius, remember last search.
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { RadarOutlineIcon } from '@/components/shared'
import { useUnits } from '@/hooks/useUnits'
import { colors } from '@/theme/colors'
import type { UserPreferences, PartialPreferences } from '@/types/preferences'

import { SettingSection } from '../SettingSection'
import { SettingSlider } from '../SettingSlider'
import { SettingToggle } from '../SettingToggle'

interface SearchSettingsSectionProps {
  preferences: UserPreferences
  updatePreferences: (updates: PartialPreferences) => Promise<void>
  onSlidingStart: () => void
  onSlidingEnd: () => void
}

export function SearchSettingsSection({
  preferences,
  updatePreferences,
  onSlidingStart,
  onSlidingEnd,
}: SearchSettingsSectionProps) {
  const { t } = useTranslation()
  const { formatDistance } = useUnits()

  const formatRadiusValue = useMemo(
    () => (km: number) => formatDistance(km),
    [formatDistance],
  )

  const handleRadiusChange = useCallback(
    (value: number) => updatePreferences({ defaultSearchRadiusKm: value }),
    [updatePreferences],
  )

  const handleRememberSearchChange = useCallback(
    (value: boolean) => updatePreferences({ rememberLastSearch: value }),
    [updatePreferences],
  )

  return (
    <SettingSection
      title={t('settings.search.title')}
      icon={<RadarOutlineIcon size={16} color={colors.icon.info} />}
      iconColor={colors.icon.info}
    >
      <SettingSlider
        label={t('settings.search.defaultRadius')}
        value={preferences.defaultSearchRadiusKm}
        minimumValue={5}
        maximumValue={200}
        step={5}
        formatValue={formatRadiusValue}
        onValueChange={handleRadiusChange}
        onSlidingStart={onSlidingStart}
        onSlidingEnd={onSlidingEnd}
      />
      <SettingToggle
        label={t('settings.search.rememberLastSearch')}
        description={t('settings.search.rememberLastSearchDesc')}
        value={preferences.rememberLastSearch}
        onValueChange={handleRememberSearchChange}
        isLast
      />
    </SettingSection>
  )
}

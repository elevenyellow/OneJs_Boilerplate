/**
 * Units Settings Section
 *
 * Settings section for unit preferences:
 * distance, height, temperature.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SpeedometerOutlineIcon } from '@/components/shared'
import { colors } from '@/theme/colors'
import {
  buildDistanceUnitOptions,
  buildHeightUnitOptions,
  buildTemperatureUnitOptions,
} from '@/utils/settingsOptions'
import type { UserPreferences, PartialPreferences } from '@/types/preferences'

import { SettingSection } from '../SettingSection'
import { SettingSelect } from '../SettingSelect'

interface UnitsSettingsSectionProps {
  preferences: UserPreferences
  updatePreferences: (updates: PartialPreferences) => Promise<void>
}

export function UnitsSettingsSection({
  preferences,
  updatePreferences,
}: UnitsSettingsSectionProps) {
  const { t } = useTranslation()

  const distanceUnitOptions = useMemo(() => buildDistanceUnitOptions(t), [t])
  const heightUnitOptions = useMemo(() => buildHeightUnitOptions(t), [t])
  const temperatureUnitOptions = useMemo(
    () => buildTemperatureUnitOptions(t),
    [t],
  )

  return (
    <SettingSection
      title={t('settings.units.title')}
      icon={<SpeedometerOutlineIcon size={16} color={colors.grade.easy} />}
      iconColor={colors.grade.easy}
    >
      <SettingSelect
        label={t('settings.units.distance')}
        value={preferences.distanceUnit}
        options={distanceUnitOptions}
        onValueChange={(value) => updatePreferences({ distanceUnit: value })}
        modalTitle={t('settings.units.distance')}
      />
      <SettingSelect
        label={t('settings.units.height')}
        value={preferences.heightUnit}
        options={heightUnitOptions}
        onValueChange={(value) => updatePreferences({ heightUnit: value })}
        modalTitle={t('settings.units.height')}
      />
      <SettingSelect
        label={t('settings.units.temperature')}
        value={preferences.temperatureUnit}
        options={temperatureUnitOptions}
        onValueChange={(value) => updatePreferences({ temperatureUnit: value })}
        modalTitle={t('settings.units.temperature')}
        isLast
      />
    </SettingSection>
  )
}

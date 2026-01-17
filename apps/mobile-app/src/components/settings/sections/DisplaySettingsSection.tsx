/**
 * Display Settings Section
 *
 * Settings section for display preferences:
 * language, theme, compact route list, grade colors.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PhonePortraitOutlineIcon } from '@/components/shared'
import { colors } from '@/theme/colors'
import {
  buildLanguageOptions,
  buildThemeOptions,
} from '@/utils/settingsOptions'
import type { UserPreferences, PartialPreferences } from '@/types/preferences'

import { SettingSection } from '../SettingSection'
import { SettingSelect } from '../SettingSelect'
import { SettingToggle } from '../SettingToggle'

interface DisplaySettingsSectionProps {
  preferences: UserPreferences
  updatePreferences: (updates: PartialPreferences) => Promise<void>
}

export function DisplaySettingsSection({
  preferences,
  updatePreferences,
}: DisplaySettingsSectionProps) {
  const { t } = useTranslation()

  const languageOptions = useMemo(() => buildLanguageOptions(t), [t])
  const themeOptions = useMemo(() => buildThemeOptions(t), [t])

  return (
    <SettingSection
      title={t('settings.display.title')}
      icon={<PhonePortraitOutlineIcon size={16} color={colors.grade.extreme} />}
      iconColor={colors.grade.extreme}
    >
      <SettingSelect
        label={t('settings.display.language')}
        value={preferences.language}
        options={languageOptions}
        onValueChange={(value) => updatePreferences({ language: value })}
        modalTitle={t('settings.display.language')}
      />
      <SettingSelect
        label={t('settings.display.theme')}
        value={preferences.theme}
        options={themeOptions}
        onValueChange={(value) => updatePreferences({ theme: value })}
        modalTitle={t('settings.display.theme')}
      />
      <SettingToggle
        label={t('settings.display.compactRouteList')}
        description={t('settings.display.compactRouteListDesc')}
        value={preferences.compactRouteList}
        onValueChange={(value) =>
          updatePreferences({ compactRouteList: value })
        }
      />
      <SettingToggle
        label={t('settings.display.showGradeColors')}
        description={t('settings.display.showGradeColorsDesc')}
        value={preferences.showGradeColors}
        onValueChange={(value) => updatePreferences({ showGradeColors: value })}
        isLast
      />
    </SettingSection>
  )
}

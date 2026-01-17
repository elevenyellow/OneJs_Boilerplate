/**
 * Climbing Settings Section
 *
 * Settings section for climbing-related preferences:
 * grade system, discipline, boulder/aid grades display.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { BarbellOutlineIcon } from '@/components/shared'
import { colors } from '@/theme/colors'
import {
  buildGradeSystemOptions,
  buildDisciplineOptions,
} from '@/utils/settingsOptions'
import type { UserPreferences, PartialPreferences } from '@/types/preferences'

import { SettingSection } from '../SettingSection'
import { SettingSelect } from '../SettingSelect'
import { SettingToggle } from '../SettingToggle'

interface ClimbingSettingsSectionProps {
  preferences: UserPreferences
  updatePreferences: (updates: PartialPreferences) => Promise<void>
}

export function ClimbingSettingsSection({
  preferences,
  updatePreferences,
}: ClimbingSettingsSectionProps) {
  const { t } = useTranslation()

  const gradeSystemOptions = useMemo(() => buildGradeSystemOptions(t), [t])
  const disciplineOptions = useMemo(() => buildDisciplineOptions(t), [t])

  return (
    <SettingSection
      title={t('settings.climbing.title')}
      icon={<BarbellOutlineIcon size={16} color={colors.accent.DEFAULT} />}
      iconColor={colors.accent.DEFAULT}
    >
      <SettingSelect
        label={t('settings.climbing.gradeSystem')}
        value={preferences.gradeSystem}
        options={gradeSystemOptions}
        onValueChange={(value) => updatePreferences({ gradeSystem: value })}
        modalTitle={t('settings.climbing.gradeSystem')}
      />
      <SettingSelect
        label={t('settings.climbing.defaultDiscipline')}
        value={preferences.defaultDiscipline}
        options={disciplineOptions}
        onValueChange={(value) =>
          updatePreferences({ defaultDiscipline: value })
        }
        modalTitle={t('settings.climbing.defaultDiscipline')}
      />
      <SettingToggle
        label={t('settings.climbing.showBoulderGrades')}
        description={t('settings.climbing.showBoulderGradesDesc')}
        value={preferences.showBoulderGrades}
        onValueChange={(value) =>
          updatePreferences({ showBoulderGrades: value })
        }
      />
      <SettingToggle
        label={t('settings.climbing.showAidGrades')}
        description={t('settings.climbing.showAidGradesDesc')}
        value={preferences.showAidGrades}
        onValueChange={(value) => updatePreferences({ showAidGrades: value })}
        isLast
      />
    </SettingSection>
  )
}

/**
 * Safety Settings Section
 *
 * Settings section for safety preferences:
 * emergency contact, safety warnings, session logging.
 */

import { useTranslation } from 'react-i18next'

import { ShieldOutlineIcon } from '@/components/shared'
import { colors } from '@/theme/colors'
import type { UserPreferences, PartialPreferences } from '@/types/preferences'

import { SettingSection } from '../SettingSection'
import { SettingInput } from '../SettingInput'
import { SettingToggle } from '../SettingToggle'

interface SafetySettingsSectionProps {
  preferences: UserPreferences
  updatePreferences: (updates: PartialPreferences) => Promise<void>
}

export function SafetySettingsSection({
  preferences,
  updatePreferences,
}: SafetySettingsSectionProps) {
  const { t } = useTranslation()

  return (
    <SettingSection
      title={t('settings.safety.title')}
      icon={<ShieldOutlineIcon size={16} color={colors.status.warning} />}
      iconColor={colors.status.warning}
    >
      <SettingInput
        label={t('settings.safety.emergencyContact')}
        description={t('settings.safety.emergencyContactDesc')}
        value={preferences.emergencyContact}
        onValueChange={(value) =>
          updatePreferences({ emergencyContact: value })
        }
        placeholder="+1 555 123 4567"
        keyboardType="phone-pad"
        emptyText={t('settings.safety.notSet')}
      />
      <SettingToggle
        label={t('settings.safety.showWarnings')}
        description={t('settings.safety.showWarningsDesc')}
        value={preferences.showSafetyWarnings}
        onValueChange={(value) =>
          updatePreferences({ showSafetyWarnings: value })
        }
      />
      <SettingToggle
        label={t('settings.safety.logSessions')}
        description={t('settings.safety.logSessionsDesc')}
        value={preferences.logClimbingSessions}
        onValueChange={(value) =>
          updatePreferences({ logClimbingSessions: value })
        }
        isLast
      />
    </SettingSection>
  )
}

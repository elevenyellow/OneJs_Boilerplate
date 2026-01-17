/**
 * Notifications Settings Section
 *
 * Settings section for notification preferences:
 * weather alerts, new route alerts, condition alerts.
 */

import { useTranslation } from 'react-i18next'

import { NotificationsOutlineIcon } from '@/components/shared'
import { colors } from '@/theme/colors'
import type { UserPreferences, PartialPreferences } from '@/types/preferences'

import { SettingSection } from '../SettingSection'
import { SettingToggle } from '../SettingToggle'

interface NotificationsSettingsSectionProps {
  preferences: UserPreferences
  updatePreferences: (updates: PartialPreferences) => Promise<void>
}

export function NotificationsSettingsSection({
  preferences,
  updatePreferences,
}: NotificationsSettingsSectionProps) {
  const { t } = useTranslation()

  return (
    <SettingSection
      title={t('settings.notifications.title')}
      icon={<NotificationsOutlineIcon size={16} color={colors.grade.medium} />}
      iconColor={colors.grade.medium}
    >
      <SettingToggle
        label={t('settings.notifications.weatherAlerts')}
        description={t('settings.notifications.weatherAlertsDesc')}
        value={preferences.weatherAlerts}
        onValueChange={(value) => updatePreferences({ weatherAlerts: value })}
      />
      <SettingToggle
        label={t('settings.notifications.newRouteAlerts')}
        description={t('settings.notifications.newRouteAlertsDesc')}
        value={preferences.newRouteAlerts}
        onValueChange={(value) => updatePreferences({ newRouteAlerts: value })}
      />
      <SettingToggle
        label={t('settings.notifications.conditionAlerts')}
        description={t('settings.notifications.conditionAlertsDesc')}
        value={preferences.conditionAlerts}
        onValueChange={(value) => updatePreferences({ conditionAlerts: value })}
        isLast
      />
    </SettingSection>
  )
}

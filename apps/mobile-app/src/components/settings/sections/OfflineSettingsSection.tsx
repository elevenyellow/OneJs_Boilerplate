/**
 * Offline & Storage Settings Section
 *
 * Settings section for offline and storage preferences:
 * auto-download saved areas, download quality, wifi-only downloads.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { CloudDownloadOutlineIcon } from '@/components/shared'
import { colors } from '@/theme/colors'
import { buildDownloadQualityOptions } from '@/utils/settingsOptions'
import type { UserPreferences, PartialPreferences } from '@/types/preferences'

import { SettingSection } from '../SettingSection'
import { SettingSelect } from '../SettingSelect'
import { SettingToggle } from '../SettingToggle'

interface OfflineSettingsSectionProps {
  preferences: UserPreferences
  updatePreferences: (updates: PartialPreferences) => Promise<void>
}

export function OfflineSettingsSection({
  preferences,
  updatePreferences,
}: OfflineSettingsSectionProps) {
  const { t } = useTranslation()

  const downloadQualityOptions = useMemo(
    () => buildDownloadQualityOptions(t),
    [t],
  )

  return (
    <SettingSection
      title={t('settings.offline.title')}
      icon={<CloudDownloadOutlineIcon size={16} color={colors.icon.info} />}
      iconColor={colors.icon.info}
    >
      <SettingToggle
        label={t('settings.offline.autoDownloadSaved')}
        description={t('settings.offline.autoDownloadSavedDesc')}
        value={preferences.autoDownloadSaved}
        onValueChange={(value) =>
          updatePreferences({ autoDownloadSaved: value })
        }
      />
      <SettingSelect
        label={t('settings.offline.downloadQuality')}
        value={preferences.downloadQuality}
        options={downloadQualityOptions}
        onValueChange={(value) => updatePreferences({ downloadQuality: value })}
        modalTitle={t('settings.offline.downloadQuality')}
      />
      <SettingToggle
        label={t('settings.offline.wifiOnly')}
        description={t('settings.offline.wifiOnlyDesc')}
        value={preferences.wifiOnlyDownloads}
        onValueChange={(value) =>
          updatePreferences({ wifiOnlyDownloads: value })
        }
        isLast
      />
    </SettingSection>
  )
}

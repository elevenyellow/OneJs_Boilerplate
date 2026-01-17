/**
 * About Settings Section
 *
 * Settings section for app information:
 * version, beta status.
 */

import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

import { InformationCircleOutlineIcon } from '@/components/shared'
import { colors } from '@/theme/colors'

import { SettingSection } from '../SettingSection'

export function AboutSettingsSection() {
  const { t } = useTranslation()

  return (
    <SettingSection
      title={t('settings.about.title')}
      icon={
        <InformationCircleOutlineIcon size={16} color={colors.text.secondary} />
      }
      iconColor={colors.text.secondary}
    >
      <View className="px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base text-white">
            {t('settings.about.version')}
          </Text>
          <Text className="text-sm text-gray-500 mt-0.5">1.0.0</Text>
        </View>
        <View className="bg-accent/20 px-3 py-1 rounded-full">
          <Text className="text-accent text-xs font-medium">Beta</Text>
        </View>
      </View>
    </SettingSection>
  )
}

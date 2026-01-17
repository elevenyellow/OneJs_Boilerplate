/**
 * Settings Screen
 *
 * Main settings/preferences screen for the climbing app.
 * Organized into sections for climbing, units, display, notifications, etc.
 */

import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useCallback, useState } from 'react'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenHeader, TrashOutlineIcon } from '@/components/shared'
import {
  ClimbingSettingsSection,
  UnitsSettingsSection,
  SearchSettingsSection,
  DisplaySettingsSection,
  NotificationsSettingsSection,
  OfflineSettingsSection,
  SafetySettingsSection,
  AboutSettingsSection,
} from '@/components/settings'
import { usePreferences } from '@/contexts/PreferencesContext'
import { haptics } from '@/services/haptics'
import { colors } from '@/theme/colors'
import type { RootStackParamList } from '@/navigation/types'

// =============================================================================
// Types
// =============================================================================

interface SettingsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>
}

// =============================================================================
// Component
// =============================================================================

export function SettingsScreen(_props: SettingsScreenProps) {
  const { t } = useTranslation()
  const { preferences, updatePreferences, resetToDefaults, isLoading } =
    usePreferences()
  const [scrollEnabled, setScrollEnabled] = useState(true)

  // Disable scroll while sliding to prevent gesture conflicts
  const handleSlidingStart = useCallback(() => setScrollEnabled(false), [])
  const handleSlidingEnd = useCallback(() => setScrollEnabled(true), [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleResetToDefaults = useCallback(() => {
    haptics.warning()
    Alert.alert(
      t('settings.resetConfirmTitle'),
      t('settings.resetConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults()
            haptics.success()
          },
        },
      ],
    )
  }, [t, resetToDefaults])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScreenHeader title={t('settings.title')} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title={t('settings.title')}
        showBackButton={false}
        rightActions={null}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        <ClimbingSettingsSection
          preferences={preferences}
          updatePreferences={updatePreferences}
        />

        <UnitsSettingsSection
          preferences={preferences}
          updatePreferences={updatePreferences}
        />

        <SearchSettingsSection
          preferences={preferences}
          updatePreferences={updatePreferences}
          onSlidingStart={handleSlidingStart}
          onSlidingEnd={handleSlidingEnd}
        />

        <DisplaySettingsSection
          preferences={preferences}
          updatePreferences={updatePreferences}
        />

        <NotificationsSettingsSection
          preferences={preferences}
          updatePreferences={updatePreferences}
        />

        <OfflineSettingsSection
          preferences={preferences}
          updatePreferences={updatePreferences}
        />

        <SafetySettingsSection
          preferences={preferences}
          updatePreferences={updatePreferences}
        />

        <AboutSettingsSection />

        {/* Reset Button */}
        <View className="px-4 mt-4 mb-8">
          <TouchableOpacity
            onPress={handleResetToDefaults}
            className="bg-card rounded-xl py-4 flex-row items-center justify-center border border-border-muted"
            activeOpacity={0.7}
          >
            <TrashOutlineIcon size={18} color={colors.status.error} />
            <Text className="text-red-500 text-base font-medium ml-2">
              {t('settings.resetToDefaults')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

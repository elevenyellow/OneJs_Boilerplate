import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { haptics } from '@/services/haptics'
import { HelpCircleOutlineIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import type { TabType } from './types'

interface CragTabBarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onHelpPress?: () => void
}

interface TabConfig {
  id: TabType
  label: string
}

export function CragTabBar({
  activeTab,
  onTabChange,
  onHelpPress,
}: CragTabBarProps) {
  const { t } = useTranslation()

  const tabs: TabConfig[] = useMemo(
    () => [
      { id: 'routes', label: t('crag.tabs.routes') },
      { id: 'info', label: t('crag.tabs.info') },
      { id: 'directions', label: t('crag.tabs.directions') },
    ],
    [t],
  )

  return (
    <View className="flex-row items-center border-b border-border mt-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 py-3 items-center ${isActive ? 'border-b-2 border-accent' : ''}`}
            onPress={() => {
              haptics.light()
              onTabChange(tab.id)
            }}
          >
            <Text
              className={`text-sm font-medium ${isActive ? 'text-accent' : 'text-gray-500'}`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
      {/* Legend help button */}
      {onHelpPress && (
        <TouchableOpacity className="px-3 py-3" onPress={onHelpPress}>
          <HelpCircleOutlineIcon size={22} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  )
}

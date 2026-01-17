import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { ContentMode } from './types'

interface SectorContentTabsProps {
  activeTab: ContentMode
  onTabChange: (tab: ContentMode) => void
}

export function SectorContentTabs({
  activeTab,
  onTabChange,
}: SectorContentTabsProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-row border-b border-border bg-background">
      <TouchableOpacity
        className={`flex-1 py-3 items-center border-b-2 ${
          activeTab === 'subsectors' ? 'border-accent' : 'border-transparent'
        }`}
        onPress={() => onTabChange('subsectors')}
      >
        <Text
          className={`font-semibold ${
            activeTab === 'subsectors' ? 'text-accent' : 'text-muted-foreground'
          }`}
        >
          {t('sector.subsectors')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 py-3 items-center border-b-2 ${
          activeTab === 'routes' ? 'border-accent' : 'border-transparent'
        }`}
        onPress={() => onTabChange('routes')}
      >
        <Text
          className={`font-semibold ${
            activeTab === 'routes' ? 'text-accent' : 'text-muted-foreground'
          }`}
        >
          {t('sector.routesTab')}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

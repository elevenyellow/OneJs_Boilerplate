import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/services/haptics'
import { ListIcon, MapOutlineIcon } from './icons'
import { colors } from '@/theme/colors'

interface ViewToggleProps {
  activeView: 'list' | 'map'
  onToggle: (view: 'list' | 'map') => void
}

export function ViewToggle({ activeView, onToggle }: ViewToggleProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-row bg-card rounded-full p-1">
      <TouchableOpacity
        onPress={() => {
          haptics.selection()
          onToggle('list')
        }}
        className={`flex-row items-center px-4 py-2 rounded-full ${
          activeView === 'list' ? 'bg-accent' : ''
        }`}
      >
        <ListIcon
          size={16}
          color={activeView === 'list' ? '#000' : colors.text.secondary}
        />
        <Text
          className={`ml-2 text-sm font-medium ${
            activeView === 'list' ? 'text-black' : 'text-gray-400'
          }`}
        >
          {t('common.list')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          haptics.selection()
          onToggle('map')
        }}
        className={`flex-row items-center px-4 py-2 rounded-full ${
          activeView === 'map' ? 'bg-accent' : ''
        }`}
      >
        <MapOutlineIcon
          size={16}
          color={activeView === 'map' ? '#000' : colors.text.secondary}
        />
        <Text
          className={`ml-2 text-sm font-medium ${
            activeView === 'map' ? 'text-black' : 'text-gray-400'
          }`}
        >
          {t('common.map')}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

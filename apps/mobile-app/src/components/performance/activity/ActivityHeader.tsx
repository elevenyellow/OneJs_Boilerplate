import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '@/theme/colors'

interface ActivityHeaderProps {
  onViewAll?: () => void
}

export function ActivityHeader({ onViewAll }: ActivityHeaderProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-row justify-between items-center px-4 mb-3">
      <Text className="text-white font-semibold text-sm uppercase">
        {t('performance.activity.title')}
      </Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text
            style={{ color: colors.accent.DEFAULT }}
            className="text-sm font-medium"
          >
            {t('performance.activity.viewAll')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

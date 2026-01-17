import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { WarningIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'

interface LocationWarningBannerProps {
  errorType: 'permission' | 'disabled' | 'timeout' | null
}

export function LocationWarningBanner({
  errorType,
}: LocationWarningBannerProps) {
  const { t } = useTranslation()

  // Determine which message to show based on error type
  const getMessage = () => {
    switch (errorType) {
      case 'permission':
        return t('location.permissionDenied')
      case 'disabled':
        return t('location.servicesDisabled')
      case 'timeout':
        return t('location.locationTimeout')
      default:
        return t('location.locationRequired')
    }
  }

  return (
    <View className="flex-row items-center gap-2 bg-yellow-400/10 border-l-4 border-l-yellow-400 px-4 py-3 mx-4 mb-2 rounded">
      <WarningIcon size={14} color={colors.condition.sol} />
      <Text className="text-yellow-400 text-sm flex-1">{getMessage()}</Text>
    </View>
  )
}

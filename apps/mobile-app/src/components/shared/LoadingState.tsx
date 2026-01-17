import { Text, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ScreenStateWrapper } from './ScreenStateWrapper'
import { colors } from '@/theme/colors'
import type { ScreenStateNavigationProps } from '@/types/screen-state'

interface LoadingStateProps extends ScreenStateNavigationProps {
  title?: string
  message?: string
}

export function LoadingState({
  title,
  message,
  showBackButton = false,
  onBack,
  useFloatingBackButton = false,
}: LoadingStateProps) {
  const { t } = useTranslation()
  const displayMessage = message ?? t('common.loading')

  return (
    <ScreenStateWrapper
      title={title}
      showBackButton={showBackButton}
      onBack={onBack}
      useFloatingBackButton={useFloatingBackButton}
    >
      <ActivityIndicator size="large" color={colors.status.success} />
      <Text className="text-gray-400 mt-4">{displayMessage}</Text>
    </ScreenStateWrapper>
  )
}

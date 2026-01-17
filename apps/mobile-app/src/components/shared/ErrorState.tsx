import type { ReactNode } from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AlertCircleOutlineIcon } from './icons'
import { ScreenStateWrapper } from './ScreenStateWrapper'
import type { ScreenStateNavigationProps } from '@/types/screen-state'

interface ErrorStateProps extends ScreenStateNavigationProps {
  title?: string
  message: string
  actionLabel?: string
  onAction: () => void
  /**
   * Custom icon to display. Defaults to AlertCircleOutlineIcon
   */
  icon?: ReactNode
}

export function ErrorState({
  title,
  message,
  actionLabel,
  onAction,
  showBackButton = false,
  onBack,
  useFloatingBackButton = false,
  icon,
}: ErrorStateProps) {
  const { t } = useTranslation()
  const displayActionLabel = actionLabel ?? t('common.retry')

  // When using floating back button, we don't show header but may still want to display title
  const showTitleInContent = title && useFloatingBackButton

  return (
    <ScreenStateWrapper
      title={useFloatingBackButton ? undefined : title}
      showBackButton={showBackButton}
      onBack={onBack}
      useFloatingBackButton={useFloatingBackButton}
    >
      {icon ?? <AlertCircleOutlineIcon />}
      {showTitleInContent && (
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          {title}
        </Text>
      )}
      <Text className="text-gray-400 text-center mt-2">{message}</Text>
      <TouchableOpacity
        className="bg-green-500 px-6 py-3 rounded-lg mt-6"
        onPress={onAction}
      >
        <Text className="text-white font-semibold">{displayActionLabel}</Text>
      </TouchableOpacity>
    </ScreenStateWrapper>
  )
}

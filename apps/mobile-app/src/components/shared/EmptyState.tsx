import type { ReactNode } from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { SearchOutlineIcon } from './icons'
import { ScreenStateWrapper } from './ScreenStateWrapper'
import type { ScreenStateNavigationProps } from '@/types/screen-state'

interface EmptyStateProps
  extends Omit<ScreenStateNavigationProps, 'useFloatingBackButton'> {
  /**
   * Custom icon to display. Defaults to SearchOutlineIcon
   */
  icon?: ReactNode
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
  /**
   * If true, shows the ScreenHeader with headerTitle
   */
  showHeader?: boolean
  headerTitle?: string
  headerSubtitle?: string
  /**
   * If true, renders as a simple View instead of SafeAreaView (for inline usage)
   */
  inline?: boolean
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  showHeader = false,
  headerTitle,
  headerSubtitle,
  showBackButton = false,
  onBack,
  inline = false,
}: EmptyStateProps) {
  return (
    <ScreenStateWrapper
      title={showHeader ? headerTitle : undefined}
      subtitle={headerSubtitle}
      showBackButton={showBackButton}
      onBack={onBack}
      inline={inline}
      contentClassName={
        inline
          ? 'items-center px-4 py-8'
          : 'flex-1 items-center justify-center px-6'
      }
    >
      {icon ?? <SearchOutlineIcon />}
      {title && (
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          {title}
        </Text>
      )}
      <Text className="text-gray-400 text-center mt-2">{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          className="bg-green-500 px-6 py-3 rounded-lg mt-6"
          onPress={onAction}
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </ScreenStateWrapper>
  )
}

import type { ReactNode } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronBackIcon } from './icons'
import { ScreenHeader } from './ScreenHeader'

interface ScreenStateWrapperProps {
  children: ReactNode
  /**
   * Title for the ScreenHeader (only shown if not using floating back button)
   */
  title?: string
  /**
   * Subtitle for the ScreenHeader
   */
  subtitle?: string
  /**
   * Show back button
   */
  showBackButton?: boolean
  /**
   * Callback for back button press
   */
  onBack?: () => void
  /**
   * If true, uses a floating back button instead of ScreenHeader
   */
  useFloatingBackButton?: boolean
  /**
   * If true, renders as a simple View instead of SafeAreaView (for inline usage)
   */
  inline?: boolean
  /**
   * Additional className for the main content wrapper
   */
  contentClassName?: string
}

/**
 * Base wrapper component for screen states (Loading, Error, Empty).
 * Provides consistent structure with optional header and floating back button.
 */
export function ScreenStateWrapper({
  children,
  title,
  subtitle,
  showBackButton = false,
  onBack,
  useFloatingBackButton = false,
  inline = false,
  contentClassName = 'flex-1 items-center justify-center px-6',
}: ScreenStateWrapperProps) {
  const showHeader = title && !useFloatingBackButton

  const content = (
    <>
      {showHeader && (
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          onBack={showBackButton ? onBack : undefined}
          showBackButton={showBackButton}
        />
      )}

      {useFloatingBackButton && showBackButton && onBack && (
        <View className="absolute top-12 left-4 z-10">
          <TouchableOpacity
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          >
            <ChevronBackIcon />
          </TouchableOpacity>
        </View>
      )}

      <View className={contentClassName}>{children}</View>
    </>
  )

  if (inline) {
    return <>{content}</>
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {content}
    </SafeAreaView>
  )
}

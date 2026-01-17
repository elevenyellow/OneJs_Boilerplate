import type { ComponentType } from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '../ScreenHeader'

interface SkeletonListProps<P extends object> {
  /** Number of skeleton items to render */
  count?: number
  /** Skeleton item component */
  ItemSkeleton: ComponentType<P>
  /** Props to pass to each skeleton item */
  itemProps?: P
  /** Header title (optional) */
  headerTitle?: string
  /** Header subtitle (optional) */
  headerSubtitle?: string
  /** Show back button in header */
  showBackButton?: boolean
  /** Back button callback */
  onBack?: () => void
  /** Horizontal padding for items */
  itemPadding?: boolean
  /** Content padding bottom for bottom nav */
  contentPaddingBottom?: number
}

/**
 * Renders a list of skeleton items with optional header.
 * Used as loading state for list-based screens.
 */
export function SkeletonList<P extends object>({
  count = 5,
  ItemSkeleton,
  itemProps = {} as P,
  headerTitle,
  headerSubtitle,
  showBackButton = false,
  onBack,
  itemPadding = false,
  contentPaddingBottom = 100,
}: SkeletonListProps<P>) {
  const items = Array.from({ length: count }, (_, index) => index)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {headerTitle && (
        <ScreenHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          showBackButton={showBackButton}
          onBack={onBack}
        />
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className={itemPadding ? 'px-4' : ''}>
          {items.map((index) => (
            <ItemSkeleton key={index} {...itemProps} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

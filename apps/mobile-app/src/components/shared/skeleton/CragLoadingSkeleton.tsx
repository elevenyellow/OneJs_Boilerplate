import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '../ScreenHeader'
import { SkeletonBox } from './SkeletonBox'
import { SkeletonText } from './SkeletonText'
import { SectorListItemSkeleton } from './SectorListItemSkeleton'

interface CragLoadingSkeletonProps {
  /** Zone name for header */
  zoneName?: string
  /** Show back button */
  showBackButton?: boolean
  /** Back button callback */
  onBack?: () => void
}

/**
 * Full-screen skeleton for CragScreen.
 * Includes hero image, info card, tabs, and sector list placeholders.
 */
export function CragLoadingSkeleton({
  zoneName = 'Cargando...',
  showBackButton = true,
  onBack,
}: CragLoadingSkeletonProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title={zoneName}
        showBackButton={showBackButton}
        onBack={onBack}
      />

      {/* Hero image skeleton */}
      <SkeletonBox width="100%" height={200} borderRadius={0} />

      {/* Info card skeleton */}
      <View className="bg-card mx-4 -mt-6 rounded-2xl p-4 z-10">
        <View className="flex-row items-center justify-between mb-3">
          <SkeletonText width="2/3" height={20} />
          <SkeletonBox width={60} height={20} borderRadius={10} />
        </View>
        <SkeletonText width="1/2" height={14} style={{ marginBottom: 8 }} />
        <View className="flex-row items-center gap-3">
          <SkeletonBox width={80} height={24} borderRadius={12} />
          <SkeletonBox width={60} height={24} borderRadius={12} />
          <SkeletonBox width={70} height={24} borderRadius={12} />
        </View>
      </View>

      {/* Tabs skeleton */}
      <View className="flex-row justify-around py-3 border-b border-gray-800 mt-4">
        <SkeletonBox width={60} height={32} borderRadius={8} />
        <SkeletonBox width={60} height={32} borderRadius={8} />
        <SkeletonBox width={80} height={32} borderRadius={8} />
      </View>

      {/* Sector list skeleton */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <SectorListItemSkeleton />
        <SectorListItemSkeleton />
        <SectorListItemSkeleton />
        <SectorListItemSkeleton />
      </ScrollView>
    </SafeAreaView>
  )
}

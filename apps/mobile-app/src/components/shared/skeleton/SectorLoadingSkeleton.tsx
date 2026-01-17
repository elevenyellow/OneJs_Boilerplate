import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../ScreenHeader'
import { SkeletonBox } from './SkeletonBox'
import { RouteListItemSkeleton } from './RouteListItemSkeleton'

interface SectorLoadingSkeletonProps {
  /** Sector name for header */
  sectorName?: string
  /** Show back button */
  showBackButton?: boolean
  /** Back button callback */
  onBack?: () => void
}

/**
 * Full-screen skeleton for SectorScreen.
 * Includes photo carousel, filter chips, and route list placeholders.
 */
export function SectorLoadingSkeleton({
  sectorName,
  showBackButton = true,
  onBack,
}: SectorLoadingSkeletonProps) {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title={sectorName ?? t('common.loading')}
        subtitle={t('sector.loadingRoutes')}
        showBackButton={showBackButton}
        onBack={onBack}
      />

      {/* Photo carousel skeleton */}
      <SkeletonBox width="100%" height={280} borderRadius={0} />

      {/* Filter chips skeleton */}
      <View className="flex-row items-center gap-2 px-4 py-3">
        <SkeletonBox width={50} height={32} borderRadius={16} />
        <SkeletonBox width={65} height={32} borderRadius={16} />
        <SkeletonBox width={70} height={32} borderRadius={16} />
        <SkeletonBox width={55} height={32} borderRadius={16} />
        <SkeletonBox width={75} height={32} borderRadius={16} />
      </View>

      {/* Routes list skeleton */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <RouteListItemSkeleton />
        <RouteListItemSkeleton />
        <RouteListItemSkeleton />
        <RouteListItemSkeleton />
        <RouteListItemSkeleton />
        <RouteListItemSkeleton />
      </ScrollView>
    </SafeAreaView>
  )
}

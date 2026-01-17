import { View } from 'react-native'
import { SkeletonBox } from './SkeletonBox'
import { SkeletonText } from './SkeletonText'

/**
 * Skeleton placeholder matching RouteListItem layout.
 * Used for loading states in SectorScreen.
 */
export function RouteListItemSkeleton() {
  return (
    <View className="bg-card rounded-2xl p-4 mb-3 border border-gray-800">
      <View className="flex-row items-center">
        {/* Grade box placeholder */}
        <SkeletonBox
          width={56}
          height={56}
          borderRadius={12}
          className="mr-3"
        />

        {/* Route details */}
        <View className="flex-1">
          {/* Route name row */}
          <View className="flex-row items-center justify-between mb-2">
            <SkeletonText width="3/4" height={18} />
            {/* Classic star placeholder */}
            <SkeletonBox width={24} height={24} borderRadius={12} />
          </View>

          {/* Stats row: stars, height, bolts, style */}
          <View className="flex-row items-center gap-2">
            <SkeletonBox width={50} height={12} borderRadius={4} />
            <SkeletonBox width={35} height={12} borderRadius={4} />
            <SkeletonBox width={25} height={12} borderRadius={4} />
            <SkeletonBox width={40} height={12} borderRadius={4} />
          </View>
        </View>

        {/* Chevron placeholder */}
        <SkeletonBox width={8} height={14} borderRadius={2} />
      </View>
    </View>
  )
}

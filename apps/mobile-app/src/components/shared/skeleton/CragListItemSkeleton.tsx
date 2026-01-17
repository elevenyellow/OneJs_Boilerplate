import { View } from 'react-native'
import { SkeletonBox } from './SkeletonBox'
import { SkeletonText } from './SkeletonText'

interface CragListItemSkeletonProps {
  /** Show image placeholder */
  showImage?: boolean
}

/**
 * Skeleton placeholder matching CragListItem layout.
 * Used for loading states in ExplorerScreen.
 */
export function CragListItemSkeleton({
  showImage = true,
}: CragListItemSkeletonProps) {
  return (
    <View className="bg-card rounded-2xl p-3 mx-4 mb-3 border border-gray-800">
      <View className="flex-row">
        {/* Image placeholder */}
        {showImage && (
          <SkeletonBox
            width={96}
            height={96}
            borderRadius={12}
            className="mr-3"
          />
        )}

        {/* Content area */}
        <View className="flex-1 justify-between">
          {/* Header area */}
          <View>
            {/* Title row */}
            <View className="flex-row items-center justify-between mb-2">
              <SkeletonText width="3/4" height={18} />
            </View>

            {/* Location */}
            <SkeletonText width="1/2" height={14} style={{ marginBottom: 6 }} />

            {/* Route count / grade range */}
            <SkeletonText width="2/3" height={14} />
          </View>

          {/* Bottom row with badges */}
          <View className="flex-row items-center justify-between mt-3">
            {/* Condition badge placeholder */}
            <SkeletonBox width={60} height={24} borderRadius={12} />

            {/* Right side icons */}
            <View className="flex-row items-center gap-3">
              <SkeletonBox width={50} height={16} borderRadius={4} />
              <SkeletonBox width={40} height={16} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

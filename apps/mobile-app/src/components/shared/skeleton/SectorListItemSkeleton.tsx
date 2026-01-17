import { View } from 'react-native'
import { SkeletonBox } from './SkeletonBox'
import { SkeletonText } from './SkeletonText'

interface SectorListItemSkeletonProps {
  /** Show image placeholder */
  showImage?: boolean
}

/**
 * Skeleton placeholder matching SectorListItem layout.
 * Used for loading states in CragScreen.
 */
export function SectorListItemSkeleton({
  showImage = true,
}: SectorListItemSkeletonProps) {
  return (
    <View className="bg-card rounded-2xl p-3 mb-3 border border-gray-800">
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
            {/* Title row with star rating */}
            <View className="flex-row items-center justify-between mb-2">
              <SkeletonText width="2/3" height={18} />
              <SkeletonBox width={50} height={12} borderRadius={4} />
            </View>

            {/* Route count / grade range */}
            <SkeletonText width="1/2" height={14} />
          </View>

          {/* Icon badges row */}
          <View className="flex-row items-center gap-3 mt-3">
            <SkeletonBox width={16} height={16} borderRadius={4} />
            <SkeletonBox width={16} height={16} borderRadius={4} />
            <SkeletonBox width={24} height={16} borderRadius={4} />
          </View>

          {/* Bottom row */}
          <View className="flex-row items-center justify-between mt-2">
            {/* Condition badge placeholder */}
            <SkeletonBox width={60} height={24} borderRadius={12} />

            {/* Weather icon */}
            <SkeletonBox width={16} height={16} borderRadius={8} />
          </View>
        </View>
      </View>
    </View>
  )
}

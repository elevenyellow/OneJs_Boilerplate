import { memo } from 'react'
import { View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { useEffect } from 'react'

interface SectorCardSkeletonProps {
  /** Animation delay for staggered loading effect */
  delay?: number
}

/**
 * Skeleton placeholder for SectorCard during loading state.
 * Matches the exact layout of SectorCard for smooth transition.
 */
export const SectorCardSkeleton = memo(function SectorCardSkeleton({
  delay = 0,
}: SectorCardSkeletonProps) {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.7, { duration: 800 }), -1, true),
    )
  }, [delay, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <View className="bg-card rounded-2xl overflow-hidden mb-4 mx-4 border border-border">
      {/* Image Skeleton */}
      <Animated.View
        style={animatedStyle}
        className="w-full aspect-[16/10] bg-card-elevated"
      />

      {/* Content Section */}
      <View className="p-4">
        {/* Name Skeleton */}
        <Animated.View
          style={animatedStyle}
          className="h-6 w-3/4 bg-card-elevated rounded"
        />

        {/* Location Skeleton */}
        <Animated.View
          style={animatedStyle}
          className="h-4 w-1/2 bg-card-elevated rounded mt-2"
        />

        {/* Weather Row Skeleton */}
        <View className="flex-row items-center justify-between py-3 mt-3 border-t border-b border-border-muted">
          <Animated.View
            style={animatedStyle}
            className="h-5 w-16 bg-card-elevated rounded flex-1 mx-2"
          />
          <Animated.View
            style={animatedStyle}
            className="h-5 w-20 bg-card-elevated rounded flex-1 mx-2"
          />
          <Animated.View
            style={animatedStyle}
            className="h-5 w-16 bg-card-elevated rounded flex-1 mx-2"
          />
        </View>

        {/* Routes Info Row Skeleton */}
        <View className="flex-row items-center justify-between mt-3">
          <Animated.View
            style={animatedStyle}
            className="h-10 w-40 bg-card-elevated rounded-full"
          />
          <Animated.View
            style={animatedStyle}
            className="w-10 h-10 bg-card-elevated rounded-full"
          />
        </View>
      </View>
    </View>
  )
})

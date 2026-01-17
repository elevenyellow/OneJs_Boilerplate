import { useEffect } from 'react'
import { View, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { colors } from '@/theme/colors'

interface SkeletonBoxProps {
  /** Width of the skeleton box */
  width?: number | `${number}%`
  /** Height of the skeleton box */
  height?: number
  /** Border radius */
  borderRadius?: number
  /** Additional styles */
  style?: ViewStyle
  /** Custom className for NativeWind */
  className?: string
}

/**
 * Base skeleton component with shimmer animation.
 * Uses Reanimated for smooth 60fps opacity cycling.
 */
export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  className,
}: SkeletonBoxProps) {
  const shimmerOpacity = useSharedValue(0.4)

  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(0.8, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    )
  }, [shimmerOpacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }))

  return (
    <View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.bg.elevated,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: colors.border.default,
          },
          animatedStyle,
        ]}
      />
    </View>
  )
}

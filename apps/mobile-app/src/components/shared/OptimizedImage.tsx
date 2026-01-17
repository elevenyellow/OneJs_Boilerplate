import { useState, useCallback } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { Image, type ImageContentFit } from 'expo-image'
import { ImageOutlineIcon } from './icons'
import { colors } from '@/theme/colors'

type PlaceholderType = 'skeleton' | 'none'

interface OptimizedImageProps {
  /** Image URL to display */
  source: string | null | undefined
  /** Width of the image container */
  width: number
  /** Height of the image container */
  height: number
  /** How to fit the image within the container */
  contentFit?: ImageContentFit
  /** Type of placeholder to show while loading */
  placeholder?: PlaceholderType
  /** Background color for placeholder/error states */
  placeholderColor?: string
  /** Transition duration in ms (default 200) */
  transition?: number
  /** Additional className for the container */
  className?: string
  /** Additional styles for the container */
  style?: StyleProp<ViewStyle>
  /** Callback when image loads successfully */
  onLoad?: () => void
  /** Callback when image fails to load */
  onError?: () => void
}

/**
 * Optimized image component using expo-image for better caching and loading UX.
 *
 * Features:
 * - Automatic disk and memory caching
 * - Skeleton placeholder while loading
 * - Smooth fade-in transition
 * - Error fallback with icon
 * - Consistent styling with app theme
 */
export function OptimizedImage({
  source,
  width,
  height,
  contentFit = 'cover',
  placeholder = 'skeleton',
  placeholderColor = colors.border.default,
  transition = 200,
  className = '',
  style,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }, [onError])

  // No source or error - show fallback
  if (!source || hasError) {
    return (
      <View
        className={`items-center justify-center ${className}`}
        style={[{ width, height, backgroundColor: placeholderColor }, style]}
      >
        <ImageOutlineIcon
          size={Math.min(width, height) * 0.4}
          color={colors.text.muted}
        />
      </View>
    )
  }

  return (
    <View
      className={className}
      style={[{ width, height, backgroundColor: placeholderColor }, style]}
    >
      {/* Skeleton placeholder while loading */}
      {isLoading && placeholder === 'skeleton' && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: placeholderColor }}
        >
          <View
            className="rounded-lg animate-pulse"
            style={{
              width: width * 0.6,
              height: height * 0.6,
              backgroundColor: colors.bg.elevated,
            }}
          />
        </View>
      )}

      <Image
        source={{ uri: source }}
        style={{ width, height }}
        contentFit={contentFit}
        transition={transition}
        cachePolicy="disk"
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  )
}

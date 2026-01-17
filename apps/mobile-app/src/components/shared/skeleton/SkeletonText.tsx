import type { ViewStyle } from 'react-native'
import { SkeletonBox } from './SkeletonBox'

type TextWidth = 'full' | '3/4' | '2/3' | '1/2' | '1/3' | '1/4'

interface SkeletonTextProps {
  /** Predefined width options */
  width?: TextWidth
  /** Custom width (overrides width prop) */
  customWidth?: number | `${number}%`
  /** Height of the text line */
  height?: number
  /** Additional styles */
  style?: ViewStyle
  /** Custom className */
  className?: string
}

const widthMap: Record<TextWidth, `${number}%`> = {
  full: '100%',
  '3/4': '75%',
  '2/3': '66%',
  '1/2': '50%',
  '1/3': '33%',
  '1/4': '25%',
}

/**
 * Text line skeleton placeholder.
 * Uses SkeletonBox with text-appropriate defaults.
 */
export function SkeletonText({
  width = 'full',
  customWidth,
  height = 14,
  style,
  className,
}: SkeletonTextProps) {
  const resolvedWidth = customWidth ?? widthMap[width]

  return (
    <SkeletonBox
      width={resolvedWidth}
      height={height}
      borderRadius={4}
      style={style}
      className={className}
    />
  )
}

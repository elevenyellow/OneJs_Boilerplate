import { TouchableOpacity } from 'react-native'
import { ChevronBackIcon, ChevronForwardIcon } from '@/components/shared/icons'

interface TopoNavigationArrowsProps {
  /**
   * Whether the left (previous) arrow should be shown
   */
  showPrevious: boolean

  /**
   * Whether the right (next) arrow should be shown
   */
  showNext: boolean

  /**
   * Callback when previous arrow is pressed
   */
  onPrevious: () => void

  /**
   * Callback when next arrow is pressed
   */
  onNext: () => void

  /**
   * Whether in fullscreen mode (larger arrows)
   */
  isFullscreen?: boolean
}

/**
 * Navigation arrows for photo browsing
 */
export function TopoNavigationArrows({
  showPrevious,
  showNext,
  onPrevious,
  onNext,
  isFullscreen = false,
}: TopoNavigationArrowsProps) {
  const buttonSize = isFullscreen ? 'w-12 h-12' : 'w-8 h-8'
  const iconSize = isFullscreen ? 28 : 20
  const bgColor = isFullscreen ? 'bg-black/60' : 'bg-black/40'
  const position = isFullscreen ? 'top-1/2 -mt-6' : 'top-1/2 -mt-4'

  return (
    <>
      {showPrevious && (
        <TouchableOpacity
          className={`absolute left-${isFullscreen ? '4' : '2'} ${position} ${bgColor} ${buttonSize} rounded-full items-center justify-center`}
          style={{ left: isFullscreen ? 16 : 8 }}
          onPress={onPrevious}
        >
          <ChevronBackIcon size={iconSize} color="#fff" />
        </TouchableOpacity>
      )}
      {showNext && (
        <TouchableOpacity
          className={`absolute right-${isFullscreen ? '4' : '2'} ${position} ${bgColor} ${buttonSize} rounded-full items-center justify-center`}
          style={{ right: isFullscreen ? 16 : 8 }}
          onPress={onNext}
        >
          <ChevronForwardIcon size={iconSize} color="#fff" />
        </TouchableOpacity>
      )}
    </>
  )
}

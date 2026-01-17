import { View, Dimensions } from 'react-native'
import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { FlatList } from 'react-native'
import { haptics } from '@/services/haptics'
import { SectorPhotoViewer } from './SectorPhotoViewer'
import { FLATLIST_OPTIMIZATION } from '@/constants/layout'
import type { SectorPhotoWithAreas } from '@/types/api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH
const CARD_SPACING = 0

interface SectorPhotoCarouselProps {
  photos: SectorPhotoWithAreas[]
  selectedSectorId?: string | null
  onPhotoIndexChange?: (index: number) => void
  onSectorAreaPress?: (sectorId: string) => void
}

export interface SectorPhotoCarouselRef {
  scrollToIndex: (index: number) => void
}

/**
 * Horizontal carousel of sector photos with SVG areas overlay
 * Allows navigation between photos and highlights selected sector area
 */
export const SectorPhotoCarousel = forwardRef<
  SectorPhotoCarouselRef,
  SectorPhotoCarouselProps
>(function SectorPhotoCarousel(
  { photos, selectedSectorId, onPhotoIndexChange, onSectorAreaPress },
  ref,
) {
  const flatListRef = useRef<FlatList>(null)

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number) => {
      flatListRef.current?.scrollToIndex({ index, animated: true })
    },
  }))

  const handleMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const offsetX = event.nativeEvent.contentOffset.x
      const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING))
      haptics.light()
      onPhotoIndexChange?.(index)
    },
    [onPhotoIndexChange],
  )

  const renderItem = useCallback(
    ({ item }: { item: SectorPhotoWithAreas }) => {
      return (
        <View style={{ width: CARD_WIDTH, marginRight: CARD_SPACING }}>
          <SectorPhotoViewer
            photo={item}
            selectedSectorId={selectedSectorId}
            onSectorAreaPress={onSectorAreaPress}
            enableZoom={true}
          />
        </View>
      )
    },
    [selectedSectorId, onSectorAreaPress],
  )

  if (photos.length === 0) {
    return null
  }

  return (
    <FlatList
      ref={flatListRef}
      data={photos}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + CARD_SPACING}
      decelerationRate="fast"
      pagingEnabled
      onMomentumScrollEnd={handleMomentumScrollEnd}
      getItemLayout={(_data, index) => ({
        length: CARD_WIDTH + CARD_SPACING,
        offset: (CARD_WIDTH + CARD_SPACING) * index,
        index,
      })}
      maxToRenderPerBatch={
        FLATLIST_OPTIMIZATION.CAROUSEL_MAX_TO_RENDER_PER_BATCH
      }
      windowSize={FLATLIST_OPTIMIZATION.CAROUSEL_WINDOW_SIZE}
      initialNumToRender={FLATLIST_OPTIMIZATION.CAROUSEL_INITIAL_NUM_TO_RENDER}
      removeClippedSubviews={true}
    />
  )
})

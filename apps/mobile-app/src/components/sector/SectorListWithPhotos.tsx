import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useState, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SectorPhotoCarousel,
  type SectorPhotoCarouselRef,
} from './SectorPhotoCarousel'
import { LIST_ITEM_HEIGHTS, FLATLIST_OPTIMIZATION } from '@/constants/layout'
import type { SectorPhotoWithAreas, SectorDto } from '@/types/api'

interface SectorListWithPhotosProps {
  sectors: SectorDto[]
  photos: SectorPhotoWithAreas[]
  onSectorSelect?: (sectorId: string) => void
}

/**
 * Integrated component with sector list and photo carousel
 * Features bidirectional synchronization:
 * - Click sector in list -> centers photo in carousel + highlights SVG area
 * - Click SVG area in photo -> scrolls to sector in list
 */
export function SectorListWithPhotos({
  sectors,
  photos,
  onSectorSelect,
}: SectorListWithPhotosProps) {
  const { t } = useTranslation()
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null)
  const [_currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const carouselRef = useRef<SectorPhotoCarouselRef>(null)
  const listRef = useRef<FlatList>(null)

  // Create mapping: sectorId -> photo index
  const sectorToPhotoIndex = useMemo(() => {
    const map = new Map<string, number>()
    for (const photo of photos) {
      for (const area of photo.sectorAreas) {
        if (area.sectorId && !map.has(area.sectorId)) {
          const photoIndex = photos.indexOf(photo)
          map.set(area.sectorId, photoIndex)
        }
      }
    }
    return map
  }, [photos])

  // Handle sector click from list
  const handleSectorClick = useCallback(
    (sectorId: string) => {
      setSelectedSectorId(sectorId)
      onSectorSelect?.(sectorId)

      // Find photo containing this sector
      const photoIndex = sectorToPhotoIndex.get(sectorId)
      if (photoIndex !== undefined) {
        carouselRef.current?.scrollToIndex(photoIndex)
        setCurrentPhotoIndex(photoIndex)
      }
    },
    [sectorToPhotoIndex, onSectorSelect],
  )

  // Handle area click from SVG
  const handleSectorAreaPress = useCallback(
    (sectorId: string) => {
      setSelectedSectorId(sectorId)
      onSectorSelect?.(sectorId)

      // Scroll list to sector
      const sectorIndex = sectors.findIndex((s) => s.id === sectorId)
      if (sectorIndex !== -1) {
        listRef.current?.scrollToIndex({ index: sectorIndex, animated: true })
      }
    },
    [sectors, onSectorSelect],
  )

  // Handle photo index change from carousel swipe
  const handlePhotoIndexChange = useCallback((index: number) => {
    setCurrentPhotoIndex(index)
  }, [])

  const renderSectorItem = useCallback(
    ({ item }: { item: SectorDto }) => {
      const isSelected = item.id === selectedSectorId
      const hasPhoto = sectorToPhotoIndex.has(item.id)

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSectorClick(item.id)}
          className={`flex-row items-center p-4 border-b border-border ${
            isSelected ? 'bg-accent/10' : 'bg-background'
          }`}
        >
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className={`text-lg font-semibold ${
                  isSelected ? 'text-accent' : 'text-foreground'
                }`}
              >
                {item.name}
              </Text>
              {hasPhoto && (
                <View className="bg-accent/20 px-2 py-0.5 rounded">
                  <Text className="text-xs text-accent">
                    {t('sector.withPhoto')}
                  </Text>
                </View>
              )}
            </View>
            {item.numberRoutes ? (
              <Text className="text-sm text-muted-foreground">
                {t('sector.routeCount', { count: item.numberRoutes })}
              </Text>
            ) : null}
          </View>
          {isSelected && <View className="w-3 h-3 rounded-full bg-accent" />}
        </TouchableOpacity>
      )
    },
    [selectedSectorId, handleSectorClick, sectorToPhotoIndex],
  )

  return (
    <View className="flex-1">
      {photos.length > 0 ? (
        <View className="h-80 bg-black">
          <SectorPhotoCarousel
            ref={carouselRef}
            photos={photos}
            selectedSectorId={selectedSectorId}
            onPhotoIndexChange={handlePhotoIndexChange}
            onSectorAreaPress={handleSectorAreaPress}
          />
        </View>
      ) : (
        <View className="h-40 bg-muted items-center justify-center">
          <Text className="text-muted-foreground text-center px-4">
            {t('sector.noPhotosAvailable')}
          </Text>
        </View>
      )}

      <View className="flex-1 bg-background">
        <View className="p-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground">
            {t('sector.sectorsCount', { count: sectors.length })}
          </Text>
          {photos.length > 0 && (
            <Text className="text-xs text-muted-foreground mt-1">
              {t('sector.withPhotoCount', {
                count: sectors.filter((s) => sectorToPhotoIndex.has(s.id))
                  .length,
              })}
            </Text>
          )}
        </View>
        <FlatList
          ref={listRef}
          data={sectors}
          renderItem={renderSectorItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          getItemLayout={(_data, index) => ({
            length: LIST_ITEM_HEIGHTS.SECTOR_LIST_ITEM,
            offset: LIST_ITEM_HEIGHTS.SECTOR_LIST_ITEM * index,
            index,
          })}
          maxToRenderPerBatch={FLATLIST_OPTIMIZATION.MAX_TO_RENDER_PER_BATCH}
          windowSize={FLATLIST_OPTIMIZATION.WINDOW_SIZE}
          initialNumToRender={FLATLIST_OPTIMIZATION.INITIAL_NUM_TO_RENDER}
          removeClippedSubviews={true}
        />
      </View>
    </View>
  )
}

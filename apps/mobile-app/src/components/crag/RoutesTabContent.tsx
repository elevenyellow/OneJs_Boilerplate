import { useCallback } from 'react'
import { FlatList } from 'react-native'
import { ZoneSectorListItem } from '@/components/shared/ZoneSectorListItem'
import { LIST_ITEM_HEIGHTS, FLATLIST_OPTIMIZATION } from '@/constants/layout'
import type { SectorWithPhoto } from './types'

interface RoutesTabContentProps {
  sectors: SectorWithPhoto[]
  selectedSectorId: string | null
  onSectorPress: (sectorId: string) => void
}

export function RoutesTabContent({
  sectors,
  selectedSectorId,
  onSectorPress,
}: RoutesTabContentProps) {
  const renderSectorItem = useCallback(
    ({ item: sector }: { item: SectorWithPhoto }) => {
      const isSelected = sector.id === selectedSectorId
      return (
        <ZoneSectorListItem
          sector={sector}
          isSelected={isSelected}
          onPress={() => onSectorPress(sector.id)}
        />
      )
    },
    [selectedSectorId, onSectorPress],
  )

  return (
    <FlatList
      data={sectors}
      renderItem={renderSectorItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      getItemLayout={(_data, index) => ({
        length: LIST_ITEM_HEIGHTS.CRAG_LIST_ITEM,
        offset: LIST_ITEM_HEIGHTS.CRAG_LIST_ITEM * index,
        index,
      })}
      maxToRenderPerBatch={FLATLIST_OPTIMIZATION.MAX_TO_RENDER_PER_BATCH}
      windowSize={FLATLIST_OPTIMIZATION.WINDOW_SIZE}
      initialNumToRender={FLATLIST_OPTIMIZATION.INITIAL_NUM_TO_RENDER}
      removeClippedSubviews={true}
    />
  )
}

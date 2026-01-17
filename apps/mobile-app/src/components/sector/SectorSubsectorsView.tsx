import { View, Text, FlatList } from 'react-native'
import { SectorListItem } from '@/components/shared/SectorListItem'
import { SectorListWithPhotos } from './SectorListWithPhotos'
import { LIST_ITEM_HEIGHTS, FLATLIST_OPTIMIZATION } from '@/constants/layout'
import { formatGradeRangeFromBands, type GradeSystem } from '@/utils/grades'
import { usePreferences } from '@/contexts/PreferencesContext'
import type { SectorPhotoWithAreasDto, SectorDto } from '@/types/api'
import type { ZoneSectorUI } from '@/types/ui'

interface SectorSubsectorsViewProps {
  children: SectorDto[]
  photos: SectorPhotoWithAreasDto[] | null
  parentSectorName: string
  onSubsectorPress: (subsectorId: string, subsectorName: string) => void
}

function mapSectorToZoneSectorUI(
  item: SectorDto,
  parentSectorName: string,
  gradeSystem: GradeSystem,
): ZoneSectorUI {
  const gradeRange =
    formatGradeRangeFromBands(
      item.minGradeBand,
      item.maxGradeBand,
      gradeSystem,
    ) || ''

  return {
    id: item.id,
    name: item.name,
    location: parentSectorName,
    imageUrl: item.headerImage || '',
    temperature: 22,
    condition: 'partial',
    routeCount: item.numberRoutes || 0,
    gradeRange: gradeRange,
    vectors: [],
    stats: { easy: 25, medium: 25, hard: 25, extreme: 25 },
    aspectLabel: item.aspectLabel,
    walkInTimeLabel: item.walkInTimeLabel,
    familyLabel: item.familyLabel,
    tagFamily: item.tagFamily,
    tagWeather: item.tagWeather,
    tagCrowds: item.tagCrowds,
    crowdsLabel: item.crowdsLabel,
    climbingStyle: item.climbingStyle,
    averageHeight: item.averageHeight,
    averageHeightUnit: item.averageHeightUnit,
    numberTopos: item.numberTopos,
    starRating: item.starRating ?? 0,
  }
}

export function SectorSubsectorsView({
  children,
  photos,
  parentSectorName,
  onSubsectorPress,
}: SectorSubsectorsViewProps) {
  const { preferences } = usePreferences()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem
  const hasPhotos = photos && photos.length > 0

  if (hasPhotos && children.length > 0) {
    return (
      <SectorListWithPhotos
        sectors={children}
        photos={photos}
        onSectorSelect={(subsectorId) => {
          const subsector = children.find((s) => s.id === subsectorId)
          if (subsector) {
            onSubsectorPress(subsector.id, subsector.name)
          }
        }}
      />
    )
  }

  return (
    <View className="pt-72">
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="px-4 mb-4">
            <Text className="text-gray-400 font-bold uppercase tracking-wider text-xs">
              {children.length} Subsectores
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-4">
            <SectorListItem
              sector={mapSectorToZoneSectorUI(
                item,
                parentSectorName,
                gradeSystem,
              )}
              isSelected={false}
              onPress={() => onSubsectorPress(item.id, item.name)}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 160 }}
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
    </View>
  )
}

import { View, FlatList } from 'react-native'
import { useTranslation } from 'react-i18next'
import { TopoImageViewer, RouteListItem, EmptyState } from '@/components/shared'
import { TrailSignOutlineIcon } from '@/components/shared/icons'
import { SectorRoutesListHeader } from './SectorRoutesListHeader'
import { FLATLIST_OPTIMIZATION } from '@/constants/layout'
import { useRouteAscentCounts } from '@/hooks/useRouteAscentCounts'
import type {
  SectorDto,
  RouteDto,
  SectorPhotoWithAreasDto,
  GradeCategory,
} from '@/types/api'
import type { SectorRouteSelectionState } from './types'

interface GradeFilterOption {
  id: string
  label: string
  color?: string
}

interface SectorRoutesViewProps {
  sector: SectorDto | null
  photos: SectorPhotoWithAreasDto[] | null
  filteredRoutes: RouteDto[]
  gradeFilters: GradeFilterOption[]
  selectedFilter: string
  selectionState: SectorRouteSelectionState
  onFilterChange: (filterId: string) => void
  onRouteSelect: (
    routeId: string,
    routeExternalId?: string,
    gradeCategory?: GradeCategory,
  ) => void
  onRoutePress: (routeId: string) => void
  onPhotoChange: (index: number) => void
  onRouteDoubleTap?: (route: RouteDto) => void
}

export function SectorRoutesView({
  sector,
  photos,
  filteredRoutes,
  gradeFilters,
  selectedFilter,
  selectionState,
  onFilterChange,
  onRouteSelect,
  onRoutePress,
  onPhotoChange,
  onRouteDoubleTap,
}: SectorRoutesViewProps) {
  const { t } = useTranslation()
  const {
    selectedRouteId,
    selectedRouteExternalId,
    selectedRouteColor,
    selectedPhotoIndex,
  } = selectionState

  // Get ascent counts for routes
  const { ascentCounts } = useRouteAscentCounts()

  return (
    <View className="flex-1">
      {/* Sticky Topo Image Viewer with swipe support */}
      <TopoImageViewer
        photos={photos ?? undefined}
        imageUrl={sector?.headerImage || undefined}
        selectedRouteId={selectedRouteId}
        selectedRouteExternalId={selectedRouteExternalId}
        selectedRouteColor={selectedRouteColor}
        selectedPhotoIndex={selectedPhotoIndex}
        onPhotoChange={onPhotoChange}
        onRoutePress={onRoutePress}
      />

      {/* Scrollable Route List */}
      <FlatList
        data={filteredRoutes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <SectorRoutesListHeader
            sector={sector}
            gradeFilters={gradeFilters}
            selectedFilter={selectedFilter}
            filteredCount={filteredRoutes.length}
            onFilterChange={onFilterChange}
          />
        }
        renderItem={({ item }) => {
          const ascentCount = ascentCounts.get(item.id)
          return (
            <View className="px-4">
              <RouteListItem
                route={item}
                isSelected={item.id === selectedRouteId}
                onPress={() =>
                  onRouteSelect(item.id, item.externalId, item.gradeCategory)
                }
                onDoubleTap={
                  onRouteDoubleTap ? () => onRouteDoubleTap(item) : undefined
                }
                ascentCount={ascentCount}
              />
            </View>
          )
        }}
        ListEmptyComponent={
          <EmptyState
            icon={<TrailSignOutlineIcon size={48} color="#666" />}
            message={t('sector.noRoutesWithFilter')}
            actionLabel={t('sector.viewAllRoutes')}
            onAction={() => onFilterChange('all')}
            inline
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={FLATLIST_OPTIMIZATION.MAX_TO_RENDER_PER_BATCH}
        windowSize={FLATLIST_OPTIMIZATION.WINDOW_SIZE}
        initialNumToRender={FLATLIST_OPTIMIZATION.INITIAL_NUM_TO_RENDER}
        removeClippedSubviews={true}
      />
    </View>
  )
}

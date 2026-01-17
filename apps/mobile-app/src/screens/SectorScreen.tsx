import { View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '@/contexts/PreferencesContext'
import {
  buildGradeFilters,
  formatGradeRangeFromBands,
  type GradeSystem,
} from '@/utils/grades'
import { GradeConverter } from '@climb-zone/grades'
import {
  ShareOutlineIcon,
  EllipsisVerticalIcon,
  HelpCircleOutlineIcon,
  ScreenHeader,
  ErrorState,
  SectorLoadingSkeleton,
} from '@/components/shared'
import { colors } from '@/theme/colors'
import {
  SectorIconsLegend,
  SectorContentTabs,
  SectorRoutesView,
  SectorSubsectorsView,
  type ContentMode,
} from '@/components/sector'
import {
  useSectorWithRoutes,
  useCragWithRoutes,
} from '@/hooks/useSectorHierarchy'
import { useSectorRouteSelection } from '@/hooks/useSectorRouteSelection'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from '@/navigation/types'
import type { RouteDto, GradeCategory } from '@/types/api'

interface SectorScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Sector'>
  route: RouteProp<RootStackParamList, 'Sector'>
}

export function SectorScreen({ navigation, route }: SectorScreenProps) {
  const { t } = useTranslation()
  const { preferences } = usePreferences()
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [contentMode, setContentMode] = useState<ContentMode>('routes')
  const [legendVisible, setLegendVisible] = useState(false)

  // Get sector ID from route params
  const sectorId = route.params?.sectorId || ''
  const sectorName = route.params?.sectorName || 'Sector'
  const isCragRoutes = route.params?.isCragRoutes || false

  // User's preferred grade system from context
  const userGradeSystem = (preferences.gradeSystem || 'french') as GradeSystem

  // Build grade filters based on user's preferred system
  const gradeFilters = useMemo(
    () => buildGradeFilters(userGradeSystem, t),
    [userGradeSystem, t],
  )

  // Fetch sector details with routes from API
  // If isCragRoutes is true, fetch from crag endpoint (virtual sectors case)
  // Grade data is returned as gradeBand - conversion happens in components
  const sectorData = useSectorWithRoutes(sectorId, !!sectorId && !isCragRoutes)
  const cragData = useCragWithRoutes(sectorId, !!sectorId && isCragRoutes)

  // Use the appropriate data source
  const {
    sector,
    routes,
    children,
    photos,
    totalRoutes,
    isLoading,
    isError,
    error,
  } = isCragRoutes ? cragData : sectorData

  // Route selection hook
  const {
    selectedRouteId,
    selectedRouteExternalId,
    selectedRouteColor,
    selectedPhotoIndex,
    handleRouteSelect,
    handleRoutePress,
    handlePhotoChange,
  } = useSectorRouteSelection({ routes, photos })

  // Determine if sector has subsectors or routes
  const hasSubsectors = children.length > 0
  const hasRoutes = routes.length > 0

  // Default to subsectors if they exist, otherwise routes
  const effectiveContentMode =
    contentMode === 'routes' && !hasRoutes ? 'subsectors' : contentMode

  // Filter routes by grade category
  const filteredRoutes = useMemo(() => {
    if (selectedFilter === 'all') {
      return routes
    }
    return routes.filter(
      (r: RouteDto) => r.gradeCategory === (selectedFilter as GradeCategory),
    )
  }, [routes, selectedFilter])

  const handleSubsectorPress = useCallback(
    (subsectorId: string, subsectorName: string) => {
      navigation.push('Sector', {
        sectorId: subsectorId,
        sectorName: subsectorName,
        originTab: route.params.originTab,
      })
    },
    [navigation, route.params.originTab],
  )

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation])

  // Navigate to LogAscent screen when double-tapping a route
  const handleRouteDoubleTap = useCallback(
    (routeToLog: RouteDto) => {
      // Convert gradeBand to display string using user's preferred grade system
      const gradeLabel =
        routeToLog.gradeBand > 0
          ? (GradeConverter.fromIndex(routeToLog.gradeBand, userGradeSystem) ??
            '?')
          : '?'

      navigation.navigate('LogAscent', {
        routeId: routeToLog.id,
        routeName: routeToLog.name,
        routeGrade: gradeLabel,
        routeGradeBand: routeToLog.gradeBand,
        routeGradeSecondary: undefined,
        routeImage: undefined,
        sectorName: sector?.name || sectorName,
        location: sector?.name || sectorName,
        originTab: route.params.originTab,
      })
    },
    [navigation, sector?.name, sectorName, userGradeSystem, route.params.originTab],
  )

  // Loading state
  if (isLoading) {
    return (
      <SectorLoadingSkeleton
        sectorName={sectorName}
        showBackButton
        onBack={handleGoBack}
      />
    )
  }

  // Error state
  if (isError) {
    return (
      <ErrorState
        title={t('sector.errorLoadingSector')}
        message={error?.message || t('sector.somethingWentWrong')}
        actionLabel={t('common.back')}
        onAction={handleGoBack}
        showBackButton
        onBack={handleGoBack}
        useFloatingBackButton
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title={sector?.name || sectorName}
        subtitle={`${totalRoutes} ${t('sector.routes')} · ${formatGradeRangeFromBands(sector?.minGradeBand, sector?.maxGradeBand, userGradeSystem) || ''}`}
        onBack={handleGoBack}
        rightActions={
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-card"
              onPress={() => setLegendVisible(true)}
            >
              <HelpCircleOutlineIcon size={22} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-card">
              <ShareOutlineIcon />
            </TouchableOpacity>
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-card">
              <EllipsisVerticalIcon />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Content mode tabs (only show if both subsectors and routes exist) */}
      {hasSubsectors && hasRoutes && (
        <SectorContentTabs
          activeTab={effectiveContentMode}
          onTabChange={setContentMode}
        />
      )}

      {effectiveContentMode === 'routes' ? (
        <SectorRoutesView
          sector={sector}
          photos={photos}
          filteredRoutes={filteredRoutes}
          gradeFilters={gradeFilters}
          selectedFilter={selectedFilter}
          selectionState={{
            selectedRouteId,
            selectedRouteExternalId,
            selectedRouteColor,
            selectedPhotoIndex,
          }}
          onFilterChange={setSelectedFilter}
          onRouteSelect={handleRouteSelect}
          onRoutePress={handleRoutePress}
          onPhotoChange={handlePhotoChange}
          onRouteDoubleTap={handleRouteDoubleTap}
        />
      ) : (
        <SectorSubsectorsView
          children={children}
          photos={photos}
          parentSectorName={sector?.name || sectorName}
          onSubsectorPress={handleSubsectorPress}
        />
      )}

      {/* Icons Legend Modal */}
      <SectorIconsLegend
        visible={legendVisible}
        onClose={() => setLegendVisible(false)}
      />
    </SafeAreaView>
  )
}

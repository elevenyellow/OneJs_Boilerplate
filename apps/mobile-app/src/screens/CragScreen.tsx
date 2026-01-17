import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScreenHeader,
  ErrorState,
  EmptyState,
  AlertCircleOutlineIcon,
  LayersOutlineIcon,
  CragLoadingSkeleton,
} from '@/components/shared'
import { colors } from '@/theme/colors'
import { SectorIconsLegend } from '@/components/sector'
import {
  CragHeroImage,
  CragHeroCard,
  CragConditionsBadges,
  CragTabBar,
  RoutesTabContent,
  InfoTabContent,
  DirectionsTabContent,
  sharedStyles,
} from '@/components/crag'
import type { TabType } from '@/components/crag'
import { useZoneOverview } from '@/hooks/useZoneOverview'
import { useSectorPhotos } from '@/hooks/useSectorPhotos'
import { useSectorSelection } from '@/hooks/useSectorSelection'
import { useBetaLanguages } from '@/hooks/useBetaLanguages'
import { useDirectionsData } from '@/hooks/useDirectionsData'
import { useClimbingConditions } from '@/hooks/useClimbingConditions'
import { usePreferences } from '@/contexts/PreferencesContext'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from '@/navigation/types'
import type { ParsedBetaDto } from '@/types/api'

interface CragScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Crag'>
  route: RouteProp<RootStackParamList, 'Crag'>
}

export function CragScreen({ navigation, route }: CragScreenProps) {
  const { t } = useTranslation()
  const { preferences } = usePreferences()
  const { zoneId, zoneName } = route.params

  // Get user's preferred grading system from preferences
  const gradingSystem = (preferences.gradeSystem?.toUpperCase() || 'FRENCH') as
    | 'FRENCH'
    | 'YDS'
    | 'UIAA'
    | 'BRITISH'
    | 'FONT'
    | 'HUECO'

  const {
    data: zoneData,
    isLoading,
    isError,
    error,
  } = useZoneOverview(zoneId, { gradingSystem })

  // State
  const [activeTab, setActiveTab] = useState<TabType>('routes')
  const [legendVisible, setLegendVisible] = useState(false)

  // Custom hooks
  const { sectorsWithPhotos, mainCragImage } = useSectorPhotos(zoneData)
  const { selectedSectorId, currentSector, handleSectorPress } =
    useSectorSelection(sectorsWithPhotos, navigation, route.params.originTab)

  // Check if this is a crag without sectors but with routes (virtual sectors case)
  const hasNoSectorsButHasRoutes = useMemo(() => {
    if (!zoneData) return false
    const noSectors = !zoneData.sectors || zoneData.sectors.length === 0
    const hasRoutes =
      zoneData.crag?.numberRoutes && zoneData.crag.numberRoutes > 0
    return noSectors && hasRoutes
  }, [zoneData])

  // Auto-redirect to Sector screen with crag routes when no sectors exist
  useEffect(() => {
    if (hasNoSectorsButHasRoutes && zoneData?.crag) {
      // Replace current screen with Sector screen showing crag routes
      navigation.replace('Sector', {
        sectorId: zoneData.crag.id,
        sectorName: zoneData.crag.name,
        isCragRoutes: true,
        originTab: route.params.originTab,
      })
    }
  }, [hasNoSectorsButHasRoutes, zoneData, navigation, route.params.originTab])

  // Beta languages hook - use sector beta or crag beta
  const betaItems = useMemo<ParsedBetaDto[] | null>(() => {
    return (currentSector?.beta || zoneData?.crag?.beta) as
      | ParsedBetaDto[]
      | null
  }, [currentSector?.beta, zoneData?.crag?.beta])

  const {
    selectedLanguage,
    setSelectedLanguage,
    availableLanguages,
    betaToShow,
  } = useBetaLanguages(betaItems)

  // Directions hook
  const { directionsData, openInMaps, copyCoordinates } = useDirectionsData(
    sectorsWithPhotos,
    selectedSectorId,
    zoneData?.crag,
  )

  // Get coordinates for weather lookup - prefer current sector, fallback to crag
  const weatherCoordinates = useMemo(() => {
    if (currentSector?.latitude && currentSector?.longitude) {
      return {
        latitude: currentSector.latitude,
        longitude: currentSector.longitude,
        aspect: currentSector.aspect,
      }
    }
    if (zoneData?.crag?.latitude && zoneData?.crag?.longitude) {
      return {
        latitude: zoneData.crag.latitude,
        longitude: zoneData.crag.longitude,
        aspect: null,
      }
    }
    return null
  }, [currentSector, zoneData?.crag])

  // Climbing conditions hook - fetch real-time weather data
  const { data: climbingConditions, isLoading: isWeatherLoading } =
    useClimbingConditions({
      latitude: weatherCoordinates?.latitude,
      longitude: weatherCoordinates?.longitude,
      aspect: weatherCoordinates?.aspect,
      enabled: !!weatherCoordinates,
    })

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  // Get current image URL
  const currentImageUrl = currentSector?.imageUrl || mainCragImage
  const showGenericBadge = currentSector ? !currentSector.hasOwnPhoto : false

  // Loading state
  if (isLoading) {
    return (
      <CragLoadingSkeleton
        zoneName={zoneName}
        showBackButton
        onBack={handleBack}
      />
    )
  }

  // Error state
  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : t('crag.couldNotGetInfo')
    return (
      <ErrorState
        title={zoneName}
        message={errorMessage}
        actionLabel={t('common.back')}
        onAction={handleBack}
        showBackButton
        onBack={handleBack}
        icon={<AlertCircleOutlineIcon size={64} color={colors.grade.hard} />}
      />
    )
  }

  // Empty state
  if (!zoneData || !sectorsWithPhotos.length) {
    return (
      <EmptyState
        icon={<LayersOutlineIcon size={64} color={colors.text.muted} />}
        message={t('crag.noSectorsAvailable')}
        showHeader
        headerTitle={zoneName}
        headerSubtitle={zoneData?.crag?.name?.toUpperCase()}
        showBackButton
        onBack={handleBack}
      />
    )
  }

  return (
    <SafeAreaView style={sharedStyles.container} edges={['top']}>
      <ScreenHeader
        title={zoneName}
        subtitle={zoneData.crag.name.toUpperCase()}
        onBack={handleBack}
      />

      {/* Fixed Header with Image, Hero Card, Conditions, and Tabs */}
      <View style={sharedStyles.fixedHeader}>
        {/* Hero Image */}
        <CragHeroImage
          imageUrl={currentImageUrl}
          showGenericBadge={showGenericBadge}
        />

        {/* Hero Card - overlaps image with rounded top corners */}
        <CragHeroCard
          sector={currentSector}
          cragName={zoneData.crag.name}
          zoneName={zoneName}
        />

        {/* Weather/Conditions Badges */}
        <CragConditionsBadges
          sector={currentSector}
          currentWeather={climbingConditions?.current}
          isLoading={isWeatherLoading}
        />

        {/* Tab Bar */}
        <CragTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onHelpPress={() => setLegendVisible(true)}
        />
      </View>

      {/* Scrollable Content Area */}
      <View style={sharedStyles.scrollableContent}>
        {activeTab === 'routes' && (
          <RoutesTabContent
            sectors={sectorsWithPhotos}
            selectedSectorId={selectedSectorId}
            onSectorPress={handleSectorPress}
          />
        )}

        {activeTab === 'info' && (
          <InfoTabContent
            betaItems={betaToShow}
            availableLanguages={availableLanguages}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            sector={currentSector}
          />
        )}

        {activeTab === 'directions' && (
          <DirectionsTabContent
            directionsData={directionsData}
            sectors={sectorsWithPhotos}
            onOpenMaps={openInMaps}
            onCopyCoordinates={copyCoordinates}
          />
        )}
      </View>

      {/* Icons Legend Modal */}
      <SectorIconsLegend
        visible={legendVisible}
        onClose={() => setLegendVisible(false)}
      />
    </SafeAreaView>
  )
}

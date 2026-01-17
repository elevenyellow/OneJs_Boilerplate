import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  OptionsIcon,
  ScreenHeader,
  ErrorState,
  SkeletonList,
  CragListItemSkeleton,
} from '@/components/shared'
import {
  ExplorerFiltersModal,
  ExplorerMapView,
  LocationWarningBanner,
} from '@/components/explorer'
import type { SearchFiltersValues } from '@/components/explorer'
import { useCragSearch } from '@/hooks/useCragSearch'
import { usePreferences } from '@/contexts/PreferencesContext'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/navigation/types'
import { TouchableOpacity } from 'react-native'

interface MapScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Crag'>
}

export function MapScreen({ navigation }: MapScreenProps) {
  const { t } = useTranslation()
  const { preferences } = usePreferences()
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  // Use preferences for search defaults
  const preferenceDefaults = useMemo(
    () => ({
      radiusKm: preferences.defaultSearchRadiusKm,
    }),
    [preferences.defaultSearchRadiusKm],
  )

  const {
    sectors,
    isLoading,
    error,
    isError,
    hasLocationPermission,
    locationError,
    userLocation,
    refetch,
    updateSearchParams,
    searchParams,
  } = useCragSearch(undefined, preferenceDefaults)

  const handleSectorPress = useCallback(
    (sectorId: string, sectorName: string) => {
      navigation.navigate('Crag', {
        zoneId: sectorId,
        zoneName: sectorName,
        originTab: 'Map',
      })
    },
    [navigation],
  )

  const handleApplyFilters = useCallback(
    (filters: SearchFiltersValues) => {
      updateSearchParams({
        radiusKm: filters.radiusKm,
        minGradeBand: filters.minGradeBand,
        maxGradeBand: filters.maxGradeBand,
        exposurePreference: filters.exposurePreference,
        climbingStyles: filters.climbingStyles,
        minQualityRating: filters.minQualityRating,
      })
      setShowFiltersModal(false)
    },
    [updateSearchParams],
  )

  const handleOpenFilters = useCallback(() => {
    setShowFiltersModal(true)
  }, [])

  const handleCloseFilters = useCallback(() => {
    setShowFiltersModal(false)
  }, [])

  if (isLoading) {
    return (
      <SkeletonList
        count={6}
        ItemSkeleton={CragListItemSkeleton}
        headerTitle={`${t('explorer.searchingSectors')}...`}
      />
    )
  }

  if (isError && error) {
    return (
      <ErrorState
        title={t('common.error')}
        message={error.message}
        actionLabel={t('common.retry')}
        onAction={refetch}
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title={t('navigation.map')}
        showBackButton={false}
        rightActions={
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
            onPress={handleOpenFilters}
          >
            <OptionsIcon />
          </TouchableOpacity>
        }
      />

      {!hasLocationPermission && (
        <LocationWarningBanner errorType={locationError} />
      )}

      <ExplorerMapView
        sectors={sectors}
        userLocation={userLocation}
        onSectorPress={handleSectorPress}
        searchRadiusKm={searchParams.radiusKm}
      />

      <ExplorerFiltersModal
        visible={showFiltersModal}
        onClose={handleCloseFilters}
        searchParams={searchParams}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  )
}

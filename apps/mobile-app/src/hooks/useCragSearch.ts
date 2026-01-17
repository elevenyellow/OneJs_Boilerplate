import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { searchCrags } from '@/services/api/cragSearch'
import { ApiError } from '@/services/api/errors'
import { transformCragsToSectors } from '@/services/api/transformers'
import {
  getCurrentLocation,
  requestLocationPermission,
} from '@/services/location/locationService'
import { usePreferences } from '@/contexts/PreferencesContext'
import { devLog } from '@/utils/logger'
import type { GradeSystem } from '@/utils/grades'
import type { SectorUI } from '@/types/ui'
import type { SearchCragsRequestDto } from '@/types/api'

/**
 * Search parameters for crag search
 * Uses gradeBand indices (10-52) instead of grade strings
 */
export interface CragSearchParams {
  radiusKm?: number
  minGradeBand?: number
  maxGradeBand?: number
  seasonPreference?: 'summer' | 'winter' | 'any'
  limit?: number
  // NEW FILTERS - Phase 1
  exposurePreference?: 'sun' | 'shade' | 'any'
  climbingStyles?: string[]
  minQualityRating?: number
}

/**
 * Default search parameters
 * These are fallback values when preferences aren't loaded yet
 * GradeBand values: 24 = 6a (French), 32 = 7b (French)
 */
const DEFAULT_SEARCH_PARAMS: Required<
  Omit<
    CragSearchParams,
    | 'seasonPreference'
    | 'exposurePreference'
    | 'climbingStyles'
    | 'minQualityRating'
  >
> & {
  seasonPreference: 'any'
  exposurePreference: 'any'
  climbingStyles: string[]
  minQualityRating: number
} = {
  radiusKm: 50,
  minGradeBand: 24, // 6a in French
  maxGradeBand: 32, // 7b in French
  seasonPreference: 'any',
  limit: 20,
  // NEW FILTERS - Phase 1 defaults
  exposurePreference: 'any',
  climbingStyles: [],
  minQualityRating: 0,
}

/**
 * Interface for preference-based defaults (optional)
 */
export interface SearchPreferenceDefaults {
  radiusKm?: number
}

/**
 * Hook return type
 */
export interface UseCragSearchResult {
  // Data
  sectors: SectorUI[]

  // Loading states
  isLoading: boolean
  isRefetching: boolean

  // Error states
  error: ApiError | null
  isError: boolean

  // Location info
  userLocation: { latitude: number; longitude: number } | null
  hasLocationPermission: boolean
  locationError: 'permission' | 'disabled' | 'timeout' | null

  // Actions
  refetch: () => void
  updateSearchParams: (params: Partial<CragSearchParams>) => void

  // Search params
  searchParams: CragSearchParams
}

/**
 * Custom hook for searching crags with scoring
 *
 * Features:
 * - Automatic GPS location detection
 * - Configurable search parameters (radius, grades, season)
 * - TanStack Query caching and refetching
 * - Error handling for network and permission issues
 * - Transforms backend DTOs to UI models
 * - Integrates with user preferences for default values
 *
 * @param initialParams Optional initial search parameters
 * @param preferenceDefaults Optional defaults from user preferences
 * @returns Search results and state
 */
export function useCragSearch(
  initialParams?: Partial<CragSearchParams>,
  preferenceDefaults?: SearchPreferenceDefaults,
): UseCragSearchResult {
  // Get user's preferred grading system for display
  const { preferences } = usePreferences()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem

  // Merge preference defaults with hardcoded defaults (memoized)
  const effectiveDefaults = useMemo(
    () => ({
      ...DEFAULT_SEARCH_PARAMS,
      ...(preferenceDefaults?.radiusKm && {
        radiusKm: preferenceDefaults.radiusKm,
      }),
    }),
    [preferenceDefaults?.radiusKm],
  )
  // Location state
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [locationReady, setLocationReady] = useState(false)
  const [locationError, setLocationError] = useState<
    'permission' | 'disabled' | 'timeout' | null
  >(null)

  // Search parameters state - use effective defaults (includes preferences)
  const [searchParams, setSearchParams] = useState<CragSearchParams>({
    ...effectiveDefaults,
    ...initialParams,
  })

  // Request location permission and get coordinates on mount
  useEffect(() => {
    let mounted = true

    async function initializeLocation() {
      devLog.log('📍 [useCragSearch] Initializing location...')

      try {
        // Request permission
        const permission = await requestLocationPermission()
        devLog.log('📍 [useCragSearch] Permission granted:', permission.granted)

        if (!mounted) return

        setHasLocationPermission(permission.granted)

        // Get location
        const location = await getCurrentLocation()
        devLog.log('📍 [useCragSearch] Location obtained:', location)

        if (!mounted) return

        setUserLocation(location)
        setLocationReady(true)
        setLocationError(null) // Clear any previous errors
      } catch (error) {
        devLog.error('❌ [useCragSearch] Failed to initialize location:', error)

        if (!mounted) return

        // Categorize error type
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        if (errorMessage.includes('permission not granted')) {
          setLocationError('permission')
        } else if (errorMessage.includes('services disabled')) {
          setLocationError('disabled')
        } else if (errorMessage.includes('timeout')) {
          setLocationError('timeout')
        } else {
          setLocationError('timeout') // Unknown errors treated as timeout
        }

        setHasLocationPermission(false)
        setLocationReady(true) // Ready, but no location (will show error state)
      }
    }

    initializeLocation()

    return () => {
      mounted = false
    }
  }, [])

  // Build search request (memoized)
  const searchRequest: SearchCragsRequestDto | null = useMemo(() => {
    if (!userLocation) return null
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radiusKm: searchParams.radiusKm ?? effectiveDefaults.radiusKm,
      minGradeBand: searchParams.minGradeBand ?? effectiveDefaults.minGradeBand,
      maxGradeBand: searchParams.maxGradeBand ?? effectiveDefaults.maxGradeBand,
      seasonPreference: searchParams.seasonPreference,
      limit: searchParams.limit ?? effectiveDefaults.limit,
      // NEW FILTERS - Phase 1
      exposurePreference: searchParams.exposurePreference,
      climbingStyles: searchParams.climbingStyles,
      minQualityRating: searchParams.minQualityRating,
    }
  }, [userLocation, searchParams, effectiveDefaults])

  devLog.log('🔍 [useCragSearch] Search request:', searchRequest)
  devLog.log('🔍 [useCragSearch] Location ready:', locationReady)
  devLog.log(
    '🔍 [useCragSearch] Query enabled:',
    locationReady && searchRequest !== null,
  )

  // Query for crag search
  // Include gradeSystem in queryKey to re-transform when user changes preference
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['cragSearch', searchRequest, gradeSystem],
    queryFn: async () => {
      devLog.log('🚀 [useCragSearch] Query function executing...')

      if (!searchRequest) {
        devLog.error('❌ [useCragSearch] No search request available')
        throw new Error('Location not available')
      }

      devLog.log('🚀 [useCragSearch] Calling searchCrags with:', searchRequest)
      const response = await searchCrags(searchRequest)

      devLog.log(
        '✅ [useCragSearch] Transform response:',
        response.results.length,
        'crags',
      )
      // Transform with user's preferred grading system for display
      const sectors = transformCragsToSectors(response.results, gradeSystem)

      devLog.log('✅ [useCragSearch] Transformed to', sectors.length, 'sectors')
      return sectors
    },
    enabled: locationReady && searchRequest !== null,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
    retry: 2,
    // Keep showing previous data while fetching new results for smoother UX
    placeholderData: keepPreviousData,
  })

  devLog.log('📊 [useCragSearch] Query state:', {
    isLoading,
    isError,
    hasData: !!data,
    dataLength: data?.length || 0,
  })

  // Update search parameters (stable callback)
  const updateSearchParams = useCallback(
    (params: Partial<CragSearchParams>) => {
      devLog.log('🔄 [useCragSearch] Updating search params:', params)
      setSearchParams((prev) => ({
        ...prev,
        ...params,
      }))
    },
    [],
  )

  // Stable refetch callback
  const handleRefetch = useCallback(() => {
    devLog.log('🔄 [useCragSearch] Manual refetch triggered')
    refetch()
  }, [refetch])

  // Memoize the return value to prevent object recreation
  return useMemo(
    () => ({
      // Data
      sectors: data ?? [],

      // Loading states
      isLoading: !locationReady || isLoading,
      isRefetching,

      // Error states
      error: error as ApiError | null,
      isError,

      // Location info
      userLocation,
      hasLocationPermission,
      locationError,

      // Actions
      refetch: handleRefetch,
      updateSearchParams,

      // Search params
      searchParams,
    }),
    [
      data,
      locationReady,
      isLoading,
      isRefetching,
      error,
      isError,
      userLocation,
      hasLocationPermission,
      locationError,
      handleRefetch,
      updateSearchParams,
      searchParams,
    ],
  )
}

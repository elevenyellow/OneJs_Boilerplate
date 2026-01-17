import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList, MainTabParamList } from '@/navigation/types'

export type ExplorerNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Explorer'>,
  NativeStackNavigationProp<RootStackParamList>
>

export interface SearchFiltersValues {
  radiusKm: number
  minGradeBand: number
  maxGradeBand: number
  // NEW FILTERS - Phase 1
  exposurePreference?: 'sun' | 'shade' | 'any'
  climbingStyles?: string[]
  minQualityRating?: number
}

export interface ExplorerSearchParams {
  radiusKm?: number
  minGradeBand?: number
  maxGradeBand?: number
  // NEW FILTERS - Phase 1
  exposurePreference?: 'sun' | 'shade' | 'any'
  climbingStyles?: string[]
  minQualityRating?: number
}

/**
 * Sort options for explorer results
 */
export type SortOption =
  | 'bestMatch' // totalScore descending
  | 'distance' // distanceKm ascending
  | 'quality' // qualityRating descending
  | 'popularity' // popularityScore descending
  | 'routeCount' // routeCount descending
  | 'name' // name ascending (A-Z)

/**
 * Array of all sort options in cycle order
 */
export const SORT_OPTIONS: SortOption[] = [
  'bestMatch',
  'distance',
  'quality',
  'popularity',
  'routeCount',
  'name',
]

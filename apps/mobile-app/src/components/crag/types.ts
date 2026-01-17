import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/navigation/types'
import type { ParsedBetaDto } from '@/types/api'

export interface SectorWithPhoto {
  id: string
  externalId: string
  name: string
  numberRoutes: number
  hasSubSectors: boolean
  hasTopo: boolean
  depth: number
  imageUrl: string
  hasOwnPhoto: boolean
  numberTopos: number | null
  kudos: number | null
  subAreaCount: number | null
  averageHeight: number | null
  averageHeightUnit: string | null
  aspect: string | null
  walkInTime: string | null
  climbingStyle: string | null
  tagFamily: string | null
  tagWeather: string[] | null
  tagCrowds: string | null
  gbRoutes: number[] | null
  gbAscents: number[] | null
  // Grade range as gradeBand indices - use formatGradeRangeFromBands() to display
  minGradeBand: number | null
  maxGradeBand: number | null
  aspectLabel: string | null
  walkInTimeLabel: string | null
  familyLabel: string | null
  weatherLabels: string[] | null
  crowdsLabel: string | null
  starRating: number
  latitude: number | null
  longitude: number | null
  approach: string | null
  beta: ParsedBetaDto[] | null
}

export type TabType = 'routes' | 'info' | 'directions'

export interface DirectionsData {
  latitude: number
  longitude: number
  name: string
  approach: string | null
  walkInTime: string | null
}

export interface LanguageOption {
  code: string
  flag: string
  name: string
  betaItems: ParsedBetaDto[]
}

export type CragNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Crag'
>

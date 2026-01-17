import type {
  AspectDirection,
  ClimbingStyle,
  CrowdLevel,
  FamilyFriendly,
  GeometryData,
  TagsData,
  WalkInTime,
  WeatherCondition,
} from '../value-objects'

export interface BetaItemData {
  markdown: string
  name: string
  inheritedFrom?: {
    id: string
    urlAncestorStub: string
  }
}

export interface StyleInfoData {
  gradeBand: number[]
  label: string
  style: string
  total: number
  translate_stub: string
}

export interface AltNameData {
  name: string
  type: string
}

export interface SectorCreateDto {
  id: string
  externalId: string | number
  name: string
  asciiName?: string | null
  type: string
  subType: string
  urlStub?: string | null
  urlAncestorStub?: string | null
  headerImage?: string | null
  coverImage?: string | null
  thumbnail?: string | null
  approach?: string | null
  latitude?: number | null
  longitude?: number | null
  geometry?: GeometryData | null
  depth: number
  parentId?: string | null
  cragId: string
  externalParentId?: string | null
  numberRoutes?: number | null
  numberPhotos?: number | null
  numberTopos?: number | null
  ascentCount?: number | null
  kudos?: number | null // Favorites count
  maxPop?: number | null
  subAreaCount?: number | null
  averageHeight?: number | null
  averageHeightUnit?: string | null
  seasonality?: number[] | null
  tags?: TagsData | null
  // Atomic tag values (normalized for efficient filtering)
  tagAspect?: AspectDirection | null
  tagWalkInTime?: WalkInTime | null
  tagFamily?: FamilyFriendly | null
  tagWeather?: WeatherCondition[] | null
  tagCrowds?: CrowdLevel | null
  tagStyle?: ClimbingStyle | null
  beta?: BetaItemData[] | null
  styles?: StyleInfoData[] | null
  altNames?: AltNameData[] | null
  gbRoutes?: number[] | null
  hasTopo?: boolean
  hasSubSectors?: boolean
  createdAt?: Date
  updatedAt?: Date
}

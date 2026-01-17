import type {
  AltName,
  BetaItem,
  GeometryData,
  StyleInfo,
  TagsMap,
} from '../value-objects'

export interface CragCreateDto {
  id: string
  externalId: string | number
  zoneId: string
  name: string
  asciiName?: string | null
  type: string
  subType: string
  urlStub?: string | null
  urlAncestorStub?: string | null
  headerImage?: string | null
  latitude?: number | null
  longitude?: number | null
  areaSize?: number | null
  geometry?: GeometryData | null
  numberRoutes?: number | null
  numberPhotos?: number | null
  numberTopos?: number | null
  ascentCount?: number | null
  kudos?: number | null // Favorites count
  overallScore?: number | null // 0-3 overall crag rating
  qualityRating?: number | null // 0-3 quality rating based on route stars
  popularityScore?: number | null // 0-3 popularity score based on ascents
  averageHeight?: number | null
  averageHeightUnit?: string | null
  gbRoutes?: number[] | null
  beta?: BetaItem[] | null
  styles?: StyleInfo[] | null
  tags?: TagsMap | null
  altNames?: AltName[] | null
  seasonality?: number[] | null
  hasTopo?: boolean
  hasSectors?: boolean
  createdAt?: Date
  updatedAt?: Date
}

import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Get the API URL based on platform
// - Production: uses https://climb-zone.onrender.com/api (configured in app.json)
// - Development: always uses local API
// - Android Emulator: 10.0.2.2 is the special IP that routes to host machine's localhost
// - iOS Simulator: localhost works fine
const getApiBaseUrl = (): string => {
  const configUrl = Constants.expoConfig?.extra?.apiUrl

  // In production builds, always use the configured URL (production server)
  if (!__DEV__) {
    return configUrl || 'https://climb-zone.onrender.com/api'
  }

  // Development mode: always use local API
  if (Platform.OS === 'android') {
    // Android Emulator uses 10.0.2.2 to reach host machine's localhost
    return 'http://192.168.8.178:4000/api'
  }

  // iOS Simulator and web can use localhost directly
  return 'http://localhost:4000/api'
}

const API_BASE_URL = getApiBaseUrl()

// Log API URL on startup
console.log('[API] Base URL:', API_BASE_URL)

// Sector search types
export interface SearchSectorsDto {
  userLocation: { lat: number; lon: number }
  maxDistance?: number
  gradeRange: { min: string; max: string }
  forceOrientation?: 'sun' | 'shade' | 'any'
  minRoutes?: number
  rockTypes?: string[]
  climbingStyles?: string[]
  hasTopo?: boolean
  requiresNoPermit?: boolean
  limit?: number
  offset?: number
}

export interface RouteSearchInfo {
  id: string
  externalId: number
  name: string
  grade: string | null
  gradeIndex: number | null
  height: number | null
  pitches: number | null
  bolts: number | null
  stars: number | null
  quality: number | null
  ascents: number | null
  subType: string | null
  firstAscent: string | null
  topoNumber: string | null
}

// Topo types
export interface TopoRoutePosition {
  routeId: string
  routeExternalId: number
  topoNumber: string
  points: string
  gradeClass: string | null
  name: string
  grade: string | null
}

export interface TopoImage {
  id: string
  externalId: string
  sectorId: string
  thumbnailUrl: string
  fullImageUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  viewScale: number
  routes: TopoRoutePosition[]
}

export interface SearchSectorResult {
  sector: any // Full sector entity
  relevanceScore: number
  distance: number
  routesInUserRange: number
  matchReasons: string[]
  scoringBreakdown: {
    gradeMatch: number
    distance: number
    orientation: number
    popularity: number
    routeCount: number
    quality: number
  }
  conditions?: {
    weatherScore: number // 0-100 - real-time weather
    seasonalityScore: number // 0-100 - TheCrag historical data
    orientationBonus: number // 0-10 - orientation match bonus
    combinedScore: number // weighted combination
    reasons: string[]
    isGoodDay: boolean
  }
}

export interface CragInfo {
  id: string
  name: string
  altNames: string[]
  latitude: number | null
  longitude: number | null
  description: string | null
  approach: string | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  totalFavorites: number | null
  urlStub: string | null
  priceCategory: string | null
  headerImageUrl: string | null
  headerImageWidth: number | null
  headerImageHeight: number | null
}

export interface CragWithSectors {
  crag: CragInfo
  sectors: SearchSectorResult[]
  avgRelevanceScore: number
  totalRoutesInRange: number
  distance: number
  totalSectorsInCrag: number
}

export interface SearchSectorsResponse {
  results: CragWithSectors[]
  total: number
  totalSectors: number
  totalRoutes: number // Total routes across all sectors
  totalRoutesInRange: number // Total routes in user's grade range
  filters: SearchSectorsDto
  metadata: {
    searchTime: number
    preferredOrientation: 'sun' | 'shade' | 'any'
    weather?: {
      temperature: number
      conditions: string
      isGoodForClimbing: boolean
    }
  }
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'An error occurred' }))
      console.error('[API] Error:', response.status, error)
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const json = await response.json()

    // API wraps responses in { success, data, message, timestamp }
    // Extract the data if it's wrapped, otherwise return as-is
    if (
      json &&
      typeof json === 'object' &&
      'success' in json &&
      'data' in json
    ) {
      if (!json.success) {
        console.error('[API] API failure:', json.message)
        throw new Error(json.message || 'API request failed')
      }
      return json.data as T
    }

    return json as T
  } catch (error) {
    console.error('[API] Error:', endpoint, error)
    throw error
  }
}

// Zone types
export interface Zone {
  id: string
  name: string
  country: string
  region: string
  coordinates: {
    latitude: number
    longitude: number
  }
  climbingTypes: string[]
  totalRoutes: number
  imageUrl?: string
  distance?: number
}

export interface ZoneDetail extends Zone {
  description: string
  gradeRange: {
    min: string
    max: string
    system: string
  }
  stats: {
    totalRoutes: number
    routesByType: Record<string, number>
    gradeDistribution: Record<string, number>
  }
  theCragUrl: string
  altitude?: number
  approach?: string
  bestSeasons?: string[]
}

export interface ZoneFilters {
  country?: string
  region?: string
  climbingTypes?: string[]
  minRoutes?: number
  search?: string
  limit?: number
  offset?: number
}

// Weather types
export interface DailyForecast {
  date: string
  sunrise: string
  sunset: string
  tempMin: number
  tempMax: number
  humidity: number
  precipitation: number
  precipitationProbability: number
  condition: string
  windSpeed: number
  windGust: number
  uvIndex: number
  climbingCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable'
}

export interface Forecast {
  id: string
  zoneId: string
  zoneName: string
  daily: DailyForecast[]
  fetchedAt: string
  source: string
}

export interface ForecastSummary {
  zoneId: string
  zoneName: string
  today: DailyForecast | null
  nextDays: DailyForecast[]
  bestClimbingDay: DailyForecast | null
  isStale: boolean
}

// Weather by coordinates response (from Meteoblue)
export interface CoordinatesWeatherHourly {
  timestamp: string
  temperature: number
  feelsLike: number
  windSpeed: number
  windDirection: string
  windGust: number
  precipitation: number
  humidity: number
  weatherCode: number
  uvIndex: number
  isDaylight: boolean
}

export interface CoordinatesWeatherDaily {
  date: string
  temperature: {
    min: number
    max: number
    mean: number
  }
  feelsLike: {
    min: number
    max: number
    mean: number
  }
  wind: {
    min: number
    max: number
    mean: number
    direction: string
  }
  precipitation: {
    amount: number
    probability: number
  }
  humidity: {
    min: number
    max: number
    mean: number
  }
  weatherCode: number
  uvIndex: number
  sunrise: string
  sunset: string
  sunshineMinutes: number
  predictability: number
}

export interface CoordinatesWeatherData {
  metadata: {
    location: string
    coordinates: {
      lat: number
      lon: number
    }
    timezone: string
    lastUpdate: string
    generationTimeMs: number
  }
  current: {
    timestamp: string
    temperature: number
    feelsLike?: number
    windSpeed: number
    windDirection?: string
    humidity?: number
    pressure?: number
    weatherCode: number
    isDaylight: boolean
    uvIndex?: number
  }
  hourly: CoordinatesWeatherHourly[]
  daily: CoordinatesWeatherDaily[]
}

// Crag list types (for nearby search)
export interface NearbyCrag {
  id: string
  name: string
  altNames: string[]
  latitude: number | null
  longitude: number | null
  distance: number | null // km from user
  description: string | null
  numberRoutes: number | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  totalFavorites: number | null
  urlStub: string | null
}

export interface NearbyCragsResponse {
  results: NearbyCrag[]
  total: number
  filters: {
    latitude: number
    longitude: number
    maxDistance: number
    search: string | null
  }
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface NearbyCragsFilters {
  lat: number
  lon: number
  maxDistance?: number
  search?: string
  limit?: number
  offset?: number
}

// Crag detail types
export interface SectorSummary {
  id: string
  name: string
  orientation: string | null
  rockType: string | null
  sunExposure: string | null
  routeCount: number
  routesInGradeRange: number
  minGrade: string | null
  maxGrade: string | null
  avgGrade: string | null // Average grade of routes
  avgHeight: number | null // Average height of routes in meters
  maxHeight: number | null // Maximum height of routes in meters
  totalFavorites: number | null
  hasTopo: boolean
  theCragUrl: string | null
  headerImageUrl: string | null
  score: number
  // Stats for client-side calculations
  gradeDistribution: Record<string, number> // {"6a": 5, "6b": 12, ...}
  avgStars: number | null // Average star rating (0-5)
}

export interface RouteHighlight {
  id: string
  name: string
  grade: string | null
  gradeIndex: number | null
  stars: number | null
  ascents: number | null
  height: number | null
  routeType: string | null
  sectorId: string
  sectorName: string
}

export interface CragDetailHourlyForecast {
  timestamp: string
  temperature: number
  feelsLike: number
  windSpeed: number
  windDirection: string
  windGust: number
  precipitation: number
  humidity: number
  weatherCode: number
  uvIndex: number
  isDaylight: boolean
}

export interface CragDetailForecast {
  date: string
  temperature: {
    min: number
    max: number
    mean: number
  }
  feelsLike: {
    min: number
    max: number
    mean: number
  }
  wind: {
    min: number
    max: number
    mean: number
    direction: string
  }
  precipitation: {
    amount: number
    probability: number
  }
  humidity: {
    min: number
    max: number
    mean: number
  }
  weatherCode: number
  uvIndex: number
  sunrise: string
  sunset: string
  sunshineMinutes: number
  predictability: number
}

export interface CragDetail {
  id: string
  name: string
  description: string | null
  approach: string | null
  country: string
  region: string | null
  latitude: number | null
  longitude: number | null
  altitude: number | null
  totalSectors: number
  totalRoutes: number
  totalRoutesInRange: number
  totalFavorites: number | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  theCragUrl: string | null
  headerImageUrl: string | null
  forecast: CragDetailForecast[] | null
  hourlyForecast: CragDetailHourlyForecast[] | null
  sectors: SectorSummary[]
  topRoutes: RouteHighlight[]
  bestSeasons: number[]
}

// API functions
export const api = {
  zones: {
    getAll: (filters?: ZoneFilters) => {
      const params = new URLSearchParams()
      if (filters?.country) params.set('country', filters.country)
      if (filters?.region) params.set('region', filters.region)
      if (filters?.climbingTypes?.length)
        params.set('climbingTypes', filters.climbingTypes.join(','))
      if (filters?.minRoutes)
        params.set('minRoutes', filters.minRoutes.toString())
      if (filters?.search) params.set('search', filters.search)
      if (filters?.limit) params.set('limit', filters.limit.toString())
      if (filters?.offset) params.set('offset', filters.offset.toString())

      const query = params.toString()
      return fetcher<Zone[]>(`/zones${query ? `?${query}` : ''}`)
    },

    getById: (id: string) => fetcher<ZoneDetail>(`/zones/${id}`),

    getNearby: (lat: number, lng: number, radiusKm = 50, limit = 20) =>
      fetcher<Zone[]>(
        `/zones/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}&limit=${limit}`,
      ),

    search: (query: string, filters?: ZoneFilters) =>
      fetcher<Zone[]>('/zones/search', {
        method: 'POST',
        body: JSON.stringify({ query, filters }),
      }),
  },

  weather: {
    getForecast: (zoneId: string, days = 7, includeHourly = false) =>
      fetcher<Forecast>(
        `/zones/${zoneId}/weather?days=${days}&hourly=${includeHourly}`,
      ),

    getSummary: (zoneId: string) =>
      fetcher<ForecastSummary>(`/zones/${zoneId}/weather/summary`),

    getByCoordinates: (lat: number, lon: number) =>
      fetcher<CoordinatesWeatherData>(
        `/weather/coordinates?lat=${lat}&lon=${lon}`,
      ),
  },

  sectors: {
    search: (filters: SearchSectorsDto) => {
      // Clean up empty array filters that would cause no results
      // rockTypes and climbingStyles are not populated in the DB yet
      const cleanedFilters = { ...filters }
      delete cleanedFilters.rockTypes
      delete cleanedFilters.climbingStyles

      return fetcher<SearchSectorsResponse>('/sectors/search', {
        method: 'POST',
        body: JSON.stringify(cleanedFilters),
      })
    },

    getRoutes: (
      sectorId: string,
      options?: { minStars?: number; limit?: number },
    ) => {
      const params = new URLSearchParams()
      if (options?.minStars) params.set('minStars', options.minStars.toString())
      if (options?.limit) params.set('limit', options.limit.toString())
      const query = params.toString()
      return fetcher<{
        sectorId: string
        total: number
        routes: RouteSearchInfo[]
      }>(`/sectors/${sectorId}/routes${query ? `?${query}` : ''}`)
    },

    getTopos: (sectorId: string) =>
      fetcher<{ sectorId: string; topos: TopoImage[] }>(
        `/sectors/${sectorId}/topos`,
      ),
  },

  topos: {
    getBySectorId: (sectorId: string) =>
      fetcher<{ sectorId: string; topos: TopoImage[] }>(
        `/sectors/${sectorId}/topos`,
      ),

    getByRouteId: (routeId: string) =>
      fetcher<{ routeId: string; topos: TopoImage[] }>(
        `/routes/${routeId}/topos`,
      ),
  },

  crags: {
    /**
     * Get all crags within distance range with optional search
     * This is a simple list without scoring/recommendations
     */
    getNearby: (filters: NearbyCragsFilters) => {
      const params = new URLSearchParams()
      params.set('lat', filters.lat.toString())
      params.set('lon', filters.lon.toString())
      if (filters.maxDistance)
        params.set('maxDistance', filters.maxDistance.toString())
      if (filters.search) params.set('search', filters.search)
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.offset) params.set('offset', filters.offset.toString())

      return fetcher<NearbyCragsResponse>(`/crags/nearby?${params.toString()}`)
    },

    /**
     * Get detailed crag information
     * Note: Grade filtering is now done client-side using gradeDistribution
     */
    getById: (id: string) => {
      return fetcher<CragDetail>(`/crags/${id}`)
    },
  },
}

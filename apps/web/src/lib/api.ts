const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  const json: ApiResponse<T> = await response.json()
  return json.data
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

    getCountries: () => fetcher<string[]>('/zones/countries'),
    getRegions: (country?: string) =>
      fetcher<string[]>(
        `/zones/regions${country ? `?country=${country}` : ''}`,
      ),
  },

  weather: {
    getForecast: (zoneId: string, days = 7, includeHourly = false) =>
      fetcher<Forecast>(
        `/zones/${zoneId}/weather?days=${days}&hourly=${includeHourly}`,
      ),

    getSummary: (zoneId: string) =>
      fetcher<ForecastSummary>(`/zones/${zoneId}/weather/summary`),
  },
}

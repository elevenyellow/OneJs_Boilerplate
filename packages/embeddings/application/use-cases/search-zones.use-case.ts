import { Grade } from '@climb-zone/shared'
import { IEmbeddingService } from '../../domain/interfaces/embedding-service.interface'
import {
  IEmbeddingRepository,
  VectorSearchFilters,
} from '../../domain/interfaces/embedding-repository.interface'
import { EmbeddingVector } from '../../domain/value-objects/embedding-vector.vo'

/**
 * Search query parameters
 */
export interface SearchZonesQuery {
  // Semantic search (natural language)
  query?: string // e.g., "sport climbing on vertical walls with 6a-6c routes"

  // Geographic filters
  userLocation?: { lat: number; lon: number }
  maxDistance?: number // kilometers

  // Climbing grade filters
  gradeRange?: { min: string; max: string }
  minRoutes?: number
  routeTypes?: ('sport' | 'trad' | 'boulder' | 'multipitch')[]

  // Temporal filters
  month?: number // 1-12
  seasonPreference?: 'summer' | 'winter' | 'spring' | 'fall'

  // Technical filters
  orientations?: string[] // ['N', 'NE', 'E', ...]
  rockTypes?: string[]
  climbingStyles?: string[]

  // Quality filters
  minQuality?: number // 0-1
  minPopularity?: number // 0-1
  hasTopos?: boolean
  requiresPermit?: boolean

  // Pagination
  limit?: number
  offset?: number
}

/**
 * Search result with scoring
 */
export interface SearchResult {
  zoneId: string
  zoneName: string
  zoneType: 'crag' | 'sector' | 'area'
  similarity: number
  finalScore: number
  distance?: number // kilometers from user
  metadata: {
    location: { lat: number; lon: number }
    routeCount: number
    gradeRange: string
    bestMonths: number[]
    orientations: string[]
    rockTypes: string[]
    popularity: number
    quality: number
    hasTopos: boolean
    hasPhotos: boolean
  }
  preview: string
}

/**
 * Search Zones Use Case
 * Performs hybrid search: semantic similarity + structured filters + geo-distance
 */
export class SearchZonesUseCase {
  constructor(
    private embeddingService: IEmbeddingService,
    private embeddingRepository: IEmbeddingRepository,
  ) {}

  async execute(query: SearchZonesQuery): Promise<SearchResult[]> {
    console.log('🔍 Searching zones with query:', query)

    // 1. Generate query embedding if text search is provided
    let queryEmbedding: EmbeddingVector | null = null
    if (query.query) {
      const enrichedQuery = this.enrichQuery(query)
      console.log(`   Enriched query: "${enrichedQuery}"`)
      
      const embeddingArray = await this.embeddingService.generateEmbedding(
        enrichedQuery,
      )
      queryEmbedding = EmbeddingVector.create(embeddingArray)
    } else {
      // Use zero vector if no text query (filter-only search)
      queryEmbedding = EmbeddingVector.createEmpty(
        this.embeddingService.getDimensions(),
      )
    }

    // 2. Build filters from query parameters
    const filters = this.buildFilters(query)

    // 3. Perform vector search with filters
    const candidates = await this.embeddingRepository.search(
      queryEmbedding,
      filters,
      query.limit || 50, // Get more candidates for re-ranking
    )

    console.log(`   Found ${candidates.length} candidates`)

    // 4. Calculate final scores with re-ranking
    const scored = candidates.map((candidate) => ({
      candidate,
      finalScore: this.calculateFinalScore(candidate, query),
      geoDistance: query.userLocation
        ? this.calculateDistance(
            query.userLocation,
            candidate.embedding.metadata.location,
          )
        : undefined,
    }))

    // 5. Sort by final score and apply pagination
    const sorted = scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(query.offset || 0, (query.offset || 0) + (query.limit || 20))

    // 6. Format results
    return sorted.map((item) => this.formatResult(item))
  }

  /**
   * Enrich query with contextual information
   */
  private enrichQuery(query: SearchZonesQuery): string {
    const parts: string[] = []

    if (query.query) {
      parts.push(query.query)
    }

    if (query.gradeRange) {
      parts.push(
        `climbing grades between ${query.gradeRange.min} and ${query.gradeRange.max}`,
      )
    }

    if (query.month) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ]
      parts.push(`good for climbing in ${monthNames[query.month - 1]}`)
    }

    if (query.orientations && query.orientations.length > 0) {
      parts.push(`orientation ${query.orientations.join(' or ')}`)
    }

    if (query.rockTypes && query.rockTypes.length > 0) {
      parts.push(`rock type ${query.rockTypes.join(' or ')}`)
    }

    if (query.climbingStyles && query.climbingStyles.length > 0) {
      parts.push(`climbing style ${query.climbingStyles.join(' or ')}`)
    }

    if (query.routeTypes && query.routeTypes.length > 0) {
      const typeNames = {
        sport: 'sport climbing bolted routes',
        trad: 'traditional climbing',
        boulder: 'bouldering',
        multipitch: 'multi-pitch climbing',
      }
      const types = query.routeTypes
        .map((t) => typeNames[t])
        .filter(Boolean)
      parts.push(types.join(' or '))
    }

    return parts.join(', ')
  }

  /**
   * Build vector search filters from query
   */
  private buildFilters(query: SearchZonesQuery): VectorSearchFilters {
    const filters: VectorSearchFilters = {}

    // Geographic bounding box
    if (query.userLocation && query.maxDistance) {
      const bbox = this.calculateBoundingBox(
        query.userLocation,
        query.maxDistance,
      )
      filters.latitude = { gte: bbox.minLat, lte: bbox.maxLat }
      filters.longitude = { gte: bbox.minLon, lte: bbox.maxLon }
    }

    // Grade range filter
    if (query.gradeRange) {
      const minIndex = Grade.calculateIndexFromString(query.gradeRange.min)
      const maxIndex = Grade.calculateIndexFromString(query.gradeRange.max)

      if (minIndex !== null && maxIndex !== null) {
        filters.minGradeIndex = { lte: maxIndex }
        filters.maxGradeIndex = { gte: minIndex }
      }
    }

    // Route count filter
    if (query.minRoutes) {
      filters.routeCount = { gte: query.minRoutes }
    }

    // Seasonality filter
    if (query.month) {
      filters.monthScore = {
        month: query.month,
        gte: 0.6, // Minimum normalized score for "good" month
      }
    }

    // Characteristic filters
    if (query.orientations && query.orientations.length > 0) {
      filters.orientations = { in: query.orientations }
    }

    if (query.rockTypes && query.rockTypes.length > 0) {
      filters.rockTypes = { in: query.rockTypes }
    }

    if (query.climbingStyles && query.climbingStyles.length > 0) {
      filters.climbingStyles = { in: query.climbingStyles }
    }

    // Quality filters
    if (query.minPopularity !== undefined) {
      filters.popularity = { gte: query.minPopularity }
    }

    if (query.minQuality !== undefined) {
      filters.quality = { gte: query.minQuality }
    }

    // Boolean filters
    if (query.hasTopos !== undefined) {
      filters.hasTopos = query.hasTopos
    }

    if (query.requiresPermit !== undefined) {
      filters.requiresPermit = query.requiresPermit
    }

    // Route type filters
    if (query.routeTypes) {
      if (query.routeTypes.includes('sport')) {
        filters.hasSport = true
      }
      if (query.routeTypes.includes('trad')) {
        filters.hasTrad = true
      }
      if (query.routeTypes.includes('boulder')) {
        filters.hasBoulder = true
      }
      if (query.routeTypes.includes('multipitch')) {
        filters.hasMultiPitch = true
      }
    }

    return filters
  }

  /**
   * Calculate final score combining multiple factors
   */
  private calculateFinalScore(
    candidate: any,
    query: SearchZonesQuery,
  ): number {
    const weights = {
      semantic: query.query ? 0.4 : 0.1, // Higher weight if text query provided
      distance: query.userLocation ? 0.3 : 0.1,
      seasonality: query.month ? 0.15 : 0.1,
      quality: 0.15,
    }

    let score = 0

    // 1. Semantic similarity
    score += (candidate.similarity || 0.5) * weights.semantic

    // 2. Geographic distance (inverse)
    if (query.userLocation) {
      const distance = this.calculateDistance(
        query.userLocation,
        candidate.embedding.metadata.location,
      )
      const maxDistance = query.maxDistance || 500
      const distanceScore = Math.max(0, 1 - distance / maxDistance)
      score += distanceScore * weights.distance
    } else {
      score += 0.5 * weights.distance
    }

    // 3. Seasonality match
    if (query.month) {
      const monthScore =
        candidate.embedding.metadata.seasonality.scores[query.month - 1] || 0.5
      score += monthScore * weights.seasonality
    } else {
      score += 0.5 * weights.seasonality
    }

    // 4. Quality/Popularity
    const qualityScore =
      (candidate.embedding.metadata.quality.rating || 0.5) * 0.5 +
      (candidate.embedding.metadata.quality.popularity || 0.5) * 0.5
    score += qualityScore * weights.quality

    return Math.min(score, 1)
  }

  /**
   * Calculate geographic distance using Haversine formula
   */
  private calculateDistance(
    point1: { lat: number; lon: number },
    point2: { lat: number; lon: number },
  ): number {
    const R = 6371 // Earth radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLon = this.toRadians(point2.lon - point1.lon)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Calculate bounding box for geographic filtering
   */
  private calculateBoundingBox(
    center: { lat: number; lon: number },
    radiusKm: number,
  ): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
    const latDelta = radiusKm / 111.0 // Approximate km per degree latitude
    const lonDelta = radiusKm / (111.0 * Math.cos(this.toRadians(center.lat)))

    return {
      minLat: center.lat - latDelta,
      maxLat: center.lat + latDelta,
      minLon: center.lon - lonDelta,
      maxLon: center.lon + lonDelta,
    }
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  /**
   * Format result for API response
   */
  private formatResult(item: any): SearchResult {
    const metadata = item.candidate.embedding.metadata
    const grades = metadata.grades

    let gradeRange = 'N/A'
    if (grades.min !== null && grades.max !== null) {
      const minGrade = Grade.fromIndex(grades.min)
      const maxGrade = Grade.fromIndex(grades.max)
      if (minGrade && maxGrade) {
        gradeRange = `${minGrade.value} - ${maxGrade.value}`
      }
    }

    return {
      zoneId: item.candidate.embedding.zoneId,
      zoneName: 'Zone', // Will be fetched from crag if needed
      zoneType: item.candidate.embedding.zoneType,
      similarity: item.candidate.similarity,
      finalScore: item.finalScore,
      distance: item.geoDistance,
      metadata: {
        location: metadata.location,
        routeCount: metadata.routeCount,
        gradeRange,
        bestMonths: metadata.seasonality.bestMonths,
        orientations: metadata.characteristics.orientations,
        rockTypes: metadata.characteristics.rockTypes,
        popularity: metadata.quality.popularity,
        quality: metadata.quality.rating,
        hasTopos: metadata.facilities.hasTopos,
        hasPhotos: metadata.facilities.hasPhotos,
      },
      preview: item.candidate.embedding.getPreview(),
    }
  }
}

import { CragPrismaRepository } from '@crag/infrastructure/persistence/prisma/crag.repository'
import { Inject, Injectable } from '@OneJs/core'

/**
 * DTO for nearby crags search
 */
export interface GetNearbyCragsDto {
  latitude: number
  longitude: number
  maxDistanceKm?: number
  search?: string
  limit?: number
  offset?: number
}

/**
 * Individual crag result with distance
 */
export interface NearbyCragResult {
  id: string
  name: string
  altNames: string[]
  latitude: number | null
  longitude: number | null
  distance: number | null
  description: string | null
  numberRoutes: number | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  totalFavorites: number | null
  urlStub: string | null
}

/**
 * Response for nearby crags search
 */
export interface GetNearbyCragsResponse {
  results: NearbyCragResult[]
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

/**
 * Use Case: Get nearby crags with optional search
 * Encapsulates distance calculation and crag filtering logic
 */
@Injectable()
export class GetNearbyCragsUseCase {
  constructor(
    @Inject(CragPrismaRepository)
    private readonly cragRepo: CragPrismaRepository,
  ) {}

  async execute(dto: GetNearbyCragsDto): Promise<GetNearbyCragsResponse> {
    const { latitude, longitude } = dto
    const maxDistanceKm = dto.maxDistanceKm ?? 100
    const limit = dto.limit ?? 50
    const offset = dto.offset ?? 0
    const search = dto.search?.trim() || undefined

    const { crags, total } = await this.cragRepo.findNearbyWithSearch({
      latitude,
      longitude,
      maxDistanceKm,
      search,
      limit,
      offset,
    })

    // Calculate distance for each crag and build response
    const results: NearbyCragResult[] = crags.map((crag) => {
      const cragLat = crag.latitude
      const cragLon = crag.longitude
      let distance: number | null = null

      if (cragLat !== null && cragLon !== null) {
        distance = this.calculateHaversineDistance(
          latitude,
          longitude,
          cragLat,
          cragLon,
        )
      }

      return {
        id: crag.id.toString(),
        name: crag.name.toString(),
        altNames: crag.altNames.toArray(),
        latitude: cragLat,
        longitude: cragLon,
        distance,
        description: crag.description,
        numberRoutes:
          (crag as unknown as { numberRoutes?: number }).numberRoutes ?? null,
        numberPhotos: crag.numberPhotos,
        numberTopos: crag.numberTopos,
        hasTopo: crag.hasTopo,
        totalFavorites: crag.totalFavorites,
        urlStub: crag.urlStub,
      }
    })

    return {
      results,
      total,
      filters: {
        latitude,
        longitude,
        maxDistance: maxDistanceKm,
        search: search || null,
      },
      pagination: {
        limit,
        offset,
        hasMore: offset + results.length < total,
      },
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @returns Distance in km, rounded to 1 decimal
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10 // Round to 1 decimal
  }
}

import { Inject, Injectable } from '@OneJs/core'
import { ZonePrismaRepository } from '@zone/infrastructure/persistence/prisma/zone.repository'
import type { ZoneSearchDto, NearbyZoneFilterDto } from '../../domain/dtos/zone-filter.dto'
import type { ZoneListItemDto } from '../../domain/dtos/zone.dto'
import { Coordinates } from '../../domain/value-objects/coordinates'

@Injectable()
export class SearchZonesUseCase {
  constructor(
    @Inject(ZonePrismaRepository)
    private readonly zoneRepository: ZonePrismaRepository,
  ) {}

  async execute(searchDto: ZoneSearchDto): Promise<ZoneListItemDto[]> {
    const zones = await this.zoneRepository.search(searchDto.query, searchDto.filters)

    return zones.map((zone) => ({
      id: zone.id.toString(),
      name: zone.name,
      country: zone.country,
      region: zone.region,
      coordinates: zone.coordinates.toJSON(),
      climbingTypes: zone.climbingTypes,
      totalRoutes: zone.stats.totalRoutes,
      imageUrl: zone.imageUrl,
    }))
  }

  async findNearby(nearbyDto: NearbyZoneFilterDto): Promise<ZoneListItemDto[]> {
    const userLocation = new Coordinates(nearbyDto.latitude, nearbyDto.longitude)
    const radiusKm = nearbyDto.radiusKm ?? 50
    const limit = nearbyDto.limit ?? 20

    const allZones = await this.zoneRepository.findAll()

    // Filter zones within radius and calculate distance
    const nearbyZones = allZones
      .map((zone) => ({
        zone,
        distance: zone.distanceTo(userLocation),
      }))
      .filter(({ distance }) => distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return nearbyZones.map(({ zone, distance }) => ({
      id: zone.id.toString(),
      name: zone.name,
      country: zone.country,
      region: zone.region,
      coordinates: zone.coordinates.toJSON(),
      climbingTypes: zone.climbingTypes,
      totalRoutes: zone.stats.totalRoutes,
      imageUrl: zone.imageUrl,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
    }))
  }
}



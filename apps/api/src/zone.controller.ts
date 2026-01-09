import { Inject } from '@OneJs/core'
import type { Context } from '@OneJs/server'
import { Controller, Get, Post } from '@OneJs/server'
import { ZoneService } from '@zone/application/services/zone.service'
import type {
  NearbyZoneFilterDto,
  ZoneFilterDto,
  ZoneSearchDto,
} from '@zone/domain/dtos/zone-filter.dto'
import { ZonePrismaRepository } from '@zone/infrastructure/persistence/prisma/zone.repository'

@Controller('/zones')
export class ZoneController {
  constructor(
    @Inject(ZoneService)
    private readonly zoneService: ZoneService,
    @Inject(ZonePrismaRepository)
    private readonly zoneRepository: ZonePrismaRepository,
  ) {}

  @Get('/')
  async getZones(context: Context) {
    const query = context.query as Record<string, string | undefined>

    const filters: ZoneFilterDto = {
      country: query.country,
      region: query.region,
      climbingTypes: query.climbingTypes?.split(
        ',',
      ) as ZoneFilterDto['climbingTypes'],
      minRoutes: query.minRoutes ? parseInt(query.minRoutes, 10) : undefined,
      search: query.search,
      limit: query.limit ? parseInt(query.limit, 10) : 100,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    }

    const zones = await this.zoneService.getZones(filters)
    context.set.status = 200
    return zones
  }

  // IMPORTANT: Static routes must come BEFORE dynamic routes (/:id)
  @Get('/nearby')
  async getNearbyZones(context: Context) {
    const query = context.query as Record<string, string | undefined>

    if (!query.lat || !query.lng) {
      context.set.status = 400
      return { error: 'lat and lng query parameters are required' }
    }

    const nearbyDto: NearbyZoneFilterDto = {
      latitude: parseFloat(query.lat),
      longitude: parseFloat(query.lng),
      radiusKm: query.radius ? parseFloat(query.radius) : 50,
      limit: query.limit ? parseInt(query.limit, 10) : 100,
    }

    const zones = await this.zoneService.getNearbyZones(nearbyDto)
    context.set.status = 200
    return zones
  }

  @Post('/search')
  async searchZones(context: Context) {
    const body = context.body as ZoneSearchDto

    if (!body.query) {
      context.set.status = 400
      return { error: 'query field is required' }
    }

    const zones = await this.zoneService.searchZones(body)
    context.set.status = 200
    return zones
  }

  @Get('/countries')
  async getCountries(context: Context) {
    const countries = await this.zoneRepository.getCountries()
    context.set.status = 200
    return countries
  }

  @Get('/regions')
  async getRegions(context: Context) {
    const query = context.query as Record<string, string | undefined>
    const regions = await this.zoneRepository.getRegions(query.country)
    context.set.status = 200
    return regions
  }

  // Dynamic route must come LAST to avoid capturing static routes like /nearby, /countries, etc.
  @Get('/:id')
  async getZoneDetail(context: Context) {
    const { id } = context.params as { id: string }
    const zone = await this.zoneService.getZoneDetail(id)
    context.set.status = 200
    return zone
  }
}

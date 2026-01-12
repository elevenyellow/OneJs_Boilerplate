import { Inject, Injectable } from '@OneJs/core'
import { ZonePrismaRepository } from '@zone/infrastructure/persistence/prisma/zone.repository'
import type {
  NearbyZoneFilterDto,
  ZoneFilterDto,
  ZoneSearchDto,
} from '../../domain/dtos/zone-filter.dto'
import type { ZoneDetailDto, ZoneListItemDto } from '../../domain/dtos/zone.dto'
import { GetZoneDetailUseCase } from '../use-cases/get-zone-detail.use-case'
import { GetZonesUseCase } from '../use-cases/get-zones.use-case'
import { SearchZonesUseCase } from '../use-cases/search-zones.use-case'

@Injectable()
export class ZoneService {
  constructor(
    @Inject(GetZonesUseCase)
    private readonly getZonesUseCase: GetZonesUseCase,
    @Inject(GetZoneDetailUseCase)
    private readonly getZoneDetailUseCase: GetZoneDetailUseCase,
    @Inject(SearchZonesUseCase)
    private readonly searchZonesUseCase: SearchZonesUseCase,
    @Inject(ZonePrismaRepository)
    private readonly zoneRepository: ZonePrismaRepository,
  ) {}

  async getZones(filters?: ZoneFilterDto): Promise<ZoneListItemDto[]> {
    return this.getZonesUseCase.execute(filters)
  }

  async getZoneDetail(id: string): Promise<ZoneDetailDto> {
    return this.getZoneDetailUseCase.execute(id)
  }

  async searchZones(searchDto: ZoneSearchDto): Promise<ZoneListItemDto[]> {
    return this.searchZonesUseCase.execute(searchDto)
  }

  async getNearbyZones(
    nearbyDto: NearbyZoneFilterDto,
  ): Promise<ZoneListItemDto[]> {
    return this.searchZonesUseCase.findNearby(nearbyDto)
  }

  /**
   * Get list of distinct countries with zones
   */
  async getCountries(): Promise<string[]> {
    return this.zoneRepository.getCountries()
  }

  /**
   * Get list of distinct regions, optionally filtered by country
   */
  async getRegions(country?: string): Promise<string[]> {
    return this.zoneRepository.getRegions(country)
  }
}

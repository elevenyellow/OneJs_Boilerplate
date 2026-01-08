import { Inject, Injectable } from '@OneJs/core'
import { GetZonesUseCase } from '../use-cases/get-zones.use-case'
import { GetZoneDetailUseCase } from '../use-cases/get-zone-detail.use-case'
import { SearchZonesUseCase } from '../use-cases/search-zones.use-case'
import type { ZoneFilterDto, NearbyZoneFilterDto, ZoneSearchDto } from '../../domain/dtos/zone-filter.dto'
import type { ZoneListItemDto, ZoneDetailDto } from '../../domain/dtos/zone.dto'

@Injectable()
export class ZoneService {
  constructor(
    @Inject(GetZonesUseCase)
    private readonly getZonesUseCase: GetZonesUseCase,
    @Inject(GetZoneDetailUseCase)
    private readonly getZoneDetailUseCase: GetZoneDetailUseCase,
    @Inject(SearchZonesUseCase)
    private readonly searchZonesUseCase: SearchZonesUseCase,
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

  async getNearbyZones(nearbyDto: NearbyZoneFilterDto): Promise<ZoneListItemDto[]> {
    return this.searchZonesUseCase.findNearby(nearbyDto)
  }
}



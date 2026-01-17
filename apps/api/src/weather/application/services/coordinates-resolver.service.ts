import { Inject, Injectable, Logger, OneJsError } from '@OneJs/core'
import { ErrorCodes } from '@OneJs/core'
import { CragPrismaRepository } from '@crags/infrastructure/persistence/prisma/crag.repository'
import { SectorPrismaRepository } from '@sectors/infrastructure/persistence/prisma/sector.repository'
import { Id as CragId, Coordinates } from '@crags/domain/value-objects'
import { Id as SectorId } from '@sectors/domain/value-objects'

/**
 * Resolved coordinates with optional entity identifiers and aspect
 */
export interface ResolvedCoordinates {
  latitude: number
  longitude: number
  aspect: string | null
  cragId?: string
  sectorId?: string
}

/**
 * Application service that resolves coordinates from various sources.
 * Consolidates coordinate resolution logic for weather conditions lookup.
 */
@Injectable()
export class CoordinatesResolverService {
  constructor(
    @Inject(CragPrismaRepository)
    private readonly cragRepository: CragPrismaRepository,

    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,

    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Resolve coordinates from a crag ID
   */
  async resolveFromCrag(
    cragId: string,
    aspect?: string | null,
  ): Promise<ResolvedCoordinates> {
    this.logger.info('weather:coordinates-resolver', 'Resolving from crag', {
      cragId,
      aspect,
    })

    const crag = await this.cragRepository.findById(CragId.createFrom(cragId))

    if (!crag) {
      throw new OneJsError(
        'Crag not found',
        404,
        `Crag with id ${cragId} does not exist`,
        { cragId },
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    }

    const coordinates = crag.getCoordinates()
    const latitude = coordinates.getLatitude()
    const longitude = coordinates.getLongitude()

    if (latitude === null || longitude === null) {
      throw new OneJsError(
        'Crag has no coordinates',
        400,
        `Crag ${cragId} does not have valid coordinates`,
        { cragId },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return {
      latitude,
      longitude,
      aspect: aspect ?? null,
      cragId,
    }
  }

  /**
   * Resolve coordinates from a sector ID
   * Also extracts aspect from sector tags if available
   */
  async resolveFromSector(sectorId: string): Promise<ResolvedCoordinates> {
    this.logger.info('weather:coordinates-resolver', 'Resolving from sector', {
      sectorId,
    })

    const sector = await this.sectorRepository.findById(
      SectorId.createFrom(sectorId),
    )

    if (!sector) {
      throw new OneJsError(
        'Sector not found',
        404,
        `Sector with id ${sectorId} does not exist`,
        { sectorId },
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    }

    const coordinates = sector.getCoordinates()
    const latitude = coordinates.getLatitude()
    const longitude = coordinates.getLongitude()

    if (latitude === null || longitude === null) {
      throw new OneJsError(
        'Sector has no coordinates',
        400,
        `Sector ${sectorId} does not have valid coordinates`,
        { sectorId },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    // Extract aspect from sector tags
    const sectorTags = sector.getTags()
    const aspect = (sectorTags?.toJSON()?.aspect as string) ?? null

    return {
      latitude,
      longitude,
      aspect,
      sectorId,
    }
  }

  /**
   * Resolve and validate coordinates from raw string input
   */
  resolveFromCoordinates(
    lat: string,
    lon: string,
    aspect?: string | null,
  ): ResolvedCoordinates {
    const latitude = Number.parseFloat(lat)
    const longitude = Number.parseFloat(lon)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new OneJsError(
        'Invalid coordinates',
        400,
        'lat and lon must be valid numbers',
        { lat, lon },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    // Validate via Coordinates value object
    const coordinates = Coordinates.createFrom(latitude, longitude)

    this.logger.info(
      'weather:coordinates-resolver',
      'Resolved from coordinates',
      {
        latitude: coordinates.getLatitude(),
        longitude: coordinates.getLongitude(),
        aspect,
      },
    )

    return {
      latitude: coordinates.getLatitude()!,
      longitude: coordinates.getLongitude()!,
      aspect: aspect ?? null,
    }
  }
}

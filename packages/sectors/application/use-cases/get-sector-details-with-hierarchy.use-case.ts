import { ErrorCodes, Inject, Injectable, OneJsError } from '@OneJs/core'
import { SectorPrismaRepository } from '../../infrastructure/persistence/prisma/sector.repository'
import { TopoPrismaRepository } from '@topos/infrastructure/persistence/prisma/topo.repository'
import { Id, ParsedBeta } from '../../domain/value-objects'
import type { Sector } from '../../domain/entities/sector.entity'

export interface SectorDto {
  id: string
  externalId: string
  name: string
  depth: number
  parentId: string | null
  cragId: string
  hasSubSectors: boolean
  hasTopo: boolean
  numberRoutes: number | null
  headerImage: string | null
  numberTopos: number | null
  kudos: number | null
  subAreaCount: number | null
  averageHeight: number | null
  averageHeightUnit: string | null
  aspect: string | null
  walkInTime: string | null
  climbingStyle: string | null
  tagFamily: string | null
  tagWeather: string[] | null
  tagCrowds: string | null
  gbRoutes: number[] | null
  // Grade range as gradeBand indices - client converts to display
  minGradeBand: number | null
  maxGradeBand: number | null
  aspectLabel: string | null
  walkInTimeLabel: string | null
  familyLabel: string | null
  weatherLabels: string[] | null
  crowdsLabel: string | null
  starRating: number
  latitude: number | null
  longitude: number | null
  approach: string | null
  beta: ReturnType<ParsedBeta['toJSON']> | null
}

export interface SectorPhotoDto {
  id: string
  externalId: string
  fullImageUrl: string
  thumbnailUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  viewScale: number
  isOverview: boolean
  cragId: string | null
  sectorId: string | null
  sectorAreas: Array<{
    id: string
    annotationId: string
    sectorId: string | null
    sectorName: string
    svgPath: string
    color: string
    routeCount: number | null
    // Grade range as gradeBand indices - client converts to display
    minGradeBand: number | null
    maxGradeBand: number | null
  }>
  routeLines: Array<{
    id: string
    annotationId: string
    routeId: string | null
    externalRouteId: string | null
    routeName: string
    // Grade as gradeBand index - client converts to display
    gradeBand: number | null
    topoNumber: string
    svgPath: string
    color: string
  }>
}

export interface GetSectorDetailsResult {
  sector: SectorDto
  parent: SectorDto | null
  children: SectorDto[]
  photos: SectorPhotoDto[]
}

@Injectable()
export class GetSectorDetailsWithHierarchyUseCase {
  constructor(
    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,
    @Inject(TopoPrismaRepository)
    private readonly topoRepository: TopoPrismaRepository,
  ) {}

  /**
   * Get sector details with hierarchy
   * Grade data sent as gradeBand indices - client converts to preferred system
   */
  async execute(sectorId: Id): Promise<GetSectorDetailsResult> {
    // 1. Get the sector
    const sector = await this.sectorRepository.findById(sectorId)

    if (!sector) {
      throw new OneJsError(
        'Sector not found',
        404,
        `No sector found with id ${sectorId.getValue()}`,
        { sectorId: sectorId.getValue() },
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    }

    // 2. Get parent sector if exists
    const parentId = sector.getParentId()
    const parent = parentId
      ? await this.sectorRepository.findById(parentId)
      : null

    // 3. Get children sectors
    const children = await this.sectorRepository.findChildren(sectorId)

    // 4. Get topo photos for this sector (only those with route annotations)
    const toposWithRoutes =
      await this.topoRepository.findBySectorIdWithRouteAnnotations(sectorId)

    // Filter topos that actually have route annotations (double-check after DB query)
    const topos = toposWithRoutes.filter(
      (topo) => topo.getRouteAnnotations().length > 0,
    )

    // 5. Build response
    return {
      sector: this.mapSectorToDto(sector),
      parent: parent ? this.mapSectorToDto(parent) : null,
      children: children.map((child) => this.mapSectorToDto(child)),
      photos: topos.map((topo): SectorPhotoDto => {
        const dimensions = topo.getDimensions()
        const imageUrl = topo.getImageUrl()
        const areaAnnotations = topo.getAreaAnnotations()
        const routeAnnotations = topo.getRouteAnnotations()

        return {
          id: topo.getId().getValue(),
          externalId: topo.getExternalId().getValue(),
          fullImageUrl: imageUrl.getFullImageUrl(),
          thumbnailUrl: imageUrl.getThumbnailUrl(),
          width: dimensions.getWidth(),
          height: dimensions.getHeight(),
          originalWidth: dimensions.getOriginalWidth(),
          originalHeight: dimensions.getOriginalHeight(),
          viewScale: topo.getViewScale().getValue(),
          isOverview: topo.getIsOverview().getValue(),
          cragId: topo.getCragId()?.getValue() || null,
          sectorId: topo.getSectorId()?.getValue() || null,
          sectorAreas: areaAnnotations.map((annotation) => ({
            id: annotation.getId().getValue(),
            annotationId: annotation.getId().getValue(),
            sectorId: annotation.getRouteId()?.getValue() || null,
            sectorName: annotation.getName().getValue() || '',
            svgPath: annotation.getPoints().getValue(),
            color: '#FF5733',
            routeCount: null,
            minGradeBand: null,
            maxGradeBand: null,
          })),
          routeLines: routeAnnotations.map((annotation) => ({
            id: annotation.getId().getValue(),
            annotationId: annotation.getId().getValue(),
            routeId: annotation.getRouteId()?.getValue() || null,
            externalRouteId:
              annotation.getExternalRouteId()?.getValue() || null,
            routeName: annotation.getName().getValue() || '',
            gradeBand: annotation.getGrade().getGradeBand() ?? null,
            topoNumber: annotation.getNum().getValue() || '',
            svgPath: annotation.getPoints().getValue(),
            color: annotation.getColor().getValue(),
          })),
        }
      }),
    }
  }

  private mapSectorToDto(sector: Sector): SectorDto {
    const parsedBeta = ParsedBeta.createFromBeta(sector.getBeta())
    const gradeBands = sector.getGradeBands()

    return {
      id: sector.getId().getValue(),
      externalId: sector.getExternalId().getValue(),
      name: sector.getName().getValue(),
      depth: sector.getDepth().getValue(),
      parentId: sector.getParentId()?.getValue() || null,
      cragId: sector.getCragId().getValue(),
      hasSubSectors: sector.getHasSubSectors().getValue(),
      hasTopo: sector.getHasTopo().getValue(),
      numberRoutes: sector.getStats().getNumberRoutes(),
      headerImage: sector.getImages().getHeaderImage(),
      numberTopos: sector.getStats().getNumberTopos(),
      kudos: sector.getStats().getKudos(),
      subAreaCount: sector.getStats().getSubAreaCount(),
      averageHeight: sector.getAverageHeight().getValue(),
      averageHeightUnit: sector.getAverageHeight().getUnit(),
      aspect: sector.getTags().getAspect(),
      walkInTime: sector.getTags().getWalkInTime(),
      climbingStyle: sector.getTags().getStyle(),
      tagFamily: sector.getTags().getFamily(),
      tagWeather: sector.getTags().getWeather(),
      tagCrowds: sector.getTags().getCrowds(),
      gbRoutes: gradeBands.getRoutes(),
      // Grade range as gradeBand indices - client converts to display
      minGradeBand: gradeBands.getMinGradeIndex(),
      maxGradeBand: gradeBands.getMaxGradeIndex(),
      aspectLabel: sector.getTags().getAspectLabel(),
      walkInTimeLabel: sector.getTags().getWalkInTimeLabel(),
      familyLabel: sector.getTags().getFamilyLabel(),
      weatherLabels:
        sector.getTags().getWeatherLabels().length > 0
          ? sector.getTags().getWeatherLabels()
          : null,
      crowdsLabel: sector.getTags().getCrowdsLabel(),
      starRating: sector.getStats().getStarRating(),
      latitude: sector.getCoordinates().getLatitude(),
      longitude: sector.getCoordinates().getLongitude(),
      approach: sector.getApproach().getValue(),
      beta: parsedBeta.hasData() ? parsedBeta.toJSON() : null,
    }
  }
}

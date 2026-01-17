import { ErrorCodes, Inject, Injectable, OneJsError } from '@OneJs/core'
import { CragPrismaRepository } from '@crags/infrastructure/persistence/prisma/crag.repository'
import { SectorPrismaRepository } from '@sectors/infrastructure/persistence/prisma/sector.repository'
import { TopoPrismaRepository } from '@topos/infrastructure/persistence/prisma/topo.repository'
import { ParsedBeta as CragParsedBeta } from '@crags/domain/value-objects'
import { ParsedBeta as SectorParsedBeta } from '@sectors/domain/value-objects'
import type {
  RouteLineAnnotationDto,
  SectorAreaAnnotationDto,
  SectorDto,
  SectorPhotoWithAreasDto,
  ZoneOverviewWithSectorsDto,
} from '../dtos'
import { ZoneId } from '@zones/domain/value-objects'

@Injectable()
export class GetZoneOverviewWithSectorsUseCase {
  constructor(
    @Inject(CragPrismaRepository)
    private readonly cragRepository: CragPrismaRepository,
    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,
    @Inject(TopoPrismaRepository)
    private readonly topoRepository: TopoPrismaRepository,
  ) {}

  /**
   * Get zone overview with sectors
   * Grade data is returned as gradeBand (numeric) - client converts to preferred system
   */
  async execute(zoneId: ZoneId): Promise<ZoneOverviewWithSectorsDto> {
    // 1. Find main crag of this zone
    const crag = await this.cragRepository.findByZoneId(zoneId)

    if (!crag) {
      throw new OneJsError(
        'Crag not found',
        404,
        `No crag found for zone ${zoneId}`,
        { zoneId },
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    }

    // 2. Get only top-level sectors (parentId = null)
    const sectors = await this.sectorRepository.findTopLevelByCragId(
      crag.getId(),
    )

    // 3. Get all photos with SVG annotations
    const topos = await this.topoRepository.findByCragIdWithAnnotations(
      crag.getId(),
    )

    // 4. Parse beta information
    const cragParsedBeta = CragParsedBeta.createFromBeta(crag.getBeta())

    // 5. Build response
    return {
      zone: {
        id: zoneId.toString(),
        name: crag.getName().getValue(),
      },
      crag: {
        id: crag.getId().getValue(),
        externalId: crag.getExternalId().getValue(),
        name: crag.getName().getValue(),
        type: crag.getCragType().getType(),
        numberRoutes: crag.getStats().getNumberRoutes(),
        hasSectors: crag.getHasSectors().getValue(),
        beta: cragParsedBeta.hasData() ? cragParsedBeta.toJSON() : null,
        latitude: crag.getCoordinates().getLatitude(),
        longitude: crag.getCoordinates().getLongitude(),
      },
      sectors: sectors.map((sector): SectorDto => {
        // Parse beta for each sector
        const sectorParsedBeta = SectorParsedBeta.createFromBeta(
          sector.getBeta(),
        )

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
          gbRoutes: sector.getGradeBands().getRoutes(),
          gbAscents: null, // Not tracked per sector
          // Grade range as gradeBand indices - client converts to display
          minGradeBand: sector.getGradeBands().getMinGradeIndex(),
          maxGradeBand: sector.getGradeBands().getMaxGradeIndex(),
          // Human-readable labels
          aspectLabel: sector.getTags().getAspectLabel(),
          walkInTimeLabel: sector.getTags().getWalkInTimeLabel(),
          familyLabel: sector.getTags().getFamilyLabel(),
          weatherLabels:
            sector.getTags().getWeatherLabels().length > 0
              ? sector.getTags().getWeatherLabels()
              : null,
          crowdsLabel: sector.getTags().getCrowdsLabel(),
          starRating: sector.getStats().getStarRating(),
          // Location for directions
          latitude: sector.getCoordinates().getLatitude(),
          longitude: sector.getCoordinates().getLongitude(),
          approach: sector.getApproach().getValue(),
          // Beta information
          beta: sectorParsedBeta.hasData() ? sectorParsedBeta.toJSON() : null,
          // Sector header image from database
          headerImage: sector.getImages().getHeaderImage(),
        }
      }),
      photos: topos.map((topo): SectorPhotoWithAreasDto => {
        const dimensions = topo.getDimensions()
        const imageUrl = topo.getImageUrl()

        // Get area annotations (sector areas)
        const areaAnnotations = topo.getAreaAnnotations()

        // Get route annotations (route lines)
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
          sectorAreas: areaAnnotations.map(
            (annotation): SectorAreaAnnotationDto => {
              return {
                id: annotation.getId().getValue(),
                annotationId: annotation.getId().getValue(),
                sectorId: annotation.getRouteId()?.getValue() || null,
                sectorName: annotation.getName().getValue() || '',
                svgPath: annotation.getPoints().getValue(),
                color: '#FF5733',
                routeCount: null,
                // Grade range as gradeBand - currently not available on area annotations
                minGradeBand: null,
                maxGradeBand: null,
              }
            },
          ),
          routeLines: routeAnnotations.map(
            (annotation): RouteLineAnnotationDto => {
              return {
                id: annotation.getId().getValue(),
                annotationId: annotation.getId().getValue(),
                routeId: annotation.getRouteId()?.getValue() || null,
                externalRouteId:
                  annotation.getExternalRouteId()?.getValue() || null,
                routeName: annotation.getName().getValue() || '',
                // Grade as gradeBand index - client converts to display
                gradeBand: annotation.getGrade().getGradeBand(),
                topoNumber: annotation.getNum().getValue() || '',
                svgPath: annotation.getPoints().getValue(),
                color: annotation.getColor().getValue(),
              }
            },
          ),
        }
      }),
    }
  }
}

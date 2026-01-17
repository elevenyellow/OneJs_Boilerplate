import { Inject, OneJsError, logger, ErrorCodes, UseAuth } from '@OneJs/core'
import { Controller, Get, type Context } from '@OneJs/server'
import { Id } from '@crags/domain/value-objects'
import { GetCragRoutesUseCase } from '@routes/application/use-cases/get-crag-routes.use-case'
import { CragPrismaRepository } from '@crags/infrastructure/persistence/prisma/crag.repository'
import { TopoPrismaRepository } from '@topos/infrastructure/persistence/prisma/topo.repository'

@Controller('/crags')
export class CragsController {
  constructor(
    @Inject(GetCragRoutesUseCase)
    private readonly getCragRoutesUseCase: GetCragRoutesUseCase,
    @Inject(CragPrismaRepository)
    private readonly cragRepository: CragPrismaRepository,
    @Inject(TopoPrismaRepository)
    private readonly topoRepository: TopoPrismaRepository,
  ) {}

  /**
   * Get routes directly associated with a crag (no sector)
   * Used for crags with virtual sectors where routes don't have a sectorId
   * GET /api/crags/:cragId/routes
   */
  @Get('/:cragId/routes')
  @UseAuth()
  async getCragRoutes(ctx: Context) {
    const { cragId } = ctx.params as { cragId: string }

    if (!cragId) {
      throw new OneJsError(
        'Missing crag ID',
        400,
        'cragId path parameter is required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const cragIdVo = Id.createFrom(cragId)

    // Get crag details first
    const crag = await this.cragRepository.findById(cragIdVo)

    if (!crag) {
      throw new OneJsError(
        'Crag not found',
        404,
        `Crag with id ${cragId} not found`,
        { cragId },
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    }

    // Get routes and topos in parallel
    const [routesResult, allTopos] = await Promise.all([
      this.getCragRoutesUseCase.execute(cragIdVo),
      this.topoRepository.findByCragIdWithAnnotations(cragIdVo),
    ])

    // Filter to only include topos that have route annotations (not overview topos)
    const topos = allTopos.filter((topo) => topo.getHasRoutes().getValue())

    logger.info('✅ [CragsController] Crag routes retrieved:', {
      cragId,
      routesCount: routesResult.totalCount,
      photosCount: topos.length,
    })

    // Build photos response (same format as sector routes)
    const photos = topos.map((topo) => {
      const dimensions = topo.getDimensions()
      const imageUrl = topo.getImageUrl()
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
        sectorAreas: [],
        routeLines: routeAnnotations.map((annotation) => ({
          id: annotation.getId().getValue(),
          annotationId: annotation.getId().getValue(),
          routeId: annotation.getRouteId()?.getValue() || null,
          externalRouteId: annotation.getExternalRouteId()?.getValue() || null,
          routeName: annotation.getName().getValue() || '',
          gradeBand: annotation.getGrade().getGradeBand(),
          topoNumber: annotation.getNum().getValue() || '',
          svgPath: annotation.getPoints().getValue(),
          color: annotation.getColor().getValue(),
        })),
      }
    })

    // Build crag info as a "virtual sector" for the response
    const virtualSector = {
      id: crag.getId().getValue(),
      externalId: crag.getExternalId().getValue(),
      name: crag.getName().getValue(),
      depth: 0,
      parentId: null,
      cragId: crag.getId().getValue(),
      hasSubSectors: false,
      hasTopo: crag.getHasTopo().getValue(),
      numberRoutes: crag.getStats().getNumberRoutes(),
      numberTopos: crag.getStats().getNumberTopos(),
      kudos: crag.getStats().getKudos(),
      subAreaCount: null,
      averageHeight: crag.getAverageHeight().getValue(),
      averageHeightUnit: crag.getAverageHeight().getUnit(),
      aspect: null,
      walkInTime: null,
      climbingStyle: null,
      tagFamily: null,
      tagWeather: null,
      tagCrowds: null,
      gbRoutes: crag.getGradeDistribution().getGbRoutes(),
      gbAscents: null,
      minGradeBand: crag.getGradeDistribution().getMinGradeBand(),
      maxGradeBand: crag.getGradeDistribution().getMaxGradeBand(),
      aspectLabel: null,
      walkInTimeLabel: null,
      familyLabel: null,
      weatherLabels: null,
      crowdsLabel: null,
      starRating: crag.getStats().getStarRating(),
      latitude: crag.getCoordinates().getLatitude(),
      longitude: crag.getCoordinates().getLongitude(),
      approach: null,
      beta: null,
      headerImage: crag.getHeaderImage().getValue(),
    }

    return {
      sector: virtualSector,
      parent: null,
      children: [],
      photos,
      routes: routesResult.routes,
      totalCount: routesResult.totalCount,
    }
  }
}

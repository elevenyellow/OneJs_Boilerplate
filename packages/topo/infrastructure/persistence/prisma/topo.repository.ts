import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { TopoImageEntity } from '@topo/domain/entities/topo-image.entity'
import { RouteTopoPositionEntity } from '@topo/domain/entities/route-topo-position.entity'
import {
  CragTopoImageEntity,
  type CragTopoSectorPositionData,
} from '@topo/domain/entities/crag-topo-image.entity'
import { TopoImageId } from '@topo/domain/value-objects/topo-image-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { RouteId } from '@route/domain/value-objects/route-id.vo'

interface TopoImagePrismaData {
  id: string
  externalId: string
  sectorId: string
  thumbnailUrl: string
  fullImageUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  viewScale: number
  sourceUrl: string | null
  createdAt: Date
  updatedAt: Date
  // S3 optimized URLs
  thumbnailS3Url: string | null
  fullImageS3Url: string | null
  originalSourceUrl: string | null
}

interface RouteTopoPositionPrismaData {
  id: string
  routeId: string
  topoImageId: string
  topoNumber: string
  points: string
  zindex: number
  order: number
  gradeClass: string | null
  createdAt: Date
}

@Injectable()
export class TopoPrismaRepository extends PrismaRepository<'topoImage'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'topoImage')
  }

  // --- TopoImage methods ---

  async findById(id: TopoImageId): Promise<TopoImageEntity | null> {
    const topo = await this.prisma.topoImage.findUnique({
      where: { id: id.toString() },
    })
    return topo ? this.toEntity(topo) : null
  }

  async findByExternalId(externalId: string): Promise<TopoImageEntity | null> {
    const topo = await this.prisma.topoImage.findUnique({
      where: { externalId },
    })
    return topo ? this.toEntity(topo) : null
  }

  async findBySectorId(sectorId: SectorId): Promise<TopoImageEntity[]> {
    const topos = await this.prisma.topoImage.findMany({
      where: { sectorId: sectorId.toString() },
      orderBy: { createdAt: 'asc' },
    })
    return topos.map((t: TopoImagePrismaData) => this.toEntity(t))
  }

  async saveTopoImage(entity: TopoImageEntity): Promise<TopoImageEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.topoImage.upsert({
      where: { externalId: entity.externalId },
      create: data,
      update: data,
    })

    return this.toEntity(saved)
  }

  async saveTopoImageWithPositions(
    entity: TopoImageEntity,
    positions: Array<{
      routeId: RouteId
      topoNumber: string
      points: string
      zindex?: number
      order?: number
      gradeClass?: string | null
    }>,
  ): Promise<{ topo: TopoImageEntity; positionsCreated: number }> {
    const data = this.toPrismaData(entity)

    // Upsert topo image
    const savedTopo = await this.prisma.topoImage.upsert({
      where: { externalId: entity.externalId },
      create: data,
      update: data,
    })

    // Delete existing positions for this topo
    await this.prisma.routeTopoPosition.deleteMany({
      where: { topoImageId: savedTopo.id },
    })

    // Create new positions
    const positionData = positions.map((p, idx) => ({
      routeId: p.routeId.toString(),
      topoImageId: savedTopo.id,
      topoNumber: p.topoNumber,
      points: p.points,
      zindex: p.zindex ?? idx,
      order: p.order ?? idx,
      gradeClass: p.gradeClass ?? null,
    }))

    const created = await this.prisma.routeTopoPosition.createMany({
      data: positionData,
      skipDuplicates: true,
    })

    return {
      topo: this.toEntity(savedTopo as TopoImagePrismaData),
      positionsCreated: created.count,
    }
  }

  // --- RouteTopoPosition methods ---

  async findPositionsByRouteId(routeId: RouteId): Promise<RouteTopoPositionEntity[]> {
    const positions = await this.prisma.routeTopoPosition.findMany({
      where: { routeId: routeId.toString() },
      orderBy: { order: 'asc' },
    })
    return positions.map((p: RouteTopoPositionPrismaData) => this.positionToEntity(p))
  }

  async findPositionsByTopoId(topoImageId: TopoImageId): Promise<RouteTopoPositionEntity[]> {
    const positions = await this.prisma.routeTopoPosition.findMany({
      where: { topoImageId: topoImageId.toString() },
      orderBy: { order: 'asc' },
    })
    return positions.map((p: RouteTopoPositionPrismaData) => this.positionToEntity(p))
  }

  /**
   * Get topos that contain a specific route
   */
  async findToposForRoute(routeId: RouteId): Promise<TopoImageEntity[]> {
    const positions = await this.prisma.routeTopoPosition.findMany({
      where: { routeId: routeId.toString() },
      include: { topoImage: true },
    })
    
    return positions.map((p: RouteTopoPositionPrismaData & { topoImage: TopoImagePrismaData }) => 
      this.toEntity(p.topoImage)
    )
  }

  /**
   * Get all routes on a topo with their position data
   */
  async findRoutesOnTopo(topoImageId: TopoImageId): Promise<Array<{
    routeId: string
    topoNumber: string
    points: string
    gradeClass: string | null
  }>> {
    const positions = await this.prisma.routeTopoPosition.findMany({
      where: { topoImageId: topoImageId.toString() },
      orderBy: { order: 'asc' },
      select: {
        routeId: true,
        topoNumber: true,
        points: true,
        gradeClass: true,
      },
    })
    return positions
  }

  // --- Private mapping methods ---

  private toEntity(data: TopoImagePrismaData): TopoImageEntity {
    return new TopoImageEntity(
      TopoImageId.fromString(data.id),
      data.externalId,
      SectorId.fromString(data.sectorId),
      data.thumbnailUrl,
      data.fullImageUrl,
      data.width,
      data.height,
      data.originalWidth,
      data.originalHeight,
      data.viewScale,
      data.sourceUrl,
      data.createdAt,
      data.updatedAt,
      data.thumbnailS3Url,
      data.fullImageS3Url,
      data.originalSourceUrl,
    )
  }

  private toPrismaData(entity: TopoImageEntity) {
    return {
      id: entity.id.toString(),
      externalId: entity.externalId,
      sectorId: entity.sectorId.toString(),
      thumbnailUrl: entity.thumbnailUrl,
      fullImageUrl: entity.fullImageUrl,
      width: entity.width,
      height: entity.height,
      originalWidth: entity.originalWidth,
      originalHeight: entity.originalHeight,
      viewScale: entity.viewScale,
      sourceUrl: entity.sourceUrl,
      thumbnailS3Url: entity.thumbnailS3Url,
      fullImageS3Url: entity.fullImageS3Url,
      originalSourceUrl: entity.originalSourceUrl,
    }
  }

  /**
   * Update S3 URLs for a topo image
   */
  async updateTopoS3Urls(
    topoId: TopoImageId,
    thumbnailS3Url: string,
    fullImageS3Url: string,
    originalSourceUrl: string,
  ): Promise<void> {
    await this.prisma.topoImage.update({
      where: { id: topoId.toString() },
      data: {
        thumbnailS3Url,
        fullImageS3Url,
        originalSourceUrl,
        updatedAt: new Date(),
      },
    })
  }

  private positionToEntity(data: RouteTopoPositionPrismaData): RouteTopoPositionEntity {
    return new RouteTopoPositionEntity(
      data.id,
      RouteId.fromString(data.routeId),
      TopoImageId.fromString(data.topoImageId),
      data.topoNumber,
      data.points,
      data.zindex,
      data.order,
      data.gradeClass,
      data.createdAt,
    )
  }

  // --- CragTopoImage methods ---

  async findCragTopoById(id: TopoImageId): Promise<CragTopoImageEntity | null> {
    const topo = await this.prisma.cragTopoImage.findUnique({
      where: { id: id.toString() },
    })
    return topo ? this.toCragTopoEntity(topo) : null
  }

  async findCragTopoByExternalId(
    externalId: string,
  ): Promise<CragTopoImageEntity | null> {
    const topo = await this.prisma.cragTopoImage.findUnique({
      where: { externalId },
    })
    return topo ? this.toCragTopoEntity(topo) : null
  }

  async findCragToposByCragId(cragId: CragId): Promise<CragTopoImageEntity[]> {
    const topos = await this.prisma.cragTopoImage.findMany({
      where: { cragId: cragId.toString() },
      orderBy: { createdAt: 'asc' },
    })
    return topos.map((t) => this.toCragTopoEntity(t))
  }

  async saveCragTopoImageWithPositions(
    entity: CragTopoImageEntity,
    positions: CragTopoSectorPositionData[],
  ): Promise<{ topo: CragTopoImageEntity; positionsCreated: number }> {
    const data = {
      id: entity.id.toString(),
      externalId: entity.externalId,
      cragId: entity.cragId.toString(),
      thumbnailUrl: entity.thumbnailUrl,
      fullImageUrl: entity.fullImageUrl,
      width: entity.width,
      height: entity.height,
      originalWidth: entity.originalWidth,
      originalHeight: entity.originalHeight,
      viewScale: entity.viewScale,
      sourceUrl: entity.sourceUrl,
    }

    // Upsert crag topo image
    const savedTopo = await this.prisma.cragTopoImage.upsert({
      where: { externalId: entity.externalId },
      create: data,
      update: data,
    })

    // Delete existing positions for this topo
    await this.prisma.cragTopoSectorPosition.deleteMany({
      where: { cragTopoId: savedTopo.id },
    })

    // Create new positions
    const positionData = positions.map((p, idx) => ({
      sectorId: p.sectorId?.toString() ?? null,
      cragTopoId: savedTopo.id,
      areaNumber: p.areaNumber,
      areaName: p.areaName,
      points: p.points,
      zindex: p.zindex ?? idx,
      order: p.order ?? idx,
      externalAreaId: p.externalAreaId,
      areaUrl: p.areaUrl,
    }))

    const created = await this.prisma.cragTopoSectorPosition.createMany({
      data: positionData,
      skipDuplicates: true,
    })

    return {
      topo: this.toCragTopoEntity(savedTopo),
      positionsCreated: created.count,
    }
  }

  private toCragTopoEntity(data: {
    id: string
    externalId: string
    cragId: string
    thumbnailUrl: string
    fullImageUrl: string
    width: number
    height: number
    originalWidth: number
    originalHeight: number
    viewScale: number
    sourceUrl: string | null
    createdAt: Date
    updatedAt: Date
    thumbnailS3Url?: string | null
    fullImageS3Url?: string | null
    originalSourceUrl?: string | null
  }): CragTopoImageEntity {
    return new CragTopoImageEntity(
      TopoImageId.fromString(data.id),
      data.externalId,
      CragId.fromString(data.cragId),
      data.thumbnailUrl,
      data.fullImageUrl,
      data.width,
      data.height,
      data.originalWidth,
      data.originalHeight,
      data.viewScale,
      data.sourceUrl,
      data.createdAt,
      data.updatedAt,
      data.thumbnailS3Url ?? null,
      data.fullImageS3Url ?? null,
      data.originalSourceUrl ?? null,
    )
  }

  /**
   * Update S3 URLs for a crag topo image
   */
  async updateCragTopoS3Urls(
    topoId: TopoImageId,
    thumbnailS3Url: string,
    fullImageS3Url: string,
    originalSourceUrl: string,
  ): Promise<void> {
    await this.prisma.cragTopoImage.update({
      where: { id: topoId.toString() },
      data: {
        thumbnailS3Url,
        fullImageS3Url,
        originalSourceUrl,
        updatedAt: new Date(),
      },
    })
  }
}

import { Inject, Injectable, PrismaRepository } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import { Ascent } from '@ascents/domain/entities/ascent.entity'
import type { UserStatsDto, AscentWithRouteDto } from '@ascents/domain/dtos'

@Injectable()
export class AscentPrismaRepository extends PrismaRepository<'ascent'> {
  constructor(@Inject(PrismaClientOneJs) prisma: PrismaClientOneJs) {
    super(prisma, 'ascent')
  }

  async save(ascent: Ascent): Promise<Ascent> {
    const dto = ascent.toDatabaseDto()

    const saved = await this.prisma.ascent.create({
      data: {
        id: dto.id,
        userId: dto.userId,
        routeId: dto.routeId,
        style: dto.style,
        gradeBand: dto.gradeBand,
        gradeEvaluation: dto.gradeEvaluation,
        wallType: dto.wallType,
        characteristics: dto.characteristics,
        safetyConcerns: dto.safetyConcerns,
        quality: dto.quality,
        tries: dto.tries,
        isRepeat: dto.isRepeat,
        comments: dto.comments,
        ascentDate: dto.ascentDate,
      },
    })

    return Ascent.fromDatabase({
      ...saved,
      comments: saved.comments ?? null,
    })
  }

  async findByUserId(userId: string): Promise<Ascent[]> {
    const records = await this.prisma.ascent.findMany({
      where: { userId },
      orderBy: { ascentDate: 'desc' },
    })

    return records.map((record) =>
      Ascent.fromDatabase({
        ...record,
        comments: record.comments ?? null,
      }),
    )
  }

  async getStatsByUserId(userId: string): Promise<UserStatsDto> {
    const ascents = await this.prisma.ascent.findMany({
      where: { userId },
      select: {
        gradeBand: true,
        style: true,
      },
    })

    const totalAscents = ascents.length

    const byGradeBand: Record<string, number> = {}
    const byStyle: Record<string, number> = {}

    for (const ascent of ascents) {
      const gradeBandKey = String(ascent.gradeBand)
      byGradeBand[gradeBandKey] = (byGradeBand[gradeBandKey] || 0) + 1

      const styleKey = String(ascent.style)
      byStyle[styleKey] = (byStyle[styleKey] || 0) + 1
    }

    return {
      totalAscents,
      byGradeBand,
      byStyle,
    }
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.ascent.count({
      where: { userId },
    })
  }

  async findByUserIdWithRoutes(userId: string): Promise<AscentWithRouteDto[]> {
    const records = await this.prisma.ascent.findMany({
      where: { userId },
      orderBy: { ascentDate: 'desc' },
      include: {
        route: {
          include: {
            crag: true,
            sector: true,
          },
        },
      },
    })

    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      routeId: record.routeId,
      style: record.style,
      gradeBand: record.gradeBand,
      gradeEvaluation: record.gradeEvaluation,
      wallType: record.wallType,
      characteristics: record.characteristics,
      safetyConcerns: record.safetyConcerns,
      quality: record.quality,
      tries: record.tries,
      isRepeat: record.isRepeat,
      comments: record.comments,
      ascentDate: record.ascentDate.toISOString(),
      createdAt: record.createdAt.toISOString(),
      route: {
        id: record.route.id,
        name: record.route.name,
        grade: record.route.grade,
        gradeBand: record.route.gradeBand,
        stars: record.route.stars,
      },
      crag: {
        id: record.route.crag.id,
        name: record.route.crag.name,
      },
      sector: record.route.sector
        ? {
            id: record.route.sector.id,
            name: record.route.sector.name,
          }
        : null,
    }))
  }
}

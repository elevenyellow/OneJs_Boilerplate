import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import { CragAreaDto } from '@scraper-thecrag/domain/dtos/crag-area.dto'

@Injectable()
export class CragAreaRepository {
  constructor(
    @Inject(PrismaClientOneJs)
    private readonly prisma: PrismaClientOneJs,
  ) {}

  async findByExternalId(externalId: string) {
    return this.prisma.cragArea.findUnique({
      where: { externalId },
      include: { children: true, parent: true },
    })
  }

  async findById(id: string) {
    return this.prisma.cragArea.findUnique({
      where: { id },
      include: { children: true, parent: true },
    })
  }

  async save(dto: CragAreaDto, parentId?: string) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    return this.prisma.cragArea.upsert({
      where: { externalId: dto.id },
      create: {
        externalId: dto.id,
        name: dto.name,
        slug,
        type: dto.type,
        url: dto.url,
        routesCount: dto.routesCount,
        parentId,
      },
      update: {
        name: dto.name,
        url: dto.url,
        type: dto.type,
        routesCount: dto.routesCount,
        // Don't update parentId if it's already set or if it's not provided
        ...(parentId ? { parentId } : {}),
      },
    })
  }

  async saveMany(dtos: CragAreaDto[], parentId?: string) {
    // Upsert one by one is safer for relations, though slower than createMany
    // Given the scale of "on demand", this should be fine.
    const results = []
    for (const dto of dtos) {
      results.push(await this.save(dto, parentId))
    }
    return results
  }
}

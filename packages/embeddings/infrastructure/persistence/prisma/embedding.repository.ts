import { PrismaClient } from '@prisma/client'
import { ZoneEmbeddingEntity } from '../../../domain/entities/zone-embedding.entity'
import { EmbeddingVector } from '../../../domain/value-objects/embedding-vector.vo'
import { ZoneMetadata } from '../../../domain/value-objects/zone-metadata.vo'
import {
  IEmbeddingRepository,
  VectorSearchFilters,
  VectorSearchResult,
} from '../../../domain/interfaces/embedding-repository.interface'

/**
 * Embedding Repository using Prisma + pgvector
 * Handles vector similarity search and CRUD operations
 */
export class EmbeddingPrismaRepository implements IEmbeddingRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Save or update a zone embedding
   */
  async upsert(embedding: ZoneEmbeddingEntity): Promise<ZoneEmbeddingEntity> {
    const metadata = embedding.metadata.toJSON()

    const data = {
      zoneId: embedding.zoneId,
      zoneType: embedding.zoneType,
      embedding: `[${embedding.embedding.toArray().join(',')}]`, // pgvector format
      textRepresentation: embedding.textRepresentation,
      latitude: metadata.location.lat,
      longitude: metadata.location.lon,
      locatedness: metadata.location.locatedness || null,
      minGradeIndex: metadata.grades.min,
      maxGradeIndex: metadata.grades.max,
      avgGradeIndex: metadata.grades.avg,
      gradeDistribution: metadata.grades.distribution,
      routeCount: metadata.routeCount,
      seasonalityScores: metadata.seasonality.scores,
      bestMonths: metadata.seasonality.bestMonths,
      approachTimeMin: metadata.approach?.timeMin || null,
      approachDifficulty: metadata.approach?.difficulty || null,
      orientations: metadata.characteristics.orientations,
      rockTypes: metadata.characteristics.rockTypes,
      climbingStyles: metadata.characteristics.climbingStyles,
      sunExposure: metadata.characteristics.sunExposure,
      sheltered: metadata.characteristics.sheltered,
      popularity: metadata.quality.popularity,
      quality: metadata.quality.rating,
      hasTopos: metadata.facilities.hasTopos,
      hasPhotos: metadata.facilities.hasPhotos,
      requiresPermit: metadata.facilities.requiresPermit,
      priceCategory: metadata.facilities.priceCategory,
      hasSport: metadata.routeTypes.sport,
      hasTrad: metadata.routeTypes.trad,
      hasBoulder: metadata.routeTypes.boulder,
      hasMultiPitch: metadata.routeTypes.multiPitch,
      avgRouteHeight: metadata.stats?.avgHeight || null,
      totalAscents: metadata.stats?.totalAscents || null,
      numberPhotos: metadata.stats?.numberPhotos || null,
      numberTopos: metadata.stats?.numberTopos || null,
    }

    const saved = await this.prisma.zoneEmbedding.upsert({
      where: { zoneId: embedding.zoneId },
      create: data,
      update: data,
    })

    return this.toDomain(saved)
  }

  /**
   * Find embedding by zone ID
   */
  async findByZoneId(zoneId: string): Promise<ZoneEmbeddingEntity | null> {
    const embedding = await this.prisma.zoneEmbedding.findUnique({
      where: { zoneId },
    })

    return embedding ? this.toDomain(embedding) : null
  }

  /**
   * Delete embedding by zone ID
   */
  async deleteByZoneId(zoneId: string): Promise<void> {
    await this.prisma.zoneEmbedding.delete({
      where: { zoneId },
    })
  }

  /**
   * Vector similarity search using pgvector
   */
  async search(
    queryEmbedding: EmbeddingVector,
    filters: VectorSearchFilters,
    limit: number = 20,
  ): Promise<VectorSearchResult[]> {
    const whereConditions = this.buildWhereClause(filters)
    const embeddingArray = queryEmbedding.toArray()

    // Use raw SQL for vector similarity search
    // pgvector uses <=> operator for cosine distance
    const query = `
      SELECT 
        *,
        1 - (embedding <=> $1::vector) as similarity,
        embedding <=> $1::vector as distance
      FROM zone_embeddings
      ${whereConditions.sql}
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `

    const params = [
      `[${embeddingArray.join(',')}]`,
      limit,
      ...whereConditions.params,
    ]

    const results = await this.prisma.$queryRawUnsafe<any[]>(query, ...params)

    return results.map((result) => ({
      embedding: this.toDomain(result),
      similarity: parseFloat(result.similarity),
      distance: parseFloat(result.distance),
    }))
  }

  /**
   * Get all embeddings with pagination
   */
  async findAll(
    limit: number = 100,
    offset: number = 0,
  ): Promise<ZoneEmbeddingEntity[]> {
    const embeddings = await this.prisma.zoneEmbedding.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })

    return embeddings.map((e) => this.toDomain(e))
  }

  /**
   * Count total embeddings
   */
  async count(): Promise<number> {
    return this.prisma.zoneEmbedding.count()
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: VectorSearchFilters): {
    sql: string
    params: any[]
  } {
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 3 // Start after $1 (embedding) and $2 (limit)

    if (filters.latitude) {
      if (filters.latitude.gte !== undefined) {
        conditions.push(`latitude >= $${paramIndex}`)
        params.push(filters.latitude.gte)
        paramIndex++
      }
      if (filters.latitude.lte !== undefined) {
        conditions.push(`latitude <= $${paramIndex}`)
        params.push(filters.latitude.lte)
        paramIndex++
      }
    }

    if (filters.longitude) {
      if (filters.longitude.gte !== undefined) {
        conditions.push(`longitude >= $${paramIndex}`)
        params.push(filters.longitude.gte)
        paramIndex++
      }
      if (filters.longitude.lte !== undefined) {
        conditions.push(`longitude <= $${paramIndex}`)
        params.push(filters.longitude.lte)
        paramIndex++
      }
    }

    if (filters.minGradeIndex) {
      if (filters.minGradeIndex.lte !== undefined) {
        conditions.push(`"minGradeIndex" <= $${paramIndex}`)
        params.push(filters.minGradeIndex.lte)
        paramIndex++
      }
    }

    if (filters.maxGradeIndex) {
      if (filters.maxGradeIndex.gte !== undefined) {
        conditions.push(`"maxGradeIndex" >= $${paramIndex}`)
        params.push(filters.maxGradeIndex.gte)
        paramIndex++
      }
    }

    if (filters.routeCount?.gte !== undefined) {
      conditions.push(`"routeCount" >= $${paramIndex}`)
      params.push(filters.routeCount.gte)
      paramIndex++
    }

    if (filters.monthScore) {
      const { month, gte } = filters.monthScore
      conditions.push(
        `("seasonalityScores"::jsonb->>${month - 1})::float >= $${paramIndex}`,
      )
      params.push(gte)
      paramIndex++
    }

    if (filters.orientations?.in && filters.orientations.in.length > 0) {
      conditions.push(`orientations && $${paramIndex}::text[]`)
      params.push(filters.orientations.in)
      paramIndex++
    }

    if (filters.rockTypes?.in && filters.rockTypes.in.length > 0) {
      conditions.push(`"rockTypes" && $${paramIndex}::text[]`)
      params.push(filters.rockTypes.in)
      paramIndex++
    }

    if (filters.climbingStyles?.in && filters.climbingStyles.in.length > 0) {
      conditions.push(`"climbingStyles" && $${paramIndex}::text[]`)
      params.push(filters.climbingStyles.in)
      paramIndex++
    }

    if (filters.popularity?.gte !== undefined) {
      conditions.push(`popularity >= $${paramIndex}`)
      params.push(filters.popularity.gte)
      paramIndex++
    }

    if (filters.quality?.gte !== undefined) {
      conditions.push(`quality >= $${paramIndex}`)
      params.push(filters.quality.gte)
      paramIndex++
    }

    if (filters.hasTopos !== undefined) {
      conditions.push(`"hasTopos" = $${paramIndex}`)
      params.push(filters.hasTopos)
      paramIndex++
    }

    if (filters.hasPhotos !== undefined) {
      conditions.push(`"hasPhotos" = $${paramIndex}`)
      params.push(filters.hasPhotos)
      paramIndex++
    }

    if (filters.requiresPermit !== undefined) {
      conditions.push(`"requiresPermit" = $${paramIndex}`)
      params.push(filters.requiresPermit)
      paramIndex++
    }

    if (filters.hasSport !== undefined) {
      conditions.push(`"hasSport" = $${paramIndex}`)
      params.push(filters.hasSport)
      paramIndex++
    }

    const sql =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    return { sql, params }
  }

  /**
   * Convert database record to domain entity
   */
  private toDomain(record: any): ZoneEmbeddingEntity {
    // Parse embedding vector from pgvector format
    const embeddingArray =
      typeof record.embedding === 'string'
        ? JSON.parse(record.embedding)
        : Array.from(record.embedding)

    const metadata = ZoneMetadata.create({
      location: {
        lat: record.latitude,
        lon: record.longitude,
        locatedness: record.locatedness,
      },
      grades: {
        min: record.minGradeIndex,
        max: record.maxGradeIndex,
        avg: record.avgGradeIndex,
        distribution: record.gradeDistribution,
      },
      routeCount: record.routeCount,
      seasonality: {
        scores: record.seasonalityScores,
        bestMonths: record.bestMonths,
      },
      approach: {
        timeMin: record.approachTimeMin,
        difficulty: record.approachDifficulty,
      },
      characteristics: {
        orientations: record.orientations,
        rockTypes: record.rockTypes,
        climbingStyles: record.climbingStyles,
        sunExposure: record.sunExposure,
        sheltered: record.sheltered,
      },
      quality: {
        popularity: record.popularity,
        rating: record.quality,
      },
      facilities: {
        hasTopos: record.hasTopos,
        hasPhotos: record.hasPhotos,
        requiresPermit: record.requiresPermit,
        priceCategory: record.priceCategory,
      },
      routeTypes: {
        sport: record.hasSport,
        trad: record.hasTrad,
        boulder: record.hasBoulder,
        multiPitch: record.hasMultiPitch,
      },
      stats: {
        avgHeight: record.avgRouteHeight,
        totalAscents: record.totalAscents,
        numberPhotos: record.numberPhotos,
        numberTopos: record.numberTopos,
      },
    })

    return new ZoneEmbeddingEntity(
      record.id,
      record.zoneId,
      record.zoneType,
      EmbeddingVector.create(embeddingArray),
      record.textRepresentation,
      metadata,
      record.createdAt,
      record.updatedAt,
    )
  }
}

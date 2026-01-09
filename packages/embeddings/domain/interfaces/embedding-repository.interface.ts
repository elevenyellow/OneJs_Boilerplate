import { ZoneEmbeddingEntity } from '../entities/zone-embedding.entity'
import { EmbeddingVector } from '../value-objects/embedding-vector.vo'

/**
 * Search filters for vector similarity search
 */
export interface VectorSearchFilters {
  // Geographic filters
  latitude?: { gte?: number; lte?: number }
  longitude?: { gte?: number; lte?: number }

  // Grade filters
  minGradeIndex?: { gte?: number; lte?: number }
  maxGradeIndex?: { gte?: number; lte?: number }

  // Route count filter
  routeCount?: { gte?: number; lte?: number }

  // Seasonality filter (specific month score)
  monthScore?: { month: number; gte: number }

  // Characteristic filters (array contains)
  orientations?: { in: string[] }
  rockTypes?: { in: string[] }
  climbingStyles?: { in: string[] }

  // Quality filters
  popularity?: { gte?: number }
  quality?: { gte?: number }

  // Boolean filters
  hasTopos?: boolean
  hasPhotos?: boolean
  requiresPermit?: boolean
  hasSport?: boolean
  hasTrad?: boolean
  hasBoulder?: boolean
  hasMultiPitch?: boolean
}

/**
 * Search result with similarity score
 */
export interface VectorSearchResult {
  embedding: ZoneEmbeddingEntity
  similarity: number
  distance?: number
}

/**
 * Embedding Repository Interface
 */
export interface IEmbeddingRepository {
  /**
   * Save or update a zone embedding
   */
  upsert(embedding: ZoneEmbeddingEntity): Promise<ZoneEmbeddingEntity>

  /**
   * Find embedding by zone ID
   */
  findByZoneId(zoneId: string): Promise<ZoneEmbeddingEntity | null>

  /**
   * Delete embedding by zone ID
   */
  deleteByZoneId(zoneId: string): Promise<void>

  /**
   * Vector similarity search
   */
  search(
    queryEmbedding: EmbeddingVector,
    filters: VectorSearchFilters,
    limit: number,
  ): Promise<VectorSearchResult[]>

  /**
   * Get all embeddings (for batch processing)
   */
  findAll(limit?: number, offset?: number): Promise<ZoneEmbeddingEntity[]>

  /**
   * Count total embeddings
   */
  count(): Promise<number>
}

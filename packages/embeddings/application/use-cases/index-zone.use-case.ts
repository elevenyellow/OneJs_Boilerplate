import { CragPrismaRepository } from '@climb-zone/crag'
import { SectorPrismaRepository } from '@climb-zone/sector'
import { RoutePrismaRepository } from '@climb-zone/route'
import { IEmbeddingService } from '../../domain/interfaces/embedding-service.interface'
import { IEmbeddingRepository } from '../../domain/interfaces/embedding-repository.interface'
import { TextGeneratorService } from '../services/text-generator.service'
import { MetadataExtractorService } from '../services/metadata-extractor.service'
import { ZoneEmbeddingEntity } from '../../domain/entities/zone-embedding.entity'

/**
 * Index Zone Use Case
 * Generates and stores embedding for a single climbing zone
 */
export class IndexZoneUseCase {
  constructor(
    private cragRepository: CragPrismaRepository,
    private sectorRepository: SectorPrismaRepository,
    private routeRepository: RoutePrismaRepository,
    private embeddingService: IEmbeddingService,
    private embeddingRepository: IEmbeddingRepository,
    private textGenerator: TextGeneratorService,
    private metadataExtractor: MetadataExtractorService,
  ) {}

  /**
   * Index a single crag by ID
   */
  async execute(cragId: string): Promise<ZoneEmbeddingEntity> {
    console.log(`📍 Indexing crag: ${cragId}`)

    // 1. Fetch crag data
    const crag = await this.cragRepository.findById(cragId)
    if (!crag) {
      throw new Error(`Crag not found: ${cragId}`)
    }

    // 2. Fetch related sectors and routes
    const sectors = await this.sectorRepository.findByCragId(crag.id)
    const sectorIds = sectors.map((s) => s.id)
    const routes =
      sectorIds.length > 0
        ? await this.routeRepository.findBySectorIds(sectorIds)
        : []

    console.log(
      `   ✓ Found ${sectors.length} sectors and ${routes.length} routes`,
    )

    // 3. Generate text representation
    const textRepresentation = this.textGenerator.generateCragText(
      crag,
      sectors,
      routes,
    )

    console.log(`   ✓ Generated text representation (${textRepresentation.length} chars)`)

    // 4. Generate embedding
    const embeddingVector = await this.embeddingService.generateEmbedding(
      textRepresentation,
    )

    console.log(`   ✓ Generated embedding (${embeddingVector.length} dimensions)`)

    // 5. Extract metadata
    const metadata = this.metadataExtractor.extract(crag, sectors, routes)

    console.log(`   ✓ Extracted metadata`)

    // 6. Create and save embedding entity
    const embeddingEntity = ZoneEmbeddingEntity.create(
      crag.id.toString(),
      'crag',
      embeddingVector,
      textRepresentation,
      metadata,
    )

    const saved = await this.embeddingRepository.upsert(embeddingEntity)

    console.log(`   ✅ Successfully indexed: ${crag.name.toString()}`)

    return saved
  }

  /**
   * Re-index an existing crag (updates embedding)
   */
  async reindex(cragId: string): Promise<ZoneEmbeddingEntity> {
    console.log(`🔄 Re-indexing crag: ${cragId}`)
    return this.execute(cragId)
  }
}

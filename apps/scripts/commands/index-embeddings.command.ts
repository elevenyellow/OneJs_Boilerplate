/**
 * Command: index-embeddings
 * Index all climbing zones for semantic search
 */

import { PrismaClient } from '@prisma/client'
import { CragPrismaRepository } from '@climb-zone/crag'
import { SectorPrismaRepository } from '@climb-zone/sector'
import { RoutePrismaRepository } from '@climb-zone/route'
import {
  OpenAIEmbeddingService,
  EmbeddingPrismaRepository,
  TextGeneratorService,
  MetadataExtractorService,
  IndexZoneUseCase,
  IndexAllZonesUseCase,
} from '@climb-zone/embeddings'

export async function indexEmbeddings(
  container: any,
  options?: {
    cragId?: string
    all?: boolean
    skipExisting?: boolean
    batchSize?: number
  },
) {
  const prisma = new PrismaClient()

  try {
    // Initialize services
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    console.log('🚀 Initializing embedding services...\n')

    const embeddingService = new OpenAIEmbeddingService(apiKey)
    const embeddingRepository = new EmbeddingPrismaRepository(prisma)
    const textGenerator = new TextGeneratorService()
    const metadataExtractor = new MetadataExtractorService()

    const cragRepo = container.get(CragPrismaRepository)
    const sectorRepo = container.get(SectorPrismaRepository)
    const routeRepo = container.get(RoutePrismaRepository)

    const indexZoneUseCase = new IndexZoneUseCase(
      cragRepo,
      sectorRepo,
      routeRepo,
      embeddingService,
      embeddingRepository,
      textGenerator,
      metadataExtractor,
    )

    // Single crag indexing
    if (options?.cragId) {
      console.log(`📍 Indexing single crag: ${options.cragId}\n`)
      const result = await indexZoneUseCase.execute(options.cragId)
      console.log('\n✅ Indexing complete!')
      console.log(`   Zone ID: ${result.zoneId}`)
      console.log(`   Dimensions: ${result.embedding.getDimensions()}`)
      console.log(`   Text length: ${result.textRepresentation.length} chars`)
      return
    }

    // Batch indexing
    if (options?.all) {
      const indexAllUseCase = new IndexAllZonesUseCase(cragRepo, indexZoneUseCase)

      const stats = await indexAllUseCase.execute({
        batchSize: options.batchSize || 10,
        skipExisting: options.skipExisting || false,
        onProgress: (current, total, name) => {
          console.log(`   [${current}/${total}] ${name}`)
        },
      })

      console.log('\n📊 Final Statistics:')
      console.log(`   ✅ Indexed: ${stats.indexed}`)
      console.log(`   ⏭️  Skipped: ${stats.skipped}`)
      console.log(`   ❌ Errors: ${stats.errors}`)
      return
    }

    // Show help
    console.log('Usage:')
    console.log('  bun run cli index-embeddings --cragId=<id>       # Index single crag')
    console.log('  bun run cli index-embeddings --all               # Index all crags')
    console.log('  bun run cli index-embeddings --all --skipExisting # Skip already indexed')
    console.log(
      '  bun run cli index-embeddings --all --batchSize=20 # Custom batch size',
    )
  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

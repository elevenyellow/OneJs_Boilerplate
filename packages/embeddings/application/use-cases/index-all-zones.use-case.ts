import { CragPrismaRepository } from '@climb-zone/crag'
import { IEmbeddingRepository } from '../../domain/interfaces/embedding-repository.interface'
import { IndexZoneUseCase } from './index-zone.use-case'

/**
 * Index All Zones Use Case
 * Batch processes all climbing zones to generate embeddings
 */
export class IndexAllZonesUseCase {
  constructor(
    private cragRepository: CragPrismaRepository,
    private embeddingRepository: IEmbeddingRepository,
    private indexZoneUseCase: IndexZoneUseCase,
  ) {}

  /**
   * Index all crags in the database
   */
  async execute(options?: {
    batchSize?: number
    skipExisting?: boolean
    onProgress?: (current: number, total: number, cragName: string) => void
  }): Promise<{ indexed: number; errors: number; skipped: number }> {
    const batchSize = options?.batchSize || 10
    const skipExisting = options?.skipExisting || false

    console.log('🚀 Starting zone indexing...')
    console.log(`   Batch size: ${batchSize}`)
    console.log(`   Skip existing: ${skipExisting}`)

    const stats = {
      indexed: 0,
      errors: 0,
      skipped: 0,
    }

    // Get all crags
    const crags = await this.cragRepository.findAll()
    const total = crags.length

    console.log(`\n📊 Found ${total} crags to index\n`)

    // Process in batches
    for (let i = 0; i < crags.length; i += batchSize) {
      const batch = crags.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (crag) => {
          try {
            // Check if already indexed
            if (skipExisting) {
              const existing = await this.embeddingRepository.findByZoneId(
                crag.id.toString(),
              )
              if (existing) {
                stats.skipped++
                console.log(`   ⏭️  Skipped: ${crag.name.toString()} (already indexed)`)
                return
              }
            }

            await this.indexZoneUseCase.execute(crag.id.toString())
            stats.indexed++

            if (options?.onProgress) {
              options.onProgress(
                i + stats.indexed,
                total,
                crag.name.toString(),
              )
            }
          } catch (error) {
            stats.errors++
            console.error(
              `   ❌ Error indexing ${crag.name.toString()}:`,
              error instanceof Error ? error.message : error,
            )
          }
        }),
      )

      // Rate limiting between batches
      if (i + batchSize < crags.length) {
        await this.delay(500)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Indexing complete!')
    console.log('='.repeat(60))
    console.log(`✅ Successfully indexed: ${stats.indexed}`)
    console.log(`⏭️  Skipped: ${stats.skipped}`)
    console.log(`❌ Errors: ${stats.errors}`)
    console.log('='.repeat(60))

    return stats
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

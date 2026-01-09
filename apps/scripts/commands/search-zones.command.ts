/**
 * Command: search-zones
 * Test semantic search for climbing zones
 */

import { PrismaClient } from '@prisma/client'

import {
  EmbeddingPrismaRepository,
  OpenAIEmbeddingService,
  SearchZonesUseCase,
  type SearchZonesQuery,
} from '@embeddings'

export async function searchZones(
  container: any,
  query: string,
  options?: {
    lat?: number
    lon?: number
    maxDistance?: number
    minGrade?: string
    maxGrade?: string
    month?: number
    limit?: number
  },
) {
  const prisma = new PrismaClient()

  try {
    // Initialize services
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    console.log('🔍 Initializing search...\n')

    const embeddingService = new OpenAIEmbeddingService(apiKey)
    const embeddingRepository = new EmbeddingPrismaRepository(prisma)
    // const cragRepo = container.get(CragPrismaRepository)

    const searchUseCase = new SearchZonesUseCase(
      embeddingService,
      embeddingRepository,
    )

    // Build search query
    const searchQuery: SearchZonesQuery = {
      query,
      userLocation:
        options?.lat && options?.lon
          ? { lat: options.lat, lon: options.lon }
          : undefined,
      maxDistance: options?.maxDistance,
      gradeRange:
        options?.minGrade && options?.maxGrade
          ? { min: options.minGrade, max: options.maxGrade }
          : undefined,
      month: options?.month,
      limit: options?.limit || 10,
    }

    console.log('📋 Search Parameters:')
    console.log(`   Query: "${searchQuery.query}"`)
    if (searchQuery.userLocation) {
      console.log(
        `   Location: ${searchQuery.userLocation.lat}, ${searchQuery.userLocation.lon}`,
      )
      console.log(
        `   Max Distance: ${searchQuery.maxDistance || 'unlimited'} km`,
      )
    }
    if (searchQuery.gradeRange) {
      console.log(
        `   Grade Range: ${searchQuery.gradeRange.min} - ${searchQuery.gradeRange.max}`,
      )
    }
    if (searchQuery.month) {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]
      console.log(`   Best Month: ${months[searchQuery.month - 1]}`)
    }
    console.log(`   Limit: ${searchQuery.limit}`)
    console.log()

    // Execute search
    const results = await searchUseCase.execute(searchQuery)

    // Display results
    console.log(`\n📊 Found ${results.length} results:\n`)
    console.log('='.repeat(80))

    for (let i = 0; i < results.length; i++) {
      const result = results[i]

      console.log(`\n${i + 1}. Zone ID: ${result.zoneId}`)
      console.log(`   Type: ${result.zoneType}`)
      console.log(
        `   Score: ${(result.finalScore * 100).toFixed(1)}% (similarity: ${(result.similarity * 100).toFixed(1)}%)`,
      )

      if (result.distance) {
        console.log(`   Distance: ${result.distance.toFixed(1)} km`)
      }

      console.log(`   Routes: ${result.metadata.routeCount}`)
      console.log(`   Grades: ${result.metadata.gradeRange}`)

      if (result.metadata.orientations.length > 0) {
        console.log(
          `   Orientations: ${result.metadata.orientations.join(', ')}`,
        )
      }

      if (result.metadata.rockTypes.length > 0) {
        console.log(`   Rock Types: ${result.metadata.rockTypes.join(', ')}`)
      }

      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      const bestMonths = result.metadata.bestMonths.map((m) => months[m - 1])
      console.log(`   Best Months: ${bestMonths.join(', ')}`)

      console.log(
        `   Quality: ${(result.metadata.quality * 100).toFixed(0)}% | Popularity: ${(result.metadata.popularity * 100).toFixed(0)}%`,
      )
      console.log(`   Topos: ${result.metadata.hasTopos ? '✓' : '✗'}`)

      console.log(`\n   Preview: ${result.preview}...`)
      console.log()
    }

    console.log('='.repeat(80))
  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

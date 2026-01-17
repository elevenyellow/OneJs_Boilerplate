import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { PrismaClientOneJs } from '@OneJs/prisma'
import { Coordinates } from '@crags/domain/value-objects'
import { SearchCragRepository } from '../../../infrastructure/persistence/search-crag.repository'
import { GradeRange } from '../../../domain/value-objects/grade-range.vo'
import { SearchCriteria } from '../../../domain/value-objects/search-criteria.vo'
import { SeasonPreference } from '../../../domain/types/seasonality.types'
import { CragScoringService } from '../../../domain/services/crag-scoring.service'
import { DistanceScoringStrategy } from '../../../domain/services/strategies/distance-scoring.strategy'
import { GradeMatchScoringStrategy } from '../../../domain/services/strategies/grade-match-scoring.strategy'
import { RouteCountScoringStrategy } from '../../../domain/services/strategies/route-count-scoring.strategy'
import { SeasonalityScoringStrategy } from '../../../domain/services/strategies/seasonality-scoring.strategy'
import { SearchCragsWithScoringUseCase } from '../search-crags-with-scoring.use-case'

describe('SearchCragsWithScoringUseCase Integration', () => {
  let prismaClient: PrismaClientOneJs
  let repository: SearchCragRepository
  let useCase: SearchCragsWithScoringUseCase
  const testPrefix = 'test-search-integration-'

  beforeEach(async () => {
    // MANDATORY: Verify TEST_DATABASE_URL exists
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error(
        'TEST_DATABASE_URL is required for integration tests. ' +
          'Please set TEST_DATABASE_URL to a separate test database.',
      )
    }

    // Create Prisma client with test database
    prismaClient = new PrismaClientOneJs({
      datasources: {
        db: { url: process.env.TEST_DATABASE_URL },
      },
    })

    // Initialize repository
    repository = new SearchCragRepository(prismaClient)

    // Initialize use case with scoring service
    const scoringService = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 0.4 },
      { strategy: new GradeMatchScoringStrategy(), weight: 0.3 },
      { strategy: new SeasonalityScoringStrategy(), weight: 0.2 },
      { strategy: new RouteCountScoringStrategy(), weight: 0.1 },
    ])

    useCase = new SearchCragsWithScoringUseCase(repository)
    // Override internal scoring service for testing
    Object.assign(useCase, { scoringService })

    // Clean database before test
    await cleanupTestData()
  })

  afterEach(async () => {
    // Clean database after test
    await cleanupTestData()
    await prismaClient.$disconnect()
  })

  async function cleanupTestData() {
    try {
      // Delete test crags
      await prismaClient.crag.deleteMany({
        where: { id: { startsWith: testPrefix } },
      })
      // Delete test zones
      await prismaClient.zone.deleteMany({
        where: { id: { startsWith: testPrefix } },
      })
    } catch (error) {
      console.error('Cleanup failed:', error)
      throw error
    }
  }

  async function createTestZone(id: string): Promise<string> {
    const zone = await prismaClient.zone.create({
      data: {
        id,
        externalId: `ext-${id}`,
        name: 'Test Zone',
        asciiName: 'Test Zone',
        type: 'zone',
        subType: 'area',
        urlStub: 'test-zone',
        urlAncestorStub: null,
        headerImage: null,
        latitude: 41.7,
        longitude: 1.8,
        areaSize: null,
        geometry: null,
        numberRoutes: 0,
        numberPhotos: 0,
        numberTopos: 0,
        ascentCount: 0,
        kudos: 0,
        totalFavorites: 0,
        averageHeight: null,
        averageHeightUnit: null,
        gbAscents: [],
        gbRoutes: [],
        beta: null,
        styles: null,
        tags: null,
        altNames: null,
        seasonality: [],
        hasTopo: false,
        hasSectors: false,
        parentId: null,
      },
    })
    return zone.id
  }

  async function createTestCrag(
    id: string,
    zoneId: string,
    name: string,
    lat: number,
    lng: number,
    gbRoutes: number[],
    seasonality: number[],
    numberRoutes: number,
  ): Promise<string> {
    const crag = await prismaClient.crag.create({
      data: {
        id,
        externalId: `ext-${id}`,
        zoneId,
        name,
        asciiName: name,
        type: 'crag',
        subType: 'sport',
        urlStub: name.toLowerCase().replace(/\s+/g, '-'),
        urlAncestorStub: null,
        headerImage: null,
        latitude: lat,
        longitude: lng,
        areaSize: null,
        geometry: {},
        numberRoutes,
        numberPhotos: 10,
        numberTopos: 5,
        ascentCount: 100,
        kudos: 20,
        totalFavorites: 15,
        averageHeight: 25,
        averageHeightUnit: 'm',
        gbAscents: new Array(100).fill(0),
        gbRoutes,
        beta: {},
        styles: {},
        tags: {},
        altNames: {},
        seasonality,
        hasTopo: true,
        hasSectors: true,
      },
    })
    return crag.id
  }

  test('should find crags within radius and grade range', async () => {
    // Arrange - Create test zone
    const zoneId = await createTestZone(`${testPrefix}zone-${Date.now()}`)

    // Create crags with different properties
    const gbRoutes1 = new Array(100).fill(0)
    gbRoutes1[25] = 50 // 50 routes at grade band 25 (within search range 20-30)

    const gbRoutes2 = new Array(100).fill(0)
    gbRoutes2[26] = 30 // 30 routes at grade band 26

    await createTestCrag(
      `${testPrefix}crag-1-${Date.now()}`,
      zoneId,
      'Crag Close',
      41.7,
      1.8, // Very close to search origin
      gbRoutes1,
      [6, 7, 8, 9], // Summer months
      50,
    )

    await createTestCrag(
      `${testPrefix}crag-2-${Date.now() + 1}`,
      zoneId,
      'Crag Far',
      41.75,
      1.85, // A bit further
      gbRoutes2,
      [6, 7, 8, 9],
      30,
    )

    // Act - Search for crags
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(20, 30)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
      10,
    )

    const results = await useCase.execute(criteria)

    // Assert
    expect(results.length).toBe(2)
    expect(results[0].getCrag().getName()).toBe('Crag Close')
    expect(results[1].getCrag().getName()).toBe('Crag Far')
    // Closer crag should have higher score
    expect(results[0].getTotalScore()).toBeGreaterThan(
      results[1].getTotalScore(),
    )
  })

  test('should filter by seasonality preference', async () => {
    // Arrange
    const zoneId = await createTestZone(
      `${testPrefix}zone-season-${Date.now()}`,
    )

    const gbRoutes = new Array(100).fill(0)
    gbRoutes[25] = 50

    // Summer crag
    await createTestCrag(
      `${testPrefix}summer-${Date.now()}`,
      zoneId,
      'Summer Crag',
      41.7,
      1.8,
      gbRoutes,
      [6, 7, 8, 9], // Summer months
      50,
    )

    // Winter crag
    await createTestCrag(
      `${testPrefix}winter-${Date.now() + 1}`,
      zoneId,
      'Winter Crag',
      41.71,
      1.81,
      gbRoutes,
      [12, 1, 2, 3], // Winter months
      50,
    )

    // Act - Search for summer crags
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(20, 30)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
      10,
    )

    const results = await useCase.execute(criteria)

    // Assert - Only summer crag should match
    expect(results.length).toBe(1)
    expect(results[0].getCrag().getName()).toBe('Summer Crag')
  })

  test('should respect limit parameter', async () => {
    // Arrange
    const zoneId = await createTestZone(`${testPrefix}zone-limit-${Date.now()}`)

    const gbRoutes = new Array(100).fill(0)
    gbRoutes[25] = 50

    // Create 5 crags
    for (let i = 0; i < 5; i++) {
      await createTestCrag(
        `${testPrefix}crag-${i}-${Date.now() + i}`,
        zoneId,
        `Crag ${i}`,
        41.7 + i * 0.01,
        1.8 + i * 0.01,
        gbRoutes,
        [6, 7, 8, 9],
        50,
      )
    }

    // Act - Search with limit 3
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(20, 30)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
      3,
    )

    const results = await useCase.execute(criteria)

    // Assert - Only 3 results should be returned
    expect(results.length).toBe(3)
  })

  test('should return empty array when no crags match criteria', async () => {
    // Arrange
    const zoneId = await createTestZone(
      `${testPrefix}zone-nomatch-${Date.now()}`,
    )

    const gbRoutes = new Array(100).fill(0)
    gbRoutes[50] = 50 // Routes at grade band 50 (outside search range)

    await createTestCrag(
      `${testPrefix}nomatch-${Date.now()}`,
      zoneId,
      'No Match Crag',
      41.7,
      1.8,
      gbRoutes,
      [6, 7, 8, 9],
      50,
    )

    // Act - Search for grades 20-30 (crag has grades at 50)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(20, 30)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
      10,
    )

    const results = await useCase.execute(criteria)

    // Assert
    expect(results.length).toBe(0)
  })
})

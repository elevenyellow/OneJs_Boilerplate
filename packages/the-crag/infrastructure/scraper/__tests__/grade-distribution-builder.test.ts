import { describe, expect, test } from 'bun:test'
import { GradeDistributionBuilder } from '../grade-distribution-builder'
import type { ScrapedRoute } from '../api.interfaces'

describe('GradeDistributionBuilder', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ buildGbRoutes counts routes at correct indices
  // 2. ✓ buildGbRoutes handles French grades (6a, 7b+, etc.)
  // 3. ✓ buildGbRoutes handles YDS grades (5.10a, 5.12d, etc.)
  // 4. ✓ buildGbRoutes handles Font boulder grades (6A, 7C+, etc.)
  // 5. ✓ buildGbRoutes handles Hueco grades (V0, V5, etc.)
  // 6. ✓ buildGbRoutes skips routes without grades
  // 7. ✓ buildGbRoutes skips project/unknown grades
  // 8. ✓ buildGbAscents sums ascents at correct indices
  // 9. ✓ aggregateGbRoutes combines multiple areas
  // 10. ✓ aggregateGbAscents combines multiple areas

  function createMockRoute(
    grade: string | null,
    gradeStyle: string = 'french',
    ascentCount: number = 0,
  ): ScrapedRoute {
    return {
      id: '1',
      name: 'Test Route',
      type: 'route',
      grade,
      gradeAtom: null,
      gradeBand: 0,
      gradeStyle,
      gradeInContext: null,
      rawGrade: null,
      height: null,
      displayHeight: null,
      pitches: null,
      qualityScore: null,
      stars: null,
      ascents: null,
      ascentCount,
      style: null,
      styleStub: null,
      bolts: null,
      firstAscent: null,
      tags: null,
      warnings: null,
      flags: null,
      popularity: null,
      relativePopularity: null,
      cragScore: null,
      siblingLabel: 0,
      parentID: '0',
      depth: 0,
      context: '',
      urlAncestorStub: null,
      description: null,
      equipper: null,
      equipDate: null,
      maintainer: null,
      maintDate: null,
      descriptionHtml: null,
      akaNames: [],
      isClosed: false,
      hasWarning: false,
      warningText: null,
      hasTopoHtml: false,
      topoNumber: null,
    }
  }

  test('should build gbRoutes with correct counts for French grades', () => {
    const routes = [
      createMockRoute('6a', 'french'), // index 24
      createMockRoute('6a', 'french'), // index 24
      createMockRoute('7a', 'french'), // index 30
      createMockRoute('7b+', 'french'), // index 33
      createMockRoute('7b+', 'french'), // index 33
      createMockRoute('7b+', 'french'), // index 33
    ]

    const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)

    expect(gbRoutes[24]).toBe(2) // 2 routes at 6a
    expect(gbRoutes[30]).toBe(1) // 1 route at 7a
    expect(gbRoutes[33]).toBe(3) // 3 routes at 7b+
    expect(gbRoutes.length).toBe(100)
  })

  test('should handle YDS grades correctly', () => {
    const routes = [
      createMockRoute('5.10a', 'yds'), // index 24 (same as 6a)
      createMockRoute('5.11a', 'yds'), // index 28 (same as 6c)
      createMockRoute('5.12a', 'yds'), // index 32 (same as 7b)
    ]

    const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)

    expect(gbRoutes[24]).toBe(1) // 5.10a
    expect(gbRoutes[28]).toBe(1) // 5.11a
    expect(gbRoutes[32]).toBe(1) // 5.12a
  })

  test('should handle Font boulder grades correctly', () => {
    const routes = [
      createMockRoute('6A', 'font'), // index 20
      createMockRoute('6C+', 'font'), // index 28
      createMockRoute('7A', 'font'), // index 30
    ]

    const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)

    expect(gbRoutes[20]).toBe(1) // 6A
    expect(gbRoutes[28]).toBe(1) // 6C+
    expect(gbRoutes[30]).toBe(1) // 7A
  })

  test('should handle Hueco V-scale grades correctly', () => {
    const routes = [
      createMockRoute('V0', 'hueco'), // index 14
      createMockRoute('V4', 'hueco'), // index 26
      createMockRoute('V6', 'hueco'), // index 30
    ]

    const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)

    expect(gbRoutes[14]).toBe(1) // V0
    expect(gbRoutes[26]).toBe(1) // V4
    expect(gbRoutes[30]).toBe(1) // V6
  })

  test('should skip routes without grades', () => {
    const routes = [
      createMockRoute(null, 'french'),
      createMockRoute('6a', 'french'), // index 24
      createMockRoute(null, 'french'),
    ]

    const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)

    expect(gbRoutes[24]).toBe(1)
    // Check that only one route was counted
    const totalRoutes = gbRoutes.reduce((sum, count) => sum + count, 0)
    expect(totalRoutes).toBe(1)
  })

  test('should skip project and unknown grades', () => {
    const routes = [
      createMockRoute('Project', 'french'),
      createMockRoute('?', 'french'),
      createMockRoute('Unknown', 'french'),
      createMockRoute('6a', 'french'), // index 24
    ]

    const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)

    expect(gbRoutes[24]).toBe(1)
    // Check that only one route was counted
    const totalRoutes = gbRoutes.reduce((sum, count) => sum + count, 0)
    expect(totalRoutes).toBe(1)
  })

  test('should build gbAscents with correct ascent counts', () => {
    const routes = [
      createMockRoute('6a', 'french', 10), // index 24
      createMockRoute('6a', 'french', 20), // index 24
      createMockRoute('7a', 'french', 5), // index 30
    ]

    const gbAscents = GradeDistributionBuilder.buildGbAscents(routes)

    expect(gbAscents[24]).toBe(30) // 10 + 20 ascents at 6a
    expect(gbAscents[30]).toBe(5) // 5 ascents at 7a
  })

  test('should aggregate gbRoutes from multiple areas', () => {
    const area1 = {
      gbRoutes: new Array(100).fill(0),
    }
    area1.gbRoutes[24] = 10 // 10 routes at 6a
    area1.gbRoutes[30] = 5 // 5 routes at 7a

    const area2 = {
      gbRoutes: new Array(100).fill(0),
    }
    area2.gbRoutes[24] = 15 // 15 routes at 6a
    area2.gbRoutes[32] = 8 // 8 routes at 7b

    const aggregated = GradeDistributionBuilder.aggregateGbRoutes([
      area1,
      area2,
    ])

    expect(aggregated[24]).toBe(25) // 10 + 15
    expect(aggregated[30]).toBe(5) // 5 + 0
    expect(aggregated[32]).toBe(8) // 0 + 8
  })

  test('should aggregate gbAscents from multiple areas', () => {
    const area1 = {
      gbAscents: new Array(100).fill(0),
    }
    area1.gbAscents[24] = 100
    area1.gbAscents[30] = 50

    const area2 = {
      gbAscents: new Array(100).fill(0),
    }
    area2.gbAscents[24] = 200
    area2.gbAscents[32] = 75

    const aggregated = GradeDistributionBuilder.aggregateGbAscents([
      area1,
      area2,
    ])

    expect(aggregated[24]).toBe(300) // 100 + 200
    expect(aggregated[30]).toBe(50) // 50 + 0
    expect(aggregated[32]).toBe(75) // 0 + 75
  })

  test('should detect grade system from grade string format', () => {
    // This test verifies the internal detection logic by checking results
    const frenchRoute = createMockRoute('6a', '') // No gradeStyle, rely on detection
    const ydsRoute = createMockRoute('5.10a', '')
    const huecoRoute = createMockRoute('V5', '')
    const fontRoute = createMockRoute('6A', '')

    const routes = [frenchRoute, ydsRoute, huecoRoute, fontRoute]
    const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)

    // Verify each was converted correctly (proves detection worked)
    expect(gbRoutes[24]).toBe(2) // 6a french + 5.10a yds
    expect(gbRoutes[28]).toBe(1) // V5 hueco
    expect(gbRoutes[20]).toBe(1) // 6A font
  })

  test('should return empty array for empty input', () => {
    const gbRoutes = GradeDistributionBuilder.buildGbRoutes([])

    expect(gbRoutes.length).toBe(100)
    const totalRoutes = gbRoutes.reduce((sum, count) => sum + count, 0)
    expect(totalRoutes).toBe(0)
  })

  test('should handle mixed grade systems in same area', () => {
    const routes = [
      createMockRoute('6a', 'french'), // index 24
      createMockRoute('5.10a', 'yds'), // index 24
      createMockRoute('V4', 'hueco'), // index 26
      createMockRoute('7A', 'font'), // index 30
    ]

    const gbRoutes = GradeDistributionBuilder.buildGbRoutes(routes)

    expect(gbRoutes[24]).toBe(2) // French + YDS
    expect(gbRoutes[26]).toBe(1) // Hueco
    expect(gbRoutes[30]).toBe(1) // Font
  })
})

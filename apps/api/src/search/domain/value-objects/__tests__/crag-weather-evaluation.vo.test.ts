import { describe, expect, test } from 'bun:test'
import { CragWeatherEvaluation } from '../crag-weather-evaluation.vo'

describe('CragWeatherEvaluation Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create evaluation with sector evaluations
  // 2. ✓ Calculate overall score as average of sector scores
  // 3. ✓ Count sectors with good conditions (score >= 2.0)
  // 4. ✓ Label excellent for score >= 3.0
  // 5. ✓ Label good for score >= 2.0
  // 6. ✓ Label fair for score >= 1.0
  // 7. ✓ Label poor for score < 1.0
  // 8. ✓ Handle empty sector evaluations
  // 9. ✓ Create sector evaluation helper
  // 10. ✓ Convert to primitives and back
  // 11. ✓ Convert to DTO
  // 12. ✓ Calculate good conditions percentage
  // 13. ✓ Check majority good conditions

  test('should create evaluation with sector evaluations', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 3.5),
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 2.5),
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    expect(evaluation.getCragId()).toBe('crag-123')
    expect(evaluation.getDate()).toBe('2025-01-17')
    expect(evaluation.getTotalSectors()).toBe(2)
    expect(evaluation.getSectorEvaluations()).toHaveLength(2)
  })

  test('should calculate overall score as average of sector scores', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 4.0),
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 2.0),
      CragWeatherEvaluation.createSectorEvaluation('sector-3', 3.0),
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    // Average: (4.0 + 2.0 + 3.0) / 3 = 3.0
    expect(evaluation.getOverallScore()).toBe(3.0)
  })

  test('should count sectors with good conditions (score >= 2.0)', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 3.5), // Good
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 1.5), // Poor
      CragWeatherEvaluation.createSectorEvaluation('sector-3', 2.0), // Good
      CragWeatherEvaluation.createSectorEvaluation('sector-4', 0.5), // Poor
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    expect(evaluation.getSectorsWithGoodConditions()).toBe(2)
  })

  test('should label excellent for score >= 3.0', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 3.5),
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 3.0),
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    // Average: (3.5 + 3.0) / 2 = 3.25
    expect(evaluation.getLabel()).toBe('excellent')
  })

  test('should label good for score >= 2.0 and < 3.0', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 2.5),
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 2.5),
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    // Average: 2.5
    expect(evaluation.getLabel()).toBe('good')
  })

  test('should label fair for score >= 1.0 and < 2.0', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 1.5),
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 1.5),
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    // Average: 1.5
    expect(evaluation.getLabel()).toBe('fair')
  })

  test('should label poor for score < 1.0', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 0.5),
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 0.5),
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    // Average: 0.5
    expect(evaluation.getLabel()).toBe('poor')
  })

  test('should handle empty sector evaluations', () => {
    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: [],
    })

    expect(evaluation.getTotalSectors()).toBe(0)
    expect(evaluation.getSectorsWithGoodConditions()).toBe(0)
    expect(evaluation.getOverallScore()).toBe(0)
    expect(evaluation.getLabel()).toBe('poor')
  })

  test('should create sector evaluation with hasGoodConditions flag', () => {
    const goodSector = CragWeatherEvaluation.createSectorEvaluation(
      'sector-1',
      2.5,
    )
    const poorSector = CragWeatherEvaluation.createSectorEvaluation(
      'sector-2',
      1.5,
    )

    expect(goodSector.hasGoodConditions).toBe(true)
    expect(poorSector.hasGoodConditions).toBe(false)
  })

  test('should convert to primitives and back', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 3.0),
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 2.5),
    ]

    const original = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    const primitives = original.toPrimitives()
    const restored = CragWeatherEvaluation.fromPrimitives(primitives)

    expect(restored.getCragId()).toBe(original.getCragId())
    expect(restored.getDate()).toBe(original.getDate())
    expect(restored.getTotalSectors()).toBe(original.getTotalSectors())
    expect(restored.getOverallScore()).toBe(original.getOverallScore())
    expect(restored.getLabel()).toBe(original.getLabel())
    expect(restored.getSectorEvaluations()).toHaveLength(2)
  })

  test('should convert to DTO for API response', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 2.555),
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 2.555),
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    const dto = evaluation.toDto()

    expect(dto.totalSectors).toBe(2)
    expect(dto.sectorsWithGoodConditions).toBe(2)
    expect(dto.overallScore).toBe(2.56) // Rounded to 2 decimal places
    expect(dto.label).toBe('good')
  })

  test('should calculate good conditions percentage', () => {
    const sectorEvals = [
      CragWeatherEvaluation.createSectorEvaluation('sector-1', 3.0), // Good
      CragWeatherEvaluation.createSectorEvaluation('sector-2', 1.0), // Poor
      CragWeatherEvaluation.createSectorEvaluation('sector-3', 2.5), // Good
      CragWeatherEvaluation.createSectorEvaluation('sector-4', 0.5), // Poor
    ]

    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: sectorEvals,
    })

    // 2 out of 4 = 50%
    expect(evaluation.getGoodConditionsPercentage()).toBe(50)
  })

  test('should return 0% for empty sectors', () => {
    const evaluation = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: [],
    })

    expect(evaluation.getGoodConditionsPercentage()).toBe(0)
  })

  test('should check if majority has good conditions', () => {
    const majorityGood = CragWeatherEvaluation.create({
      cragId: 'crag-123',
      date: '2025-01-17',
      sectorEvaluations: [
        CragWeatherEvaluation.createSectorEvaluation('sector-1', 3.0),
        CragWeatherEvaluation.createSectorEvaluation('sector-2', 2.5),
        CragWeatherEvaluation.createSectorEvaluation('sector-3', 1.0),
      ],
    })

    const majorityPoor = CragWeatherEvaluation.create({
      cragId: 'crag-456',
      date: '2025-01-17',
      sectorEvaluations: [
        CragWeatherEvaluation.createSectorEvaluation('sector-1', 3.0),
        CragWeatherEvaluation.createSectorEvaluation('sector-2', 1.0),
        CragWeatherEvaluation.createSectorEvaluation('sector-3', 0.5),
      ],
    })

    // 2 out of 3 = 66.67% (majority)
    expect(majorityGood.hasMajorityGoodConditions()).toBe(true)

    // 1 out of 3 = 33.33% (not majority)
    expect(majorityPoor.hasMajorityGoodConditions()).toBe(false)
  })
})

import { describe, expect, test } from 'bun:test'
import { isInOptimalSeason, formatSeasonalityRange } from '../cragHelpers'

describe('Crag Helpers - Seasonality', () => {
  // TEST CASES LIST
  // 1. isInOptimalSeason - winter crag in January (should be in season)
  // 2. isInOptimalSeason - winter crag in July (should be off season)
  // 3. isInOptimalSeason - summer crag in July (should be in season)
  // 4. isInOptimalSeason - summer crag in January (should be off season)
  // 5. isInOptimalSeason - empty array (should return false)
  // 6. isInOptimalSeason - wrong array length (should return false)
  // 7. formatSeasonalityRange - winter crag shows correct months
  // 8. formatSeasonalityRange - summer crag shows correct months
  // 9. formatSeasonalityRange - year-round crag

  describe('isInOptimalSeason', () => {
    test('should return true for winter crag when current month has high score', () => {
      // Winter crag: high scores in Jan/Feb/Nov/Dec, low in summer
      const winterCrag = [85, 80, 70, 50, 30, 10, 5, 8, 25, 50, 75, 88]
      // Threshold = min + (max - min) * 0.5 = 5 + (88 - 5) * 0.5 = 46.5

      // Mock January (index 0, score 85 > 46.5)
      const originalGetMonth = Date.prototype.getMonth
      Date.prototype.getMonth = () => 0 // January

      const result = isInOptimalSeason(winterCrag)
      expect(result).toBe(true)

      Date.prototype.getMonth = originalGetMonth
    })

    test('should return false for winter crag when current month has low score', () => {
      // Winter crag: high scores in Jan/Feb/Nov/Dec, low in summer
      const winterCrag = [85, 80, 70, 50, 30, 10, 5, 8, 25, 50, 75, 88]
      // Threshold = 46.5

      // Mock July (index 6, score 5 < 46.5)
      const originalGetMonth = Date.prototype.getMonth
      Date.prototype.getMonth = () => 6 // July

      const result = isInOptimalSeason(winterCrag)
      expect(result).toBe(false)

      Date.prototype.getMonth = originalGetMonth
    })

    test('should return true for summer crag when current month has high score', () => {
      // Summer crag: high scores in May-Sep, low in winter
      const summerCrag = [20, 25, 40, 60, 85, 95, 98, 95, 80, 55, 35, 22]
      // Threshold = 20 + (98 - 20) * 0.5 = 59

      // Mock July (index 6, score 98 > 59)
      const originalGetMonth = Date.prototype.getMonth
      Date.prototype.getMonth = () => 6 // July

      const result = isInOptimalSeason(summerCrag)
      expect(result).toBe(true)

      Date.prototype.getMonth = originalGetMonth
    })

    test('should return false for summer crag when current month has low score', () => {
      // Summer crag: high scores in May-Sep, low in winter
      const summerCrag = [20, 25, 40, 60, 85, 95, 98, 95, 80, 55, 35, 22]
      // Threshold = 59

      // Mock January (index 0, score 20 < 59)
      const originalGetMonth = Date.prototype.getMonth
      Date.prototype.getMonth = () => 0 // January

      const result = isInOptimalSeason(summerCrag)
      expect(result).toBe(false)

      Date.prototype.getMonth = originalGetMonth
    })

    test('should handle winter crag with all low values correctly', () => {
      // Edge case: winter crag with scores all <= 12
      // High in winter (relative to its own scale), low in summer
      const lowScoreWinterCrag = [10, 8, 6, 4, 2, 1, 1, 1, 2, 4, 7, 10]
      // Threshold = 1 + (10 - 1) * 0.5 = 5.5

      // Mock January (index 0, score 10 > 5.5) - should be IN season
      const originalGetMonth = Date.prototype.getMonth
      Date.prototype.getMonth = () => 0 // January

      const result = isInOptimalSeason(lowScoreWinterCrag)
      expect(result).toBe(true)

      Date.prototype.getMonth = originalGetMonth
    })

    test('should return false for empty array', () => {
      const result = isInOptimalSeason([])
      expect(result).toBe(false)
    })

    test('should return false for undefined', () => {
      const result = isInOptimalSeason(undefined)
      expect(result).toBe(false)
    })

    test('should return false for wrong array length', () => {
      const result = isInOptimalSeason([1, 2, 3, 4, 5]) // Only 5 elements
      expect(result).toBe(false)
    })
  })

  describe('formatSeasonalityRange', () => {
    test('should format winter crag months correctly', () => {
      // Winter crag: good in Oct-Mar
      const winterCrag = [85, 80, 70, 50, 30, 10, 5, 8, 25, 50, 75, 88]
      // Threshold = 46.5
      // Good months: Jan(85), Feb(80), Mar(70), Oct(50), Nov(75), Dec(88)

      const result = formatSeasonalityRange(winterCrag)
      expect(result).toContain('Jan')
      expect(result).toContain('Dec')
    })

    test('should format summer crag months correctly', () => {
      // Summer crag: good in Apr-Oct
      const summerCrag = [20, 25, 40, 60, 85, 95, 98, 95, 80, 55, 35, 22]
      // Threshold = 59
      // Good months: Apr(60), May(85), Jun(95), Jul(98), Aug(95), Sep(80)

      const result = formatSeasonalityRange(summerCrag)
      expect(result).toContain('Apr')
      expect(result).toContain('Sep')
    })

    test('should return Year-round for crag with all similar scores', () => {
      // Uniform scores: all 12 months have same score
      // min=80, max=80, threshold=80
      // All months have score 80 >= 80, so 12 months = Year-round
      const uniformCrag = [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80]

      const result = formatSeasonalityRange(uniformCrag)
      expect(result).toBe('Year-round')
    })

    test('should return null for empty array', () => {
      const result = formatSeasonalityRange([])
      expect(result).toBeNull()
    })

    test('should return null for wrong array length', () => {
      const result = formatSeasonalityRange([1, 2, 3])
      expect(result).toBeNull()
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { WindScore } from '../wind-score.vo'

describe('WindScore Value Object', () => {
  describe('calculate', () => {
    test('should return excellent score (3) for calm wind (0-10 km/h)', () => {
      const score = WindScore.calculate(5)
      expect(score.getScore()).toBe(3)
      expect(score.getLabel()).toBe('excellent')
    })

    test('should return score around 2.5 for 15 km/h wind', () => {
      const score = WindScore.calculate(15)
      expect(score.getScore()).toBeCloseTo(2.5, 1)
      // 2.5 is >= 2.5 threshold so it's 'excellent'
      expect(score.getLabel()).toBe('excellent')
    })

    test('should return score around 2 for 20 km/h wind', () => {
      const score = WindScore.calculate(20)
      expect(score.getScore()).toBeCloseTo(2, 1)
      expect(score.getLabel()).toBe('good')
    })

    test('should return score around 1 for 30 km/h wind', () => {
      const score = WindScore.calculate(30)
      expect(score.getScore()).toBeCloseTo(1, 1)
      expect(score.getLabel()).toBe('moderate')
    })

    test('should return poor score (<0.5) for strong wind (40+ km/h)', () => {
      const score = WindScore.calculate(45)
      expect(score.getScore()).toBeLessThan(0.5)
      expect(score.getLabel()).toBe('poor')
    })

    test('should handle negative wind speed', () => {
      const score = WindScore.calculate(-5)
      expect(score.getScore()).toBe(3)
    })

    test('should never exceed max score of 3', () => {
      const score = WindScore.calculate(0)
      expect(score.getScore()).toBeLessThanOrEqual(3)
    })

    test('should never go below 0', () => {
      const score = WindScore.calculate(100)
      expect(score.getScore()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('isClimbable', () => {
    test('should return true for wind below 30 km/h', () => {
      expect(WindScore.calculate(25).isClimbable()).toBe(true)
    })

    test('should return false for wind at or above 30 km/h', () => {
      expect(WindScore.calculate(30).isClimbable()).toBe(false)
    })
  })

  describe('getWindSpeed', () => {
    test('should return the original wind speed', () => {
      const score = WindScore.calculate(17)
      expect(score.getWindSpeed()).toBe(17)
    })
  })

  describe('equals', () => {
    test('should return true for equal scores', () => {
      const score1 = WindScore.calculate(15)
      const score2 = WindScore.calculate(15)
      expect(score1.equals(score2)).toBe(true)
    })

    test('should return false for different scores', () => {
      const score1 = WindScore.calculate(10)
      const score2 = WindScore.calculate(25)
      expect(score1.equals(score2)).toBe(false)
    })
  })

  describe('toString', () => {
    test('should return formatted string representation', () => {
      const score = WindScore.calculate(15)
      const str = score.toString()
      expect(str).toContain('WindScore')
      expect(str).toContain('15km/h')
    })
  })
})

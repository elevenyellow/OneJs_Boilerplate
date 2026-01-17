import { describe, expect, test } from 'bun:test'
import { TemperatureScore } from '../temperature-score.vo'

describe('TemperatureScore Value Object', () => {
  describe('calculate - base temperature scoring', () => {
    test('should return excellent score (3) for ideal temperature (10-20C)', () => {
      const score = TemperatureScore.calculate(15)
      expect(score.getScore()).toBe(3)
      expect(score.getLabel()).toBe('excellent')
    })

    test('should return score of 3 for 10C (lower ideal bound)', () => {
      const score = TemperatureScore.calculate(10)
      expect(score.getScore()).toBe(3)
    })

    test('should return score of 3 for 20C (upper ideal bound)', () => {
      const score = TemperatureScore.calculate(20)
      expect(score.getScore()).toBe(3)
    })

    test('should reduce score for cold temperature (5-10C)', () => {
      const score = TemperatureScore.calculate(7)
      expect(score.getScore()).toBeLessThan(3)
      expect(score.getScore()).toBeGreaterThan(1)
    })

    test('should reduce score for warm temperature (20-30C)', () => {
      const score = TemperatureScore.calculate(25)
      expect(score.getScore()).toBeLessThan(3)
      expect(score.getScore()).toBeGreaterThan(1)
    })

    test('should return poor score for extreme cold (<5C)', () => {
      const score = TemperatureScore.calculate(0)
      expect(score.getScore()).toBeLessThan(1)
    })

    test('should return reduced score for extreme heat (>30C)', () => {
      const score = TemperatureScore.calculate(35)
      expect(score.getScore()).toBeLessThan(2)
    })
  })

  describe('calculate - with aspect and season', () => {
    test('should boost score for north-facing in summer with hot weather', () => {
      const withAspect = TemperatureScore.calculate(28, 'N', 'summer')
      const withoutAspect = TemperatureScore.calculate(28, null, 'summer')
      expect(withAspect.getScore()).toBeGreaterThan(withoutAspect.getScore())
    })

    test('should boost score for south-facing in winter with cold weather', () => {
      const withAspect = TemperatureScore.calculate(8, 'S', 'winter')
      const withoutAspect = TemperatureScore.calculate(8, null, 'winter')
      expect(withAspect.getScore()).toBeGreaterThan(withoutAspect.getScore())
    })

    test('should reduce score for north-facing in winter (too cold)', () => {
      const withAspect = TemperatureScore.calculate(10, 'N', 'winter')
      const withoutAspect = TemperatureScore.calculate(10, null, 'winter')
      expect(withAspect.getScore()).toBeLessThan(withoutAspect.getScore())
    })

    test('should reduce score for south-facing in summer (too hot)', () => {
      const withAspect = TemperatureScore.calculate(28, 'S', 'summer')
      const withoutAspect = TemperatureScore.calculate(28, null, 'summer')
      expect(withAspect.getScore()).toBeLessThan(withoutAspect.getScore())
    })
  })

  describe('getSeasonFromMonth', () => {
    test('should return winter for December, January, February', () => {
      expect(TemperatureScore.getSeasonFromMonth(12)).toBe('winter')
      expect(TemperatureScore.getSeasonFromMonth(1)).toBe('winter')
      expect(TemperatureScore.getSeasonFromMonth(2)).toBe('winter')
    })

    test('should return spring for March, April, May', () => {
      expect(TemperatureScore.getSeasonFromMonth(3)).toBe('spring')
      expect(TemperatureScore.getSeasonFromMonth(4)).toBe('spring')
      expect(TemperatureScore.getSeasonFromMonth(5)).toBe('spring')
    })

    test('should return summer for June, July, August', () => {
      expect(TemperatureScore.getSeasonFromMonth(6)).toBe('summer')
      expect(TemperatureScore.getSeasonFromMonth(7)).toBe('summer')
      expect(TemperatureScore.getSeasonFromMonth(8)).toBe('summer')
    })

    test('should return autumn for September, October, November', () => {
      expect(TemperatureScore.getSeasonFromMonth(9)).toBe('autumn')
      expect(TemperatureScore.getSeasonFromMonth(10)).toBe('autumn')
      expect(TemperatureScore.getSeasonFromMonth(11)).toBe('autumn')
    })
  })

  describe('isIdealRange', () => {
    test('should return true for temperatures in 10-20C range', () => {
      expect(TemperatureScore.calculate(15).isIdealRange()).toBe(true)
    })

    test('should return false for temperatures outside 10-20C range', () => {
      expect(TemperatureScore.calculate(8).isIdealRange()).toBe(false)
      expect(TemperatureScore.calculate(25).isIdealRange()).toBe(false)
    })
  })

  describe('isExtremeCondition', () => {
    test('should return true for temperatures <= 5C', () => {
      expect(TemperatureScore.calculate(5).isExtremeCondition()).toBe(true)
      expect(TemperatureScore.calculate(0).isExtremeCondition()).toBe(true)
    })

    test('should return true for temperatures >= 30C', () => {
      expect(TemperatureScore.calculate(30).isExtremeCondition()).toBe(true)
      expect(TemperatureScore.calculate(35).isExtremeCondition()).toBe(true)
    })

    test('should return false for moderate temperatures', () => {
      expect(TemperatureScore.calculate(15).isExtremeCondition()).toBe(false)
    })
  })

  describe('getters', () => {
    test('should return correct temperature', () => {
      const score = TemperatureScore.calculate(18, 'NE', 'spring')
      expect(score.getTemperature()).toBe(18)
    })

    test('should return correct aspect', () => {
      const score = TemperatureScore.calculate(18, 'NE', 'spring')
      expect(score.getAspect()).toBe('NE')
    })

    test('should return null aspect when not provided', () => {
      const score = TemperatureScore.calculate(18)
      expect(score.getAspect()).toBeNull()
    })

    test('should return correct season', () => {
      const score = TemperatureScore.calculate(18, 'NE', 'spring')
      expect(score.getSeason()).toBe('spring')
    })
  })

  describe('equals', () => {
    test('should return true for equal scores', () => {
      const score1 = TemperatureScore.calculate(15, 'N', 'summer')
      const score2 = TemperatureScore.calculate(15, 'N', 'summer')
      expect(score1.equals(score2)).toBe(true)
    })

    test('should return false for different scores', () => {
      const score1 = TemperatureScore.calculate(15, 'N', 'summer')
      const score2 = TemperatureScore.calculate(25, 'S', 'winter')
      expect(score1.equals(score2)).toBe(false)
    })
  })
})

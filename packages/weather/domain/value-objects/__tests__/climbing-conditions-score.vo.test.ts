import { describe, expect, test } from 'bun:test'
import { ClimbingConditionsScore } from '../climbing-conditions-score.vo'

describe('ClimbingConditionsScore Value Object', () => {
  describe('calculate', () => {
    test('should return excellent score for perfect conditions', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 0,
        precipitationAmountMm: 0,
        humidityPercent: 50,
      })

      expect(score.getOverallScore()).toBeGreaterThanOrEqual(2.5)
      expect(score.getLabel()).toBe('excellent')
      expect(score.isClimbable()).toBe(true)
    })

    test('should return poor score for bad conditions', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 40, // More extreme heat
        windSpeedKmh: 50, // Very strong wind
        precipitationProbabilityPercent: 90,
        precipitationAmountMm: 15,
        humidityPercent: 95,
      })

      expect(score.getOverallScore()).toBeLessThan(1.5)
      expect(score.getLabel()).toBe('poor')
      expect(score.isClimbable()).toBe(false)
    })

    test('should consider aspect in temperature scoring', () => {
      const scoreWithAspect = ClimbingConditionsScore.calculate({
        temperatureCelsius: 28,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
        aspect: 'N',
        season: 'summer',
      })

      const scoreWithoutAspect = ClimbingConditionsScore.calculate({
        temperatureCelsius: 28,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
        season: 'summer',
      })

      // North-facing in summer with hot weather should score better
      expect(scoreWithAspect.getTemperatureScore().getScore()).toBeGreaterThan(
        scoreWithoutAspect.getTemperatureScore().getScore(),
      )
    })

    test('should throw error if weights do not sum to 1.0', () => {
      expect(() => {
        ClimbingConditionsScore.calculate(
          {
            temperatureCelsius: 15,
            windSpeedKmh: 5,
            precipitationProbabilityPercent: 0,
            humidityPercent: 50,
          },
          {
            temperature: 0.5,
            wind: 0.5,
            precipitation: 0.5, // Total = 1.65 > 1.0
            humidity: 0.15,
          },
        )
      }).toThrow()
    })
  })

  describe('individual score getters', () => {
    test('should return individual score objects', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 10,
        precipitationProbabilityPercent: 10,
        humidityPercent: 50,
      })

      expect(score.getTemperatureScore().getTemperature()).toBe(15)
      expect(score.getWindScore().getWindSpeed()).toBe(10)
      expect(score.getPrecipitationScore().getProbability()).toBe(10)
      expect(score.getHumidityScore().getHumidity()).toBe(50)
    })
  })

  describe('isClimbable', () => {
    test('should return true when all factors are within safe limits', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 15,
        precipitationProbabilityPercent: 20,
        humidityPercent: 60,
      })

      expect(score.isClimbable()).toBe(true)
    })

    test('should return false when wind is too strong', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 35, // Above 30 km/h threshold
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
      })

      expect(score.isClimbable()).toBe(false)
    })

    test('should return false when precipitation is too high', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 70,
        precipitationAmountMm: 10,
        humidityPercent: 50,
      })

      expect(score.isClimbable()).toBe(false)
    })

    test('should return false when temperature is extreme', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 40,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
      })

      expect(score.isClimbable()).toBe(false)
    })
  })

  describe('getRecommendation', () => {
    test('should return positive recommendation for excellent conditions', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
      })

      expect(score.getRecommendation()).toContain('Perfect')
    })

    test('should include reason when conditions are not climbable', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 45,
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
      })

      expect(score.getRecommendation()).toContain('Not recommended')
      expect(score.getRecommendation()).toContain('wind')
    })
  })

  describe('getLimitingFactor', () => {
    test('should return null when all scores are good', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
      })

      expect(score.getLimitingFactor()).toBeNull()
    })

    test('should return wind when it is the limiting factor', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 35, // Strong wind - score will be below 1.5
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
      })

      expect(score.getLimitingFactor()).toBe('wind')
    })

    test('should return precipitation when it is the limiting factor', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 60,
        precipitationAmountMm: 5,
        humidityPercent: 50,
      })

      expect(score.getLimitingFactor()).toBe('precipitation')
    })
  })

  describe('toPrimitives', () => {
    test('should serialize to primitive values', () => {
      const score = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 5,
        precipitationProbabilityPercent: 0,
        humidityPercent: 50,
      })

      const primitives = score.toPrimitives()

      expect(primitives).toHaveProperty('overallScore')
      expect(primitives).toHaveProperty('temperatureScore')
      expect(primitives).toHaveProperty('windScore')
      expect(primitives).toHaveProperty('precipitationScore')
      expect(primitives).toHaveProperty('humidityScore')
      expect(primitives).toHaveProperty('label')
      expect(primitives).toHaveProperty('recommendation')
      expect(primitives).toHaveProperty('isClimbable')
    })
  })

  describe('equals', () => {
    test('should return true for equal scores', () => {
      const score1 = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 10,
        precipitationProbabilityPercent: 5,
        humidityPercent: 50,
      })

      const score2 = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 10,
        precipitationProbabilityPercent: 5,
        humidityPercent: 50,
      })

      expect(score1.equals(score2)).toBe(true)
    })

    test('should return false for different scores', () => {
      const score1 = ClimbingConditionsScore.calculate({
        temperatureCelsius: 15,
        windSpeedKmh: 10,
        precipitationProbabilityPercent: 5,
        humidityPercent: 50,
      })

      const score2 = ClimbingConditionsScore.calculate({
        temperatureCelsius: 25,
        windSpeedKmh: 20,
        precipitationProbabilityPercent: 30,
        humidityPercent: 70,
      })

      expect(score1.equals(score2)).toBe(false)
    })
  })
})

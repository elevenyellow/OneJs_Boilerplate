import { describe, expect, test } from 'bun:test'
import type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  WeatherData,
} from '../../entities/weather-response.entity'
import { BestClimbingWindowInput } from '../../value-objects/best-climbing-window.vo'
import { ClimbingConditionsScoringService } from '../climbing-conditions-scoring.service'

describe('ClimbingConditionsScoringService', () => {
  const service = new ClimbingConditionsScoringService()

  const createMockCurrentWeather = (
    overrides: Partial<CurrentWeather> = {},
  ): CurrentWeather => ({
    timestamp: new Date(),
    temperature: 15,
    windSpeed: 10,
    weatherCode: 1,
    isDaylight: true,
    humidity: 50,
    ...overrides,
  })

  const createMockDailyForecast = (
    overrides: Partial<DailyForecast> = {},
  ): DailyForecast => ({
    date: new Date().toISOString(),
    temperature: { min: 10, max: 20, mean: 15 },
    feelsLike: { min: 10, max: 20, mean: 15 },
    wind: { min: 5, max: 15, mean: 10, direction: 'N' },
    precipitation: { amount: 0, probability: 10 },
    humidity: { min: 40, max: 60, mean: 50 },
    weatherCode: 1,
    uvIndex: 5,
    sunrise: '07:00',
    sunset: '19:00',
    sunshineMinutes: 480,
    predictability: 80,
    ...overrides,
  })

  const createMockHourlyForecast = (
    temperature: number,
    windSpeed: number,
    precipitation: number,
    humidity: number,
    hour: number,
  ): HourlyForecast => ({
    timestamp: new Date(Date.now() + hour * 60 * 60 * 1000).toISOString(),
    temperature,
    feelsLike: temperature,
    windSpeed,
    windDirection: 'N',
    windGust: windSpeed + 5,
    precipitation,
    humidity,
    weatherCode: precipitation > 0 ? 3 : 1,
    uvIndex: 5,
    isDaylight: true,
  })

  const createMockWeatherData = (
    overrides: Partial<WeatherData> = {},
  ): WeatherData => ({
    metadata: {
      location: 'Test Location',
      coordinates: { lat: 40, lon: -3 },
      timezone: 'UTC',
      lastUpdate: new Date(),
      generationTimeMs: 100,
    },
    current: createMockCurrentWeather(),
    hourly: [
      createMockHourlyForecast(15, 5, 0, 50, 0),
      createMockHourlyForecast(16, 8, 0, 48, 1),
      createMockHourlyForecast(17, 10, 0, 45, 2),
      createMockHourlyForecast(18, 12, 0, 50, 3),
      createMockHourlyForecast(17, 15, 0, 55, 4),
    ],
    daily: [createMockDailyForecast()],
    ...overrides,
  })

  describe('calculateCurrentConditions', () => {
    test('should return high score for ideal conditions', () => {
      const current = createMockCurrentWeather({
        temperature: 15,
        windSpeed: 5,
        humidity: 50,
      })
      const daily = createMockDailyForecast({
        precipitation: { amount: 0, probability: 5 },
      })

      const score = service.calculateCurrentConditions(current, daily)

      expect(score.getOverallScore()).toBeGreaterThanOrEqual(2.5)
      expect(score.isClimbable()).toBe(true)
    })

    test('should consider aspect in scoring', () => {
      const current = createMockCurrentWeather({ temperature: 28 })
      const daily = createMockDailyForecast()

      const scoreNorth = service.calculateCurrentConditions(
        current,
        daily,
        'N',
        'summer',
      )
      const scoreSouth = service.calculateCurrentConditions(
        current,
        daily,
        'S',
        'summer',
      )

      // North-facing should score better in hot summer
      expect(scoreNorth.getTemperatureScore().getScore()).toBeGreaterThan(
        scoreSouth.getTemperatureScore().getScore(),
      )
    })

    test('should return low score for bad conditions', () => {
      const current = createMockCurrentWeather({
        temperature: 35,
        windSpeed: 40,
        humidity: 90,
      })
      const daily = createMockDailyForecast({
        precipitation: { amount: 10, probability: 80 },
      })

      const score = service.calculateCurrentConditions(current, daily)

      expect(score.getOverallScore()).toBeLessThan(1.5)
      expect(score.isClimbable()).toBe(false)
    })
  })

  describe('calculateHourlyConditions', () => {
    test('should calculate conditions for each hour', () => {
      const hourly = [
        createMockHourlyForecast(15, 5, 0, 50, 0),
        createMockHourlyForecast(18, 10, 0, 55, 1),
        createMockHourlyForecast(20, 15, 0, 60, 2),
      ]

      const conditions = service.calculateHourlyConditions(hourly)

      expect(conditions).toHaveLength(3)
      expect(conditions[0].getTime()).toBeDefined()
      expect(conditions[0].getTemperature()).toBeDefined()
      expect(conditions[0].getConditionScore()).toBeDefined()
      expect(conditions[0].getLabel()).toBeDefined()
    })

    test('should apply aspect to hourly calculations', () => {
      const hourly = [createMockHourlyForecast(28, 5, 0, 50, 0)]

      const conditionsNorth = service.calculateHourlyConditions(
        hourly,
        'N',
        'summer',
      )
      const conditionsNoAspect = service.calculateHourlyConditions(hourly)

      // North-facing in hot summer should score better
      expect(conditionsNorth[0].getConditionScore()).toBeGreaterThan(
        conditionsNoAspect[0].getConditionScore(),
      )
    })
  })

  describe('findBestClimbingWindow', () => {
    test('should find best window in good conditions', () => {
      const hourly = [
        createMockHourlyForecast(15, 5, 0, 50, 0), // Good
        createMockHourlyForecast(16, 8, 0, 48, 1), // Good
        createMockHourlyForecast(17, 10, 0, 45, 2), // Good
        createMockHourlyForecast(18, 12, 0, 50, 3), // Good
        createMockHourlyForecast(17, 15, 0, 55, 4), // Good
      ]

      const input = BestClimbingWindowInput.create({
        hourlyForecast: hourly,
        minHours: 2,
      })
      const window = service.findBestClimbingWindow(input)

      expect(window).not.toBeNull()
      expect(window?.getHours()).toBeGreaterThanOrEqual(2)
      expect(window?.getAverageScore()).toBeGreaterThan(0)
    })

    test('should return null when no window is long enough', () => {
      const hourly = [
        createMockHourlyForecast(15, 5, 0, 50, 0), // Good
        createMockHourlyForecast(35, 50, 10, 90, 1), // Bad (breaks window)
      ]

      const input = BestClimbingWindowInput.create({
        hourlyForecast: hourly,
        minHours: 2,
      })
      const window = service.findBestClimbingWindow(input)

      expect(window).toBeNull()
    })

    test('should return null for insufficient forecast data', () => {
      const input = BestClimbingWindowInput.create({
        hourlyForecast: [],
        minHours: 2,
      })
      const window = service.findBestClimbingWindow(input)

      expect(window).toBeNull()
    })
  })

  describe('calculateFromWeatherData', () => {
    test('should return complete conditions result', () => {
      const weatherData = createMockWeatherData()

      const result = service.calculateFromWeatherData(weatherData)

      expect(result.getConditions()).toBeDefined()
      expect(result.getHourlyConditions()).toBeDefined()
      expect(result.getHourlyConditions().length).toBeGreaterThan(0)
    })

    test('should apply aspect and season throughout', () => {
      const weatherData = createMockWeatherData({
        current: createMockCurrentWeather({ temperature: 28 }),
      })

      const resultNorth = service.calculateFromWeatherData(
        weatherData,
        'N',
        'summer',
      )
      const resultSouth = service.calculateFromWeatherData(
        weatherData,
        'S',
        'summer',
      )

      // North-facing should score better in hot summer
      expect(resultNorth.getConditions().getOverallScore()).toBeGreaterThan(
        resultSouth.getConditions().getOverallScore(),
      )
    })
  })

  describe('getAspectRecommendation', () => {
    test('should recommend north-facing for hot summer', () => {
      const current = createMockCurrentWeather({ temperature: 30 })
      const daily = createMockDailyForecast()

      const conditions = service.calculateCurrentConditions(
        current,
        daily,
        'N',
        'summer',
      )
      const recommendation = service.getAspectRecommendation(conditions, 'N')

      expect(recommendation.isOptimalForCurrentConditions).toBe(true)
      expect(recommendation.reason).toContain('shade')
    })

    test('should recommend south-facing for cold winter', () => {
      const current = createMockCurrentWeather({ temperature: 8 })
      const daily = createMockDailyForecast()

      const conditions = service.calculateCurrentConditions(
        current,
        daily,
        'S',
        'winter',
      )
      const recommendation = service.getAspectRecommendation(conditions, 'S')

      expect(recommendation.isOptimalForCurrentConditions).toBe(true)
      expect(recommendation.reason).toContain('sun')
    })

    test('should not recommend north-facing for cold winter', () => {
      const current = createMockCurrentWeather({ temperature: 5 })
      const daily = createMockDailyForecast()

      const conditions = service.calculateCurrentConditions(
        current,
        daily,
        'N',
        'winter',
      )
      const recommendation = service.getAspectRecommendation(conditions, 'N')

      expect(recommendation.isOptimalForCurrentConditions).toBe(false)
    })
  })

  describe('calculateFromDailyForecast', () => {
    test('should calculate conditions from daily forecast', () => {
      const daily = createMockDailyForecast({
        temperature: { min: 12, max: 22, mean: 17 },
        wind: { min: 5, max: 15, mean: 10, direction: 'N' },
        precipitation: { amount: 0, probability: 10 },
        humidity: { min: 40, max: 60, mean: 50 },
      })

      const score = service.calculateFromDailyForecast(daily)

      expect(score.getOverallScore()).toBeGreaterThan(2)
      expect(score.isClimbable()).toBe(true)
    })
  })
})

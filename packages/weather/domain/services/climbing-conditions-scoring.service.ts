import { Injectable } from '@OneJs/core'
import type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  WeatherData,
} from '../entities/weather-response.entity'
import {
  BestClimbingWindow,
  BestClimbingWindowInput,
} from '../value-objects/best-climbing-window.vo'
import {
  ClimbingConditionsScore,
  type ClimbingConditionsInput,
  type ClimbingConditionsWeights,
} from '../value-objects/climbing-conditions-score.vo'
import { HourlyConditionScore } from '../value-objects/hourly-condition-score.vo'
import { ScoringResult } from '../value-objects/scoring-result.vo'
import type {
  AspectDirection,
  Season,
} from '../value-objects/temperature-score.vo'

@Injectable()
export class ClimbingConditionsScoringService {
  private readonly weights: ClimbingConditionsWeights

  constructor(weights?: ClimbingConditionsWeights) {
    this.weights = weights ?? {
      temperature: 0.3,
      wind: 0.25,
      precipitation: 0.3,
      humidity: 0.15,
    }
  }

  /**
   * Calculate full climbing conditions from weather data
   */
  calculateFromWeatherData(
    weatherData: WeatherData,
    aspect?: AspectDirection | null,
    season?: Season,
  ): ScoringResult {
    // Calculate current conditions
    const currentConditions = this.calculateCurrentConditions(
      weatherData.current,
      weatherData.daily[0] ?? null,
      aspect,
      season,
    )

    // Calculate hourly conditions for the forecast
    const hourlyConditions = this.calculateHourlyConditions(
      weatherData.hourly,
      aspect,
      season,
    )

    // Find best climbing window
    const bestWindowInput = BestClimbingWindowInput.create({
      hourlyForecast: weatherData.hourly,
      aspect,
      season,
      minHours: 2,
    })
    const bestWindow = this.findBestClimbingWindow(bestWindowInput)

    return ScoringResult.create({
      conditions: currentConditions,
      hourlyConditions,
      bestClimbingWindow: bestWindow,
    })
  }

  /**
   * Calculate conditions from current weather
   */
  calculateCurrentConditions(
    current: CurrentWeather,
    dailyForecast: DailyForecast | null,
    aspect?: AspectDirection | null,
    season?: Season,
  ): ClimbingConditionsScore {
    // Use precipitation from daily if available, otherwise assume 0
    const precipitationProbability =
      dailyForecast?.precipitation?.probability ?? 0

    const input: ClimbingConditionsInput = {
      temperatureCelsius: current.temperature,
      windSpeedKmh: current.windSpeed,
      precipitationProbabilityPercent: precipitationProbability,
      precipitationAmountMm: dailyForecast?.precipitation?.amount ?? 0,
      humidityPercent: current.humidity ?? 60,
      aspect: aspect ?? null,
      season,
    }

    return ClimbingConditionsScore.calculate(input, this.weights)
  }

  /**
   * Calculate conditions for each hour in the forecast
   */
  calculateHourlyConditions(
    hourlyForecast: HourlyForecast[],
    aspect?: AspectDirection | null,
    season?: Season,
  ): HourlyConditionScore[] {
    return hourlyForecast.map((hour) => {
      const score = this.calculateFromHourlyForecast(hour, aspect, season)

      return HourlyConditionScore.create({
        time: hour.timestamp,
        temperature: hour.temperature,
        windSpeed: hour.windSpeed,
        precipitationProbability: 0, // Hourly data may not have probability
        humidity: hour.humidity,
        conditionScore: score.getOverallScore(),
        label: score.getLabel(),
      })
    })
  }

  /**
   * Calculate conditions from hourly forecast
   */
  calculateFromHourlyForecast(
    hour: HourlyForecast,
    aspect?: AspectDirection | null,
    season?: Season,
  ): ClimbingConditionsScore {
    const input: ClimbingConditionsInput = {
      temperatureCelsius: hour.temperature,
      windSpeedKmh: hour.windSpeed,
      precipitationProbabilityPercent:
        hour.precipitation > 0 ? Math.min(100, hour.precipitation * 10) : 0,
      precipitationAmountMm: hour.precipitation,
      humidityPercent: hour.humidity,
      aspect: aspect ?? null,
      season,
    }

    return ClimbingConditionsScore.calculate(input, this.weights)
  }

  /**
   * Calculate conditions from daily forecast
   */
  calculateFromDailyForecast(
    day: DailyForecast,
    aspect?: AspectDirection | null,
    season?: Season,
  ): ClimbingConditionsScore {
    const input: ClimbingConditionsInput = {
      temperatureCelsius: day.temperature.mean,
      windSpeedKmh: day.wind.mean,
      precipitationProbabilityPercent: day.precipitation.probability,
      precipitationAmountMm: day.precipitation.amount,
      humidityPercent: day.humidity.mean,
      aspect: aspect ?? null,
      season,
    }

    return ClimbingConditionsScore.calculate(input, this.weights)
  }

  /**
   * Find the best window for climbing in the forecast
   */
  findBestClimbingWindow(
    input: BestClimbingWindowInput,
  ): BestClimbingWindow | null {
    const hourlyForecast = input.getHourlyForecast()
    const aspect = input.getAspect()
    const season = input.getSeason()
    const minHours = input.getMinHours()

    if (!input.hasEnoughData()) {
      return null
    }

    // Calculate scores for each hour
    const hourlyScores = hourlyForecast.map((hour) => ({
      time: hour.timestamp,
      score: this.calculateFromHourlyForecast(hour, aspect, season),
    }))

    // Find consecutive windows and calculate average scores
    let bestWindow: BestClimbingWindow | null = null
    let bestScore = 0

    for (let start = 0; start <= hourlyScores.length - minHours; start++) {
      // Find how long the good conditions last
      let end = start
      while (
        end < hourlyScores.length &&
        hourlyScores[end].score.isClimbable()
      ) {
        end++
      }

      const windowLength = end - start

      if (windowLength >= minHours) {
        // Calculate average score for this window
        let totalScore = 0
        for (let i = start; i < end; i++) {
          totalScore += hourlyScores[i].score.getOverallScore()
        }
        const avgScore = totalScore / windowLength

        if (avgScore > bestScore) {
          bestScore = avgScore
          bestWindow = BestClimbingWindow.create({
            startTime: hourlyScores[start].time,
            endTime: hourlyScores[end - 1].time,
            averageScore: avgScore,
            hours: windowLength,
          })
        }
      }
    }

    return bestWindow
  }

  /**
   * Get aspect-aware recommendation text
   */
  getAspectRecommendation(
    conditions: ClimbingConditionsScore,
    aspect: AspectDirection,
  ): {
    aspect: string
    isOptimalForCurrentConditions: boolean
    reason: string
  } {
    const tempScore = conditions.getTemperatureScore()
    const temperature = tempScore.getTemperature()
    const season = tempScore.getSeason()

    let isOptimal = false
    let reason: string

    // Determine if aspect is good for current conditions
    if (['N', 'NE', 'NW'].includes(aspect)) {
      if (season === 'summer' && temperature > 25) {
        isOptimal = true
        reason = 'North-facing provides shade in hot weather - good choice!'
      } else if (season === 'winter' && temperature < 10) {
        isOptimal = false
        reason =
          'North-facing lacks sun warmth in cold weather - consider south-facing sectors'
      } else {
        isOptimal = temperature > 20
        reason =
          temperature > 20
            ? 'Shade will be appreciated in warm conditions'
            : 'May feel cold without direct sun'
      }
    } else if (['S', 'SE', 'SW'].includes(aspect)) {
      if (season === 'winter' && temperature < 15) {
        isOptimal = true
        reason = 'South-facing gets warming sun - ideal for cold days!'
      } else if (season === 'summer' && temperature > 25) {
        isOptimal = false
        reason = 'South-facing will be very hot - consider north-facing sectors'
      } else {
        isOptimal = temperature < 18
        reason =
          temperature < 18
            ? 'Sun exposure will help warm up the rock'
            : 'May get warm with direct sun'
      }
    } else if (aspect === 'E') {
      isOptimal = temperature > 20
      reason =
        temperature > 20
          ? 'East-facing offers morning shade, good for hot afternoons'
          : 'Morning sun will help warm up, then shaded in afternoon'
    } else {
      // W
      isOptimal = temperature < 15
      reason =
        temperature < 15
          ? 'West-facing afternoon sun will provide late warmth'
          : 'Will get afternoon sun - plan accordingly'
    }

    return {
      aspect,
      isOptimalForCurrentConditions: isOptimal,
      reason,
    }
  }
}

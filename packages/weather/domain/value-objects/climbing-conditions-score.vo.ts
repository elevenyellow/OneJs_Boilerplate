import { HumidityScore } from './humidity-score.vo'
import { PrecipitationScore } from './precipitation-score.vo'
import { type ScoreLabel, scoreToLabel } from './score-label'
import {
  type AspectDirection,
  type Season,
  TemperatureScore,
} from './temperature-score.vo'
import { WindScore } from './wind-score.vo'

/**
 * Weights for each condition factor in the overall score.
 * Must sum to 1.0
 */
export interface ClimbingConditionsWeights {
  temperature: number
  wind: number
  precipitation: number
  humidity: number
}

const DEFAULT_WEIGHTS: ClimbingConditionsWeights = {
  temperature: 0.3, // 30% - Temperature is crucial
  wind: 0.25, // 25% - Wind can make climbing dangerous
  precipitation: 0.3, // 30% - Rain makes rock dangerous
  humidity: 0.15, // 15% - Affects grip
}

/**
 * Input data for calculating climbing conditions
 */
export interface ClimbingConditionsInput {
  temperatureCelsius: number
  windSpeedKmh: number
  precipitationProbabilityPercent: number
  precipitationAmountMm?: number
  humidityPercent: number
  aspect?: AspectDirection | null
  season?: Season
}

/**
 * Serialized climbing conditions score
 */
export interface ClimbingConditionsScorePrimitives {
  overallScore: number
  temperatureScore: number
  windScore: number
  precipitationScore: number
  humidityScore: number
  label: 'excellent' | 'good' | 'moderate' | 'poor'
  recommendation: string
  isClimbable: boolean
}

/**
 * Value Object representing overall climbing conditions score.
 * Combines temperature, wind, precipitation, and humidity scores
 * into a weighted overall score on a 0-3 scale.
 */
export class ClimbingConditionsScore {
  private static readonly MAX_SCORE = 3

  private readonly temperatureScore: TemperatureScore
  private readonly windScore: WindScore
  private readonly precipitationScore: PrecipitationScore
  private readonly humidityScore: HumidityScore
  private readonly overallScore: number
  private readonly weights: ClimbingConditionsWeights

  private constructor(
    temperatureScore: TemperatureScore,
    windScore: WindScore,
    precipitationScore: PrecipitationScore,
    humidityScore: HumidityScore,
    overallScore: number,
    weights: ClimbingConditionsWeights,
  ) {
    this.temperatureScore = temperatureScore
    this.windScore = windScore
    this.precipitationScore = precipitationScore
    this.humidityScore = humidityScore
    this.overallScore = overallScore
    this.weights = weights
  }

  /**
   * Calculate climbing conditions score from weather data
   */
  static calculate(
    input: ClimbingConditionsInput,
    weights: ClimbingConditionsWeights = DEFAULT_WEIGHTS,
  ): ClimbingConditionsScore {
    // Validate weights sum to 1.0
    const weightSum = Object.values(weights).reduce((a, b) => a + b, 0)
    if (Math.abs(weightSum - 1.0) > 0.001) {
      throw new Error(`Weights must sum to 1.0, got ${weightSum}`)
    }

    // Calculate individual scores
    const tempScore = TemperatureScore.calculate(
      input.temperatureCelsius,
      input.aspect,
      input.season,
    )
    const windScoreValue = WindScore.calculate(input.windSpeedKmh)
    const precipScore = PrecipitationScore.calculate(
      input.precipitationProbabilityPercent,
      input.precipitationAmountMm ?? 0,
    )
    const humidScore = HumidityScore.calculate(input.humidityPercent)

    // Calculate weighted overall score
    const overall =
      tempScore.getScore() * weights.temperature +
      windScoreValue.getScore() * weights.wind +
      precipScore.getScore() * weights.precipitation +
      humidScore.getScore() * weights.humidity

    return new ClimbingConditionsScore(
      tempScore,
      windScoreValue,
      precipScore,
      humidScore,
      Math.min(ClimbingConditionsScore.MAX_SCORE, overall),
      weights,
    )
  }

  getOverallScore(): number {
    return this.overallScore
  }

  getTemperatureScore(): TemperatureScore {
    return this.temperatureScore
  }

  getWindScore(): WindScore {
    return this.windScore
  }

  getPrecipitationScore(): PrecipitationScore {
    return this.precipitationScore
  }

  getHumidityScore(): HumidityScore {
    return this.humidityScore
  }

  getWeights(): ClimbingConditionsWeights {
    return this.weights
  }

  getLabel(): ScoreLabel {
    return scoreToLabel(this.overallScore)
  }

  /**
   * Get human-readable recommendation based on conditions
   */
  getRecommendation(): string {
    const label = this.getLabel()

    if (!this.isClimbable()) {
      const reasons: string[] = []
      if (!this.windScore.isClimbable()) reasons.push('strong wind')
      if (!this.precipitationScore.isClimbable()) reasons.push('rain expected')
      if (this.temperatureScore.isExtremeCondition())
        reasons.push('extreme temperature')
      return `Not recommended for climbing: ${reasons.join(', ')}`
    }

    switch (label) {
      case 'excellent':
        return 'Perfect conditions for climbing!'
      case 'good':
        return 'Good conditions, enjoy your session.'
      case 'moderate':
        return 'Acceptable conditions, but not ideal.'
      case 'poor':
        return 'Challenging conditions, proceed with caution.'
    }
  }

  /**
   * Whether conditions are safe/reasonable for climbing
   */
  isClimbable(): boolean {
    return (
      this.windScore.isClimbable() &&
      this.precipitationScore.isClimbable() &&
      !this.temperatureScore.isExtremeCondition()
    )
  }

  /**
   * Get the factor that most limits the overall score
   */
  getLimitingFactor():
    | 'temperature'
    | 'wind'
    | 'precipitation'
    | 'humidity'
    | null {
    const scores = [
      {
        factor: 'temperature' as const,
        score: this.temperatureScore.getScore(),
      },
      { factor: 'wind' as const, score: this.windScore.getScore() },
      {
        factor: 'precipitation' as const,
        score: this.precipitationScore.getScore(),
      },
      { factor: 'humidity' as const, score: this.humidityScore.getScore() },
    ]

    const lowest = scores.reduce((min, curr) =>
      curr.score < min.score ? curr : min,
    )

    // Only return limiting factor if it's significantly lower than others
    if (lowest.score < 1.5) {
      return lowest.factor
    }

    return null
  }

  toPrimitives(): ClimbingConditionsScorePrimitives {
    return {
      overallScore: this.overallScore,
      temperatureScore: this.temperatureScore.getScore(),
      windScore: this.windScore.getScore(),
      precipitationScore: this.precipitationScore.getScore(),
      humidityScore: this.humidityScore.getScore(),
      label: this.getLabel(),
      recommendation: this.getRecommendation(),
      isClimbable: this.isClimbable(),
    }
  }

  equals(other: ClimbingConditionsScore): boolean {
    return (
      this.overallScore === other.overallScore &&
      this.temperatureScore.equals(other.temperatureScore) &&
      this.windScore.equals(other.windScore) &&
      this.precipitationScore.equals(other.precipitationScore) &&
      this.humidityScore.equals(other.humidityScore)
    )
  }

  toString(): string {
    return `ClimbingConditionsScore(overall=${this.overallScore.toFixed(2)}, label=${this.getLabel()}, climbable=${this.isClimbable()})`
  }
}

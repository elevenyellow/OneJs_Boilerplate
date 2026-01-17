import { type ScoreLabel, scoreToLabel } from './score-label'

/**
 * Value Object representing a temperature score for climbing conditions.
 * Score is on a 0-3 scale (like route quality stars).
 *
 * Temperature scoring considers:
 * - Aspect (orientation) of the climbing area
 * - Current season (determines if hot/cold is preferred)
 * - Ideal climbing temperature range: 10-20C
 * - Extreme temperatures receive penalties
 *
 * Aspect-aware logic:
 * - North-facing (N, NE, NW): Better in summer (shade/cool)
 * - South-facing (S, SE, SW): Better in winter (sun/warmth)
 * - East-facing (E): Good for morning climbing
 * - West-facing (W): Good for afternoon climbing
 */
export type AspectDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export class TemperatureScore {
  private static readonly MAX_SCORE = 3
  private static readonly IDEAL_MIN = 10
  private static readonly IDEAL_MAX = 20
  private static readonly EXTREME_COLD = 5
  private static readonly EXTREME_HOT = 30

  private readonly score: number
  private readonly temperatureCelsius: number
  private readonly aspect: AspectDirection | null
  private readonly season: Season

  private constructor(
    score: number,
    temperatureCelsius: number,
    aspect: AspectDirection | null,
    season: Season,
  ) {
    this.score = score
    this.temperatureCelsius = temperatureCelsius
    this.aspect = aspect
    this.season = season
  }

  /**
   * Determine season from month number (1-12)
   */
  static getSeasonFromMonth(month: number): Season {
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  }

  /**
   * Calculate temperature score with optional aspect consideration
   * @param temperatureCelsius - Current temperature in Celsius
   * @param aspect - Optional sector aspect/orientation
   * @param season - Current season (defaults to current month)
   */
  static calculate(
    temperatureCelsius: number,
    aspect?: AspectDirection | null,
    season?: Season,
  ): TemperatureScore {
    const currentSeason =
      season ?? TemperatureScore.getSeasonFromMonth(new Date().getMonth() + 1)
    const sectorAspect = aspect ?? null

    // Base temperature score
    let baseScore = TemperatureScore.calculateBaseScore(temperatureCelsius)

    // Apply aspect-based adjustments
    if (sectorAspect) {
      baseScore = TemperatureScore.applyAspectAdjustment(
        baseScore,
        temperatureCelsius,
        sectorAspect,
        currentSeason,
      )
    }

    return new TemperatureScore(
      Math.max(0, Math.min(TemperatureScore.MAX_SCORE, baseScore)),
      temperatureCelsius,
      sectorAspect,
      currentSeason,
    )
  }

  private static calculateBaseScore(temperature: number): number {
    // Ideal range: 10-20C = score 3
    if (
      temperature >= TemperatureScore.IDEAL_MIN &&
      temperature <= TemperatureScore.IDEAL_MAX
    ) {
      return TemperatureScore.MAX_SCORE
    }

    // Too cold
    if (temperature < TemperatureScore.IDEAL_MIN) {
      if (temperature <= TemperatureScore.EXTREME_COLD) {
        // Extreme cold: linear decay from 1 to 0
        const ratio = Math.max(0, (temperature + 5) / 10)
        return ratio
      }
      // Cold but not extreme: 2-3
      const ratio =
        (temperature - TemperatureScore.EXTREME_COLD) /
        (TemperatureScore.IDEAL_MIN - TemperatureScore.EXTREME_COLD)
      return 1 + ratio * 2
    }

    // Too hot
    if (temperature <= TemperatureScore.EXTREME_HOT) {
      // Warm but not extreme: 2-3
      const ratio =
        (temperature - TemperatureScore.IDEAL_MAX) /
        (TemperatureScore.EXTREME_HOT - TemperatureScore.IDEAL_MAX)
      return TemperatureScore.MAX_SCORE - ratio
    }

    // Extreme heat: linear decay from 2 to 0
    const ratio = Math.min(1, (temperature - TemperatureScore.EXTREME_HOT) / 10)
    return 2 * (1 - ratio)
  }

  private static applyAspectAdjustment(
    baseScore: number,
    temperature: number,
    aspect: AspectDirection,
    season: Season,
  ): number {
    let adjustment = 0

    // North-facing: better in summer (shade), worse in winter (cold)
    if (['N', 'NE', 'NW'].includes(aspect)) {
      if (season === 'summer' && temperature > 25) {
        adjustment = 0.5 // Shade benefit in hot weather
      } else if (season === 'winter' && temperature < 15) {
        adjustment = -0.3 // Too cold without sun
      }
    }

    // South-facing: better in winter (sun), can be too hot in summer
    if (['S', 'SE', 'SW'].includes(aspect)) {
      if (season === 'winter' && temperature < 15) {
        adjustment = 0.5 // Sun warmth benefit
      } else if (season === 'summer' && temperature > 25) {
        adjustment = -0.3 // Too hot with direct sun
      }
    }

    // East-facing: better for morning climbing (cooler)
    if (aspect === 'E') {
      if (season === 'summer' && temperature > 20) {
        adjustment = 0.3 // Morning shade benefit
      }
    }

    // West-facing: better for afternoon climbing in cold seasons
    if (aspect === 'W') {
      if ((season === 'winter' || season === 'autumn') && temperature < 15) {
        adjustment = 0.3 // Afternoon sun benefit
      }
    }

    return baseScore + adjustment
  }

  getScore(): number {
    return this.score
  }

  getTemperature(): number {
    return this.temperatureCelsius
  }

  getAspect(): AspectDirection | null {
    return this.aspect
  }

  getSeason(): Season {
    return this.season
  }

  getLabel(): ScoreLabel {
    return scoreToLabel(this.score)
  }

  isIdealRange(): boolean {
    return (
      this.temperatureCelsius >= TemperatureScore.IDEAL_MIN &&
      this.temperatureCelsius <= TemperatureScore.IDEAL_MAX
    )
  }

  isExtremeCondition(): boolean {
    return (
      this.temperatureCelsius <= TemperatureScore.EXTREME_COLD ||
      this.temperatureCelsius >= TemperatureScore.EXTREME_HOT
    )
  }

  equals(other: TemperatureScore): boolean {
    return (
      this.score === other.score &&
      this.temperatureCelsius === other.temperatureCelsius &&
      this.aspect === other.aspect &&
      this.season === other.season
    )
  }

  toString(): string {
    const aspectStr = this.aspect ? `, aspect=${this.aspect}` : ''
    return `TemperatureScore(${this.score.toFixed(2)}, ${this.temperatureCelsius}C${aspectStr}, ${this.season}, ${this.getLabel()})`
  }
}

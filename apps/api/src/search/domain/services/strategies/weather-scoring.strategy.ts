import type { Crag } from '@crags/domain/entities/crag.entity'
import {
  type IScoringStrategy,
  MAX_SCORE,
  type ScoringResult,
} from '../../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'
import type { ClimbingConditionsScorePrimitives } from '@weather/domain/value-objects/climbing-conditions-score.vo'

/**
 * Weather scoring strategy based on current climbing conditions.
 *
 * This strategy scores crags based on:
 * - Current weather conditions at the search location
 * - The crag's aspect (orientation) and how it relates to conditions
 * - Whether conditions are climbable
 *
 * The strategy uses pre-fetched weather data from the search criteria.
 * If no weather data is available, it returns a neutral score (1.5).
 *
 * Scoring (0-3 scale):
 * - 3.0: Excellent conditions, aspect optimal for current weather
 * - 2.0-3.0: Good conditions, favorable aspect
 * - 1.0-2.0: Moderate conditions, usable
 * - 0.0-1.0: Poor conditions, weather limits climbing
 */
export class WeatherScoringStrategy implements IScoringStrategy {
  private readonly neutralScore = MAX_SCORE / 2 // 1.5

  getName(): string {
    return 'weather'
  }

  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult {
    // Get weather conditions from criteria (pre-fetched)
    const weatherConditions = criteria.getWeatherConditions?.()

    // If no weather data available, return neutral score
    if (!weatherConditions) {
      return {
        score: this.neutralScore,
        details: {
          reason: 'no_weather_data',
        },
      }
    }

    // Base score from overall conditions (already 0-3 scale)
    let score = weatherConditions.overallScore

    // Apply seasonality-based adjustment (temperature coherence)
    const seasonalityAdjustment = this.calculateSeasonalityAdjustment(
      crag,
      weatherConditions,
    )
    score = Math.max(0, Math.min(MAX_SCORE, score + seasonalityAdjustment))

    // Apply aspect-based bonus/penalty
    const aspectAdjustment = this.calculateAspectAdjustment(
      crag,
      weatherConditions,
    )
    score = Math.max(0, Math.min(MAX_SCORE, score + aspectAdjustment))

    // If conditions are not climbable, significantly reduce score
    if (!weatherConditions.isClimbable) {
      score = Math.min(score, 0.5)
    }

    return {
      score,
      details: {
        baseScore: weatherConditions.overallScore,
        seasonalityAdjustment,
        aspectAdjustment,
        isClimbable: weatherConditions.isClimbable,
        label: weatherConditions.label,
        limitingFactor: this.getLimitingFactor(weatherConditions),
      },
    }
  }

  /**
   * Calculate seasonality-based adjustment to account for temperature coherence.
   *
   * Logic:
   * - Winter crags (good months: Nov-Mar) should have COLD weather to be optimal
   *   → If temperature is too warm (>18°C in winter months), penalize score
   * - Summer crags (good months: Apr-Oct) should have MODERATE-WARM weather
   *   → If temperature is too cold (<12°C in summer months), penalize score
   *
   * This prevents showing "Poor Conditions" for winter crags just because it's cold,
   * or for summer crags just because it's warm.
   */
  private calculateSeasonalityAdjustment(
    crag: Crag,
    conditions: ClimbingConditionsScorePrimitives,
  ): number {
    const seasonality = crag.getSeasonality()

    // If no seasonality data, no adjustment
    if (!seasonality || !seasonality.hasData()) {
      return 0
    }

    const currentMonth = new Date().getMonth() + 1 // 1-12
    const isCurrentMonthGood = seasonality.isGoodMonth(currentMonth)

    // If current month is not in the crag's good months, no adjustment needed
    // (the seasonality strategy will already penalize this crag)
    if (!isCurrentMonthGood) {
      return 0
    }

    // Determine crag type based on seasonality pattern
    const goodMonths = seasonality.getMonths()
    const isWinterCrag = this.isWinterSeasonalityCrag(goodMonths)
    const isSummerCrag = this.isSummerSeasonalityCrag(goodMonths)

    // Get actual temperature from conditions
    // temperatureScore interpretation:
    // - High score (>2.5) = comfortable temperature
    // - Low score (<1.5) = extreme temperature (too hot or too cold)
    // We need to infer if low score means "too hot" or "too cold"
    const tempScore = conditions.temperatureScore

    // Penalty magnitude for temperature mismatch
    const MISMATCH_PENALTY = -0.6 // Reduce score significantly

    // Winter crag logic: Should be cold (low temps are expected)
    if (isWinterCrag) {
      // Check if we're in winter months (Nov-Mar: 11, 12, 1, 2, 3)
      const isWinterMonth = currentMonth >= 11 || currentMonth <= 3

      // If tempScore is high (>2.3), it means temperature is comfortable
      // But for winter crags, comfortable temps in winter usually mean "too warm"
      // This suggests the weather is not optimal for a winter crag
      if (tempScore > 2.3 && isWinterMonth) {
        // It's a winter month, but too warm for a winter crag
        return MISMATCH_PENALTY
      }
    }

    // Summer crag logic: Should be warm/moderate (cold is not expected)
    if (isSummerCrag) {
      // Check if we're in summer months (Apr-Oct: 4-10)
      const isSummerMonth = currentMonth >= 4 && currentMonth <= 10

      // If tempScore is low (<1.5) and it's summer months, it might be too cold
      // for a summer crag (assuming low score in summer = cold, not hot)
      if (tempScore < 1.5 && isSummerMonth) {
        // It's a summer month, but too cold for a summer crag
        return MISMATCH_PENALTY
      }
    }

    // No mismatch detected, no adjustment
    return 0
  }

  /**
   * Determine if crag is a winter crag based on good months.
   * Winter crags: Majority of good months are Nov-Mar (11, 12, 1, 2, 3)
   */
  private isWinterSeasonalityCrag(goodMonths: number[]): boolean {
    const winterMonths = [11, 12, 1, 2, 3]
    const winterGoodMonths = goodMonths.filter((m) =>
      winterMonths.includes(m),
    ).length
    return winterGoodMonths > goodMonths.length / 2
  }

  /**
   * Determine if crag is a summer crag based on good months.
   * Summer crags: Majority of good months are Apr-Oct (4, 5, 6, 7, 8, 9, 10)
   */
  private isSummerSeasonalityCrag(goodMonths: number[]): boolean {
    const summerMonths = [4, 5, 6, 7, 8, 9, 10]
    const summerGoodMonths = goodMonths.filter((m) =>
      summerMonths.includes(m),
    ).length
    return summerGoodMonths > goodMonths.length / 2
  }

  /**
   * Calculate aspect-based adjustment based on current conditions.
   *
   * - North-facing crags get bonus in hot weather (shade)
   * - South-facing crags get bonus in cold weather (sun)
   * - East/West have smaller adjustments
   */
  private calculateAspectAdjustment(
    crag: Crag,
    conditions: ClimbingConditionsScorePrimitives,
  ): number {
    // Try to get crag aspect from tags or beta
    const aspect = this.getCragAspect(crag)

    if (!aspect) {
      return 0 // No aspect data, no adjustment
    }

    // Determine temperature context from the temperature score
    // Higher temp score in hot weather means we value shade
    // Higher temp score in cold weather means we value sun
    const tempScore = conditions.temperatureScore

    // If temperature score is low (<1.5), conditions are extreme
    // In this case, aspect matters more
    const extremeConditions = tempScore < 1.5

    const adjustmentMagnitude = extremeConditions ? 0.4 : 0.2

    // Simplified logic based on temperature score patterns:
    // - tempScore >= 2.5 with overallScore < 2.5 suggests hot weather (shade helps)
    // - tempScore >= 2.5 with overallScore >= 2.5 suggests good temps (neutral)
    // - tempScore < 2 suggests cold (sun helps) or very hot (shade helps)
    const needsShade =
      conditions.temperatureScore < 2 && conditions.overallScore < 2
    const needsSun =
      conditions.temperatureScore >= 2 && conditions.overallScore < 2.5

    if (needsShade && ['N', 'NE', 'NW'].includes(aspect)) {
      return adjustmentMagnitude
    }

    if (needsShade && ['S', 'SE', 'SW'].includes(aspect)) {
      return -adjustmentMagnitude * 0.5
    }

    if (needsSun && ['S', 'SE', 'SW'].includes(aspect)) {
      return adjustmentMagnitude
    }

    if (needsSun && ['N', 'NE', 'NW'].includes(aspect)) {
      return -adjustmentMagnitude * 0.5
    }

    return 0
  }

  /**
   * Extract crag aspect from available data
   */
  private getCragAspect(crag: Crag): string | null {
    // Check tags for aspect information
    const tags = crag.getTags()
    if (!tags) return null

    const tagsJson = tags.toJSON()

    // Look for aspect in various possible tag formats
    if (tagsJson.aspect) {
      return this.normalizeAspect(tagsJson.aspect)
    }

    // Check for orientation-related tags
    if (tagsJson.orientation) {
      return this.normalizeAspect(tagsJson.orientation)
    }

    // Check beta for aspect information
    const beta = crag.getBeta()
    if (beta && typeof beta.getByName === 'function') {
      const aspectItem = beta.getByName('Aspect')
      if (aspectItem) {
        return this.normalizeAspect(aspectItem.markdown)
      }
    }

    return null
  }

  /**
   * Normalize aspect string to standard format
   */
  private normalizeAspect(aspect: unknown): string | null {
    if (typeof aspect !== 'string') return null

    const normalized = aspect.toUpperCase().trim()
    const validAspects = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

    // Direct match
    if (validAspects.includes(normalized)) {
      return normalized
    }

    // Try to extract from longer strings
    if (normalized.includes('NORTH')) return 'N'
    if (normalized.includes('SOUTH')) return 'S'
    if (normalized.includes('EAST')) return 'E'
    if (normalized.includes('WEST')) return 'W'

    return null
  }

  /**
   * Get the primary limiting factor
   */
  private getLimitingFactor(
    conditions: ClimbingConditionsScorePrimitives,
  ): string | null {
    const scores = {
      temperature: conditions.temperatureScore,
      wind: conditions.windScore,
      precipitation: conditions.precipitationScore,
      humidity: conditions.humidityScore,
    }

    const threshold = 1.5
    let minScore = MAX_SCORE
    let limitingFactor: string | null = null

    for (const [factor, score] of Object.entries(scores)) {
      if (score < minScore && score < threshold) {
        minScore = score
        limitingFactor = factor
      }
    }

    return limitingFactor
  }
}

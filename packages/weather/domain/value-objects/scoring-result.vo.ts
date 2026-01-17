import { BestClimbingWindow } from './best-climbing-window.vo'
import { ClimbingConditionsScore } from './climbing-conditions-score.vo'
import { HourlyConditionScore } from './hourly-condition-score.vo'

/**
 * Represents the result of scoring calculations (without metadata/coordinates).
 * This is an internal value object used by the scoring service.
 */
export class ScoringResult {
  private constructor(
    private readonly conditions: ClimbingConditionsScore,
    private readonly hourlyConditions: HourlyConditionScore[],
    private readonly bestClimbingWindow: BestClimbingWindow | null,
  ) {}

  static create(input: {
    conditions: ClimbingConditionsScore
    hourlyConditions: HourlyConditionScore[]
    bestClimbingWindow: BestClimbingWindow | null
  }): ScoringResult {
    return new ScoringResult(
      input.conditions,
      input.hourlyConditions,
      input.bestClimbingWindow,
    )
  }

  getConditions(): ClimbingConditionsScore {
    return this.conditions
  }

  getHourlyConditions(): HourlyConditionScore[] {
    return this.hourlyConditions
  }

  getBestClimbingWindow(): BestClimbingWindow | null {
    return this.bestClimbingWindow
  }

  hasBestClimbingWindow(): boolean {
    return this.bestClimbingWindow !== null
  }
}

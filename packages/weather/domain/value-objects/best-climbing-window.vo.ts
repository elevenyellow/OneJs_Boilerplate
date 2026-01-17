import type { HourlyForecast } from '../entities/weather-response.entity'
import type { AspectDirection, Season } from './temperature-score.vo'

/**
 * Input for finding the best climbing window
 */
export class BestClimbingWindowInput {
  private constructor(
    private readonly hourlyForecast: HourlyForecast[],
    private readonly aspect: AspectDirection | null,
    private readonly season: Season | undefined,
    private readonly minHours: number,
  ) {}

  static create(input: {
    hourlyForecast: HourlyForecast[]
    aspect?: AspectDirection | null
    season?: Season
    minHours?: number
  }): BestClimbingWindowInput {
    return new BestClimbingWindowInput(
      input.hourlyForecast,
      input.aspect ?? null,
      input.season,
      input.minHours ?? 2,
    )
  }

  getHourlyForecast(): HourlyForecast[] {
    return this.hourlyForecast
  }

  getAspect(): AspectDirection | null {
    return this.aspect
  }

  getSeason(): Season | undefined {
    return this.season
  }

  getMinHours(): number {
    return this.minHours
  }

  hasEnoughData(): boolean {
    return this.hourlyForecast.length >= this.minHours
  }
}

/**
 * Represents a time window with optimal climbing conditions
 */
export class BestClimbingWindow {
  private constructor(
    private readonly startTime: string,
    private readonly endTime: string,
    private readonly averageScore: number,
    private readonly hours: number,
  ) {}

  static create(input: {
    startTime: string
    endTime: string
    averageScore: number
    hours: number
  }): BestClimbingWindow {
    return new BestClimbingWindow(
      input.startTime,
      input.endTime,
      input.averageScore,
      input.hours,
    )
  }

  getStartTime(): string {
    return this.startTime
  }

  getEndTime(): string {
    return this.endTime
  }

  getAverageScore(): number {
    return this.averageScore
  }

  getHours(): number {
    return this.hours
  }

  toPrimitives(): {
    startTime: string
    endTime: string
    averageScore: number
    hours: number
  } {
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      averageScore: this.averageScore,
      hours: this.hours,
    }
  }
}

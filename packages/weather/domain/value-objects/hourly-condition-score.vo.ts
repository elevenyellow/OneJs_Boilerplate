type ConditionLabel = 'excellent' | 'good' | 'moderate' | 'poor'

/**
 * Represents the climbing condition score for a specific hour
 */
export class HourlyConditionScore {
  private constructor(
    private readonly time: string,
    private readonly temperature: number,
    private readonly windSpeed: number,
    private readonly precipitationProbability: number,
    private readonly humidity: number,
    private readonly conditionScore: number,
    private readonly label: ConditionLabel,
  ) {}

  static create(input: {
    time: string
    temperature: number
    windSpeed: number
    precipitationProbability: number
    humidity: number
    conditionScore: number
    label: ConditionLabel
  }): HourlyConditionScore {
    return new HourlyConditionScore(
      input.time,
      input.temperature,
      input.windSpeed,
      input.precipitationProbability,
      input.humidity,
      input.conditionScore,
      input.label,
    )
  }

  getTime(): string {
    return this.time
  }

  getTemperature(): number {
    return this.temperature
  }

  getWindSpeed(): number {
    return this.windSpeed
  }

  getPrecipitationProbability(): number {
    return this.precipitationProbability
  }

  getHumidity(): number {
    return this.humidity
  }

  getConditionScore(): number {
    return this.conditionScore
  }

  getLabel(): ConditionLabel {
    return this.label
  }

  toPrimitives(): {
    time: string
    temperature: number
    windSpeed: number
    precipitationProbability: number
    humidity: number
    conditionScore: number
    label: ConditionLabel
  } {
    return {
      time: this.time,
      temperature: this.temperature,
      windSpeed: this.windSpeed,
      precipitationProbability: this.precipitationProbability,
      humidity: this.humidity,
      conditionScore: this.conditionScore,
      label: this.label,
    }
  }
}

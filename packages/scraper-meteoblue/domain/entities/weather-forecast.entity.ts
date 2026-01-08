export type WeatherCondition =
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'snow'
  | 'sleet'
  | 'unknown'

export interface WeatherForecastProps {
  id: string
  zoneId: string
  date: Date
  hour?: number
  tempMin: number
  tempMax: number
  tempCurrent?: number
  rainProb: number
  windSpeed: number
  windDirection?: string
  humidity: number
  condition: WeatherCondition
  conditionIcon?: string
  uvIndex?: number
  fetchedAt: Date
}

export class WeatherForecastEntity {
  constructor(
    public readonly id: string,
    public readonly zoneId: string,
    public readonly date: Date,
    public readonly hour: number | undefined,
    public readonly tempMin: number,
    public readonly tempMax: number,
    public readonly tempCurrent: number | undefined,
    public readonly rainProb: number,
    public readonly windSpeed: number,
    public readonly windDirection: string | undefined,
    public readonly humidity: number,
    public readonly condition: WeatherCondition,
    public readonly conditionIcon: string | undefined,
    public readonly uvIndex: number | undefined,
    public readonly fetchedAt: Date,
  ) {}

  static create(props: WeatherForecastProps): WeatherForecastEntity {
    return new WeatherForecastEntity(
      props.id,
      props.zoneId,
      props.date,
      props.hour,
      props.tempMin,
      props.tempMax,
      props.tempCurrent,
      props.rainProb,
      props.windSpeed,
      props.windDirection,
      props.humidity,
      props.condition,
      props.conditionIcon,
      props.uvIndex,
      props.fetchedAt,
    )
  }

  /**
   * Check if forecast is still valid (not expired)
   */
  isValid(ttlHours: number = 3): boolean {
    const now = new Date()
    const expiresAt = new Date(
      this.fetchedAt.getTime() + ttlHours * 60 * 60 * 1000,
    )
    return now < expiresAt
  }

  /**
   * Check if this is an hourly forecast
   */
  isHourly(): boolean {
    return this.hour !== undefined
  }

  /**
   * Get average temperature
   */
  getAverageTemp(): number {
    return (this.tempMin + this.tempMax) / 2
  }

  /**
   * Determines if weather is suitable for climbing
   * Simple heuristic: no rain, moderate wind, not too hot/cold
   */
  isGoodForClimbing(): boolean {
    const noRain = this.rainProb < 30
    const moderateWind = this.windSpeed < 25 // km/h
    const goodTemp = this.tempMax > 5 && this.tempMax < 35
    const notRaining = ![
      'rain',
      'heavy_rain',
      'thunderstorm',
      'snow',
      'sleet',
    ].includes(this.condition)

    return noRain && moderateWind && goodTemp && notRaining
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      zoneId: this.zoneId,
      date: this.date.toISOString(),
      hour: this.hour,
      tempMin: this.tempMin,
      tempMax: this.tempMax,
      tempCurrent: this.tempCurrent,
      rainProb: this.rainProb,
      windSpeed: this.windSpeed,
      windDirection: this.windDirection,
      humidity: this.humidity,
      condition: this.condition,
      conditionIcon: this.conditionIcon,
      uvIndex: this.uvIndex,
      fetchedAt: this.fetchedAt.toISOString(),
    }
  }
}

import { v4 as uuidv4 } from 'uuid'

export type WeatherCondition = 
  | 'sunny' 
  | 'partly-cloudy' 
  | 'cloudy' 
  | 'overcast'
  | 'light-rain' 
  | 'rain' 
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'windy'

export type ClimbingCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable'

export interface HourlyForecast {
  hour: number
  temperature: number
  feelsLike: number
  humidity: number
  precipitation: number
  precipitationProbability: number
  windSpeed: number
  windDirection: string
  windGust: number
  condition: WeatherCondition
  cloudCover: number
  uvIndex: number
}

export interface DailyForecast {
  date: Date
  sunrise: string
  sunset: string
  tempMin: number
  tempMax: number
  humidity: number
  precipitation: number
  precipitationProbability: number
  condition: WeatherCondition
  windSpeed: number
  windGust: number
  uvIndex: number
  climbingCondition: ClimbingCondition
  hourly: HourlyForecast[]
}

export class ForecastEntity {
  public readonly id: string

  constructor(
    public readonly zoneId: string,
    public readonly zoneName: string,
    public readonly daily: DailyForecast[],
    public readonly fetchedAt: Date,
    public readonly source: string = 'meteoblue',
    id?: string,
  ) {
    this.id = id ?? uuidv4()
  }

  /**
   * Get today's forecast
   */
  getToday(): DailyForecast | undefined {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return this.daily.find((d) => {
      const forecastDate = new Date(d.date)
      forecastDate.setHours(0, 0, 0, 0)
      return forecastDate.getTime() === today.getTime()
    })
  }

  /**
   * Get forecast for the next N days
   */
  getNextDays(days: number): DailyForecast[] {
    return this.daily.slice(0, days)
  }

  /**
   * Check if forecast data is stale (older than 6 hours)
   */
  isStale(): boolean {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
    return this.fetchedAt < sixHoursAgo
  }

  /**
   * Get best climbing hours for a specific day
   */
  getBestClimbingHours(date: Date): HourlyForecast[] {
    const dayForecast = this.daily.find((d) => {
      const forecastDate = new Date(d.date)
      return (
        forecastDate.getFullYear() === date.getFullYear() &&
        forecastDate.getMonth() === date.getMonth() &&
        forecastDate.getDate() === date.getDate()
      )
    })

    if (!dayForecast) return []

    // Filter hours with good conditions: no rain, moderate temp, low wind
    return dayForecast.hourly.filter(
      (h) =>
        h.precipitationProbability < 30 &&
        h.temperature >= 5 &&
        h.temperature <= 32 &&
        h.windSpeed < 30 &&
        h.hour >= 7 &&
        h.hour <= 19,
    )
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      zoneId: this.zoneId,
      zoneName: this.zoneName,
      daily: this.daily,
      fetchedAt: this.fetchedAt,
      source: this.source,
    }
  }
}



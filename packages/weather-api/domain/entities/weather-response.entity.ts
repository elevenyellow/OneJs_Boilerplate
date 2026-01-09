/**
 * Parsed weather data entities
 * Transforms the raw Meteoblue API response into usable TypeScript interfaces
 */

import type { MeteoblueAPIResponse } from '../../infrastructure/http/meteoblue-api.types'

/**
 * Complete parsed weather data
 */
export interface WeatherData {
  metadata: {
    location: string
    coordinates: {
      lat: number
      lon: number
    }
    timezone: string
    lastUpdate: Date
    generationTimeMs: number
  }
  current: CurrentWeather
  hourly: HourlyForecast[]
  daily: DailyForecast[]
}

/**
 * Current weather conditions
 */
export interface CurrentWeather {
  timestamp: Date
  temperature: number
  feelsLike?: number
  windSpeed: number
  windDirection?: string
  humidity?: number
  pressure?: number
  weatherCode: number
  isDaylight: boolean
  uvIndex?: number
}

/**
 * Hourly forecast data point
 */
export interface HourlyForecast {
  timestamp: Date
  temperature: number
  feelsLike: number
  windSpeed: number
  windDirection: string
  windGust: number
  precipitation: number
  humidity: number
  weatherCode: number
  uvIndex: number
  isDaylight: boolean
  // Air quality (optional, may be null)
  airQuality?: {
    co?: number | null
    pm10?: number | null
    pm25?: number | null
    no2?: number | null
    so2?: number | null
    ozone?: number | null
    aqi?: number | null
  }
}

/**
 * Daily forecast summary
 */
export interface DailyForecast {
  date: Date
  temperature: {
    min: number
    max: number
    mean: number
  }
  feelsLike: {
    min: number
    max: number
    mean: number
  }
  wind: {
    min: number
    max: number
    mean: number
    direction: string
  }
  precipitation: {
    amount: number
    probability: number
  }
  humidity: {
    min: number
    max: number
    mean: number
  }
  weatherCode: number
  uvIndex: number
  sunrise: string
  sunset: string
  sunshineMinutes: number
  predictability: number
}

/**
 * Parser class to convert MeteoblueAPIResponse to WeatherData
 */
export class WeatherDataParser {
  static parse(raw: MeteoblueAPIResponse): WeatherData {
    return {
      metadata: this.parseMetadata(raw),
      current: this.parseCurrent(raw),
      hourly: this.parseHourly(raw),
      daily: this.parseDaily(raw),
    }
  }

  private static parseMetadata(raw: MeteoblueAPIResponse): WeatherData['metadata'] {
    return {
      location: raw.metadata.name,
      coordinates: {
        lat: raw.metadata.latitude,
        lon: raw.metadata.longitude,
      },
      timezone: raw.metadata.timezone_abbrevation,
      lastUpdate: new Date(raw.metadata.modelrun_updatetime_utc * 1000),
      generationTimeMs: raw.metadata.generation_time_ms,
    }
  }

  private static parseCurrent(raw: MeteoblueAPIResponse): CurrentWeather {
    return {
      timestamp: new Date(raw.data_current.time * 1000),
      temperature: raw.data_current.temperature,
      windSpeed: raw.data_current.windspeed,
      weatherCode: raw.data_current.pictocode,
      isDaylight: raw.data_current.isdaylight === 1,
    }
  }

  private static parseHourly(raw: MeteoblueAPIResponse): HourlyForecast[] {
    const hourlyData = raw.data_1h
    const length = hourlyData.time.length

    return Array.from({ length }, (_, i) => ({
      timestamp: new Date(hourlyData.time[i] * 1000),
      temperature: hourlyData.temperature[i],
      feelsLike: hourlyData.felttemperature[i],
      windSpeed: hourlyData.windspeed[i],
      windDirection: hourlyData.winddirection[i],
      windGust: hourlyData.gust[i],
      precipitation: hourlyData.precipitation[i],
      humidity: hourlyData.relativehumidity[i],
      weatherCode: hourlyData.pictocode[i],
      uvIndex: hourlyData.uvindex[i],
      isDaylight: hourlyData.isdaylight[i] === 1,
      airQuality: this.parseAirQuality(hourlyData, i),
    }))
  }

  private static parseDaily(raw: MeteoblueAPIResponse): DailyForecast[] {
    const dailyData = raw.data_day
    const length = dailyData.time.length

    return Array.from({ length }, (_, i) => ({
      date: new Date(dailyData.time[i] * 1000),
      temperature: {
        min: dailyData.temperature_min[i],
        max: dailyData.temperature_max[i],
        mean: dailyData.temperature_mean[i],
      },
      feelsLike: {
        min: dailyData.felttemperature_min[i],
        max: dailyData.felttemperature_max[i],
        mean: dailyData.felttemperature_mean[i],
      },
      wind: {
        min: dailyData.windspeed_min[i],
        max: dailyData.windspeed_max[i],
        mean: dailyData.windspeed_mean[i],
        direction: dailyData.winddirection[i],
      },
      precipitation: {
        amount: dailyData.precipitation[i],
        probability: dailyData.precipitation_probability[i],
      },
      humidity: {
        min: dailyData.relativehumidity_min[i],
        max: dailyData.relativehumidity_max[i],
        mean: dailyData.relativehumidity_mean[i],
      },
      weatherCode: dailyData.pictocode[i],
      uvIndex: dailyData.uvindex[i],
      sunrise: dailyData.sunrise[i],
      sunset: dailyData.sunset[i],
      sunshineMinutes: dailyData.sunshinetime[i],
      predictability: dailyData.predictability[i],
    }))
  }

  private static parseAirQuality(
    hourlyData: MeteoblueAPIResponse['data_1h'],
    index: number,
  ): HourlyForecast['airQuality'] | undefined {
    // Air quality data may not be present or may have null values
    if (!hourlyData.co && !hourlyData.pm10 && !hourlyData.pm25) {
      return undefined
    }

    return {
      co: hourlyData.co?.[index] ?? null,
      pm10: hourlyData.pm10?.[index] ?? null,
      pm25: hourlyData.pm25?.[index] ?? null,
      no2: hourlyData.no2?.[index] ?? null,
      so2: hourlyData.so2?.[index] ?? null,
      ozone: hourlyData.ozone?.[index] ?? null,
      aqi: hourlyData.airqualityindex?.[index] ?? null,
    }
  }
}

// Re-export the raw API response type
export type { MeteoblueAPIResponse }

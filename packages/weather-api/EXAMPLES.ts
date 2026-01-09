/**
 * Example usage of the Weather API package
 *
 * This file demonstrates how to use the WeatherService in your application
 */

import { Inject, Injectable, Logger } from '@OneJs/core'
import { WeatherService } from '@packages/weather-api'

@Injectable()
export class WeatherExampleController {
  constructor(
    @Inject(WeatherService)
    private readonly weatherService: WeatherService,

    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Example 1: Get weather by coordinates (raw JSON)
   */
  async getWeatherByCoordinatesRaw() {
    try {
      const raw = await this.weatherService
        .getByCoordinates({
          latitude: 39.4739,
          longitude: -0.37966,
        })
        .raw()

      this.logger.info('example', 'Raw weather data received')

      return {
        location: raw.metadata.name,
        currentTemp: raw.data_current.temperature,
        hourlyTemps: raw.data_1h.temperature.slice(0, 24), // Next 24 hours
        dailyMaxTemps: raw.data_day.temperature_max.slice(0, 7), // Next 7 days
      }
    } catch (error) {
      this.logger.error('example', `Failed to fetch weather: ${error}`)
      throw error
    }
  }

  /**
   * Example 2: Get weather by coordinates (parsed entities)
   */
  async getWeatherByCoordinatesParsed() {
    try {
      const weather = await this.weatherService
        .getByCoordinates({
          latitude: 39.4739,
          longitude: -0.37966,
        })
        .parsed()

      this.logger.info('example', 'Parsed weather data received')

      return {
        metadata: {
          location: weather.metadata.location,
          coordinates: weather.metadata.coordinates,
          lastUpdate: weather.metadata.lastUpdate,
        },
        current: {
          temperature: weather.current.temperature,
          windSpeed: weather.current.windSpeed,
          isDaylight: weather.current.isDaylight,
        },
        hourlyForecast: weather.hourly.slice(0, 24).map((h) => ({
          time: h.timestamp,
          temp: h.temperature,
          feelsLike: h.feelsLike,
          wind: h.windSpeed,
          precipitation: h.precipitation,
        })),
        dailyForecast: weather.daily.slice(0, 7).map((d) => ({
          date: d.date,
          tempMin: d.temperature.min,
          tempMax: d.temperature.max,
          precipProbability: d.precipitation.probability,
        })),
      }
    } catch (error) {
      this.logger.error('example', `Failed to fetch weather: ${error}`)
      throw error
    }
  }

  /**
   * Example 3: Get weather by city name
   */
  async getWeatherByCity(cityName: string) {
    try {
      const weather = await this.weatherService.getByCity(cityName).parsed()

      this.logger.info('example', `Weather for ${cityName} received`)

      return {
        city: cityName,
        coordinates: weather.metadata.coordinates,
        current: {
          temperature: `${weather.current.temperature}°C`,
          windSpeed: `${weather.current.windSpeed} km/h`,
        },
        today: {
          min: weather.daily[0].temperature.min,
          max: weather.daily[0].temperature.max,
        },
        week: weather.daily.slice(1, 7).map((day) => ({
          date: day.date.toLocaleDateString(),
          min: day.temperature.min,
          max: day.temperature.max,
          precip: `${day.precipitation.probability}%`,
        })),
      }
    } catch (error) {
      this.logger.error(
        'example',
        `Failed to fetch weather for ${cityName}: ${error}`,
      )
      throw error
    }
  }

  /**
   * Example 4: Get air quality data
   */
  async getAirQuality(cityName: string) {
    try {
      const weather = await this.weatherService.getByCity(cityName).parsed()

      // Filter hourly data that has air quality information
      const airQualityData = weather.hourly
        .filter((h) => h.airQuality !== undefined)
        .slice(0, 24) // Next 24 hours
        .map((h) => ({
          time: h.timestamp,
          aqi: h.airQuality?.aqi,
          pm25: h.airQuality?.pm25,
          pm10: h.airQuality?.pm10,
          no2: h.airQuality?.no2,
          ozone: h.airQuality?.ozone,
        }))

      return {
        city: cityName,
        airQuality: airQualityData,
      }
    } catch (error) {
      this.logger.error('example', `Failed to fetch air quality: ${error}`)
      throw error
    }
  }

  /**
   * Example 5: Compare weather for multiple cities
   */
  async compareWeatherMultipleCities(cities: string[]) {
    try {
      const weatherPromises = cities.map(async (city) => {
        const weather = await this.weatherService.getByCity(city).parsed()

        return {
          city,
          current: weather.current.temperature,
          todayMax: weather.daily[0].temperature.max,
          todayMin: weather.daily[0].temperature.min,
        }
      })

      const results = await Promise.all(weatherPromises)

      return {
        comparison: results,
        warmest: results.reduce((max, city) =>
          city.current > max.current ? city : max,
        ),
        coldest: results.reduce((min, city) =>
          city.current < min.current ? city : min,
        ),
      }
    } catch (error) {
      this.logger.error('example', `Failed to compare cities: ${error}`)
      throw error
    }
  }

  /**
   * Example 6: Health check
   */
  async checkWeatherServiceHealth() {
    const health = await this.weatherService.healthCheck()

    return {
      status: health.overall ? 'healthy' : 'unhealthy',
      services: {
        meteoblueAPI: health.meteoblue ? 'UP' : 'DOWN',
        geocoding: health.geocoding ? 'UP' : 'DOWN',
      },
    }
  }
}

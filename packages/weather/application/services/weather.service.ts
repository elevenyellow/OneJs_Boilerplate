import { Inject, Injectable, Logger } from '@OneJs/core'
import { Coordinates } from '../../domain/value-objects/coordinates.vo'
import {
  type WeatherData,
  type MeteoblueAPIResponse,
  WeatherDataParser,
} from '../../domain/entities/weather-response.entity'
import { MeteoblueClient } from '../../infrastructure/http/meteoblue.client'
import { GeocodingService } from './geocoding.service'

/**
 * Weather query result that can return raw or parsed data
 */
export class WeatherQuery {
  constructor(
    private readonly coordinates: Coordinates,
    private readonly client: MeteoblueClient,
    private readonly logger: Logger,
  ) {}

  /**
   * Get raw JSON response from Meteoblue API
   */
  async raw(): Promise<MeteoblueAPIResponse> {
    this.logger.debug(
      'weather:service',
      `Fetching raw weather data for ${this.coordinates.toString()}`,
    )
    return await this.client.fetchWeatherData(this.coordinates)
  }

  /**
   * Get parsed weather data as TypeScript entities
   */
  async parsed(): Promise<WeatherData> {
    this.logger.debug(
      'weather:service',
      `Fetching parsed weather data for ${this.coordinates.toString()}`,
    )
    const rawData = await this.raw()
    return WeatherDataParser.parse(rawData)
  }
}

/**
 * Main Injectable Weather Service
 * 
 * Provides two entry points:
 * 1. getByCoordinates({ latitude, longitude }) - Direct coordinates
 * 2. getByCity(cityName) - City name (geocoded to coordinates)
 * 
 * Each returns a WeatherQuery that can call:
 * - .raw() - Get full JSON response
 * - .parsed() - Get parsed TypeScript entities
 * 
 * @example
 * ```typescript
 * // By coordinates - raw JSON
 * const raw = await weatherService
 *   .getByCoordinates({ latitude: 39.47, longitude: -0.38 })
 *   .raw()
 * 
 * // By city - parsed entities
 * const parsed = await weatherService
 *   .getByCity('Valencia')
 *   .parsed()
 * 
 * console.log(parsed.current.temperature)
 * console.log(parsed.hourly[0].windSpeed)
 * ```
 */
@Injectable()
export class WeatherService {
  constructor(
    @Inject(MeteoblueClient)
    private readonly meteoblueClient: MeteoblueClient,
    
    @Inject(GeocodingService)
    private readonly geocodingService: GeocodingService,
    
    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    this.logger.info('weather:service', 'WeatherService initialized')
  }

  /**
   * Get weather data by coordinates
   * 
   * @param coords - Object with latitude and longitude
   * @returns WeatherQuery object with .raw() and .parsed() methods
   * 
   * @example
   * ```typescript
   * const weather = weatherService.getByCoordinates({
   *   latitude: 39.4739,
   *   longitude: -0.37966
   * })
   * 
   * const data = await weather.parsed()
   * ```
   */
  getByCoordinates(coords: {
    latitude: number
    longitude: number
  }): WeatherQuery {
    const coordinates = Coordinates.create(coords.latitude, coords.longitude)
    
    this.logger.debug(
      'weather:service',
      `Creating query for coordinates: ${coordinates.toString()}`,
    )

    return new WeatherQuery(coordinates, this.meteoblueClient, this.logger)
  }

  /**
   * Get weather data by city name
   * 
   * @param cityName - Name of the city (e.g., "Valencia", "Madrid")
   * @returns Promise<WeatherQuery> - Resolves after geocoding the city
   * 
   * @example
   * ```typescript
   * const weather = await weatherService.getByCity('Valencia')
   * const data = await weather.parsed()
   * ```
   */
  async getByCity(cityName: string): Promise<WeatherQuery> {
    this.logger.debug('weather:service', `Creating query for city: "${cityName}"`)

    // Geocode city to coordinates
    const coordinates = await this.geocodingService.cityToCoordinates(cityName)

    this.logger.info(
      'weather:service',
      `City "${cityName}" geocoded to ${coordinates.toString()}`,
    )

    return new WeatherQuery(coordinates, this.meteoblueClient, this.logger)
  }

  /**
   * Health check - verify both Meteoblue API and geocoding service are accessible
   */
  async healthCheck(): Promise<{
    meteoblue: boolean
    geocoding: boolean
    overall: boolean
  }> {
    const meteoblueOk = await this.meteoblueClient.isAccessible()
    
    // Test geocoding with a simple query
    let geocodingOk = false
    try {
      await this.geocodingService.cityToCoordinates('Madrid')
      geocodingOk = true
    } catch {
      geocodingOk = false
    }

    return {
      meteoblue: meteoblueOk,
      geocoding: geocodingOk,
      overall: meteoblueOk && geocodingOk,
    }
  }
}

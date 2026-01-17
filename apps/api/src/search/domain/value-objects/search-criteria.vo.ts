import { OneJsError, ErrorCodes } from '@OneJs/core'
import { Coordinates } from '@crags/domain/value-objects'
import type { ClimbingConditionsScorePrimitives } from '@weather'
import {
  SeasonPreference,
  parseSeasonPreferenceFromCode,
  type ExposurePreference,
  parseExposurePreferenceFromCode,
} from '../types/seasonality.types'
import { GradeRange } from './grade-range.vo'
import { IncludeWeather } from './include-weather.vo'
import { QueryDate } from './query-date.vo'
import { SearchLimit } from './search-limit.vo'
import { SearchRadius } from './search-radius.vo'
import type { BoundingBox } from './bounding-box.vo'

/**
 * Query parameters for creating SearchCriteria from API request
 */
export type SearchCriteriaQueryParams = {
  // UBICACIÓN
  lat?: string // Latitud del usuario (ej: "41.7")
  lon?: string // Longitud del usuario (ej: "1.8")
  r?: string // Radio de búsqueda en km (ej: "50")

  // FILTRO DE GRADO
  gmin?: string // Grade band mínimo (10-52, ej: "24" = 6a)
  gmax?: string // Grade band máximo (10-52, ej: "32" = 7a)

  // FILTROS DE CONDICIONES
  season?: string // Preferencia de temporada: 1=verano, 2=invierno, 0=cualquiera
  // Filtra crags según sus meses buenos (ej: crags buenos en verano)

  exp?: string // Exposición/orientación del crag: 1=sol, 2=sombra, 0=cualquiera
  // Filtra por orientación física del crag (ej: paredes que dan al sur = sol)

  // FILTROS DE CALIDAD
  style?: string | string[] // Estilos de escalada: "sport", "trad", "boulder"
  qmin?: string // Rating mínimo de calidad (0-3, ej: "2" = mínimo 2 estrellas)

  // PAGINACIÓN
  limit?: string // Máximo de resultados (1-100, default 20)

  // CLIMA EN TIEMPO REAL
  weather?: string // ¿Incluir scoring de clima actual? "1"/"true" = sí
  // Si es true, consulta API de clima y ajusta scores

  date?: string // Fecha para evaluar clima (ISO: "2025-01-17")
  // Default: hoy. Permite buscar "¿qué crags serán buenos el sábado?"
}

export { type ExposurePreference }

export class SearchCriteria {
  private constructor(
    private readonly coordinates: Coordinates,
    private readonly radius: SearchRadius,
    private readonly gradeRange: GradeRange,
    private readonly seasonPreference: SeasonPreference,
    private readonly limit: SearchLimit,
    private readonly exposurePreference: ExposurePreference,
    private readonly climbingStyles: string[],
    private readonly minQualityRating: number,
    private readonly includeWeather: IncludeWeather,
    private readonly queryDate: QueryDate,
    private readonly weatherConditions?: ClimbingConditionsScorePrimitives,
  ) {}

  /**
   * Create SearchCriteria from API query parameters (compact names)
   * Handles all parsing and validation in one place
   */
  static createFromQuery(query: SearchCriteriaQueryParams): SearchCriteria {
    const latitude = Number.parseFloat(query.lat ?? '')
    const longitude = Number.parseFloat(query.lon ?? '')
    const radiusKm = Number.parseFloat(query.r ?? '')
    const minGradeBand = Number.parseInt(query.gmin ?? '', 10)
    const maxGradeBand = Number.parseInt(query.gmax ?? '', 10)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new OneJsError(
        'Invalid coordinates',
        400,
        'latitude and longitude must be valid numbers',
        { latitude, longitude },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (Number.isNaN(radiusKm)) {
      throw new OneJsError(
        'Invalid radius',
        400,
        'radius must be a valid number',
        { radiusKm: query.r },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (Number.isNaN(minGradeBand) || Number.isNaN(maxGradeBand)) {
      throw new OneJsError(
        'Invalid grade band',
        400,
        'minGradeBand and maxGradeBand must be valid numbers',
        { minGradeBand: query.gmin, maxGradeBand: query.gmax },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const seasonCode = Number.parseInt(query.season ?? '', 10)
    const seasonPreference = parseSeasonPreferenceFromCode(seasonCode)

    const expCode = Number.parseInt(query.exp ?? '', 10)
    const exposurePreference = parseExposurePreferenceFromCode(expCode)

    const climbingStyles = Array.isArray(query.style)
      ? query.style
      : typeof query.style === 'string'
        ? [query.style]
        : []

    const minQualityRating = query.qmin ? Number.parseFloat(query.qmin) : 0

    const limit = SearchLimit.createFromQuery(query.limit)
    const includeWeather = IncludeWeather.createFromQuery(query.weather)
    const queryDate = QueryDate.createFromQuery(query.date)

    const coordinates = Coordinates.createFrom(latitude, longitude)
    const radius = SearchRadius.create(radiusKm)
    const gradeRange = GradeRange.create(minGradeBand, maxGradeBand)

    return SearchCriteria.create(
      coordinates,
      radius,
      gradeRange,
      seasonPreference,
      limit,
      exposurePreference,
      climbingStyles,
      minQualityRating,
      includeWeather,
      queryDate,
    )
  }

  /**
   * Create search criteria with validation
   */
  static create(
    coordinates: Coordinates,
    radius: SearchRadius,
    gradeRange: GradeRange,
    seasonPreference: SeasonPreference = SeasonPreference.ANY,
    limit: SearchLimit = SearchLimit.default(),
    exposurePreference: ExposurePreference = 'any',
    climbingStyles: string[] = [],
    minQualityRating = 0,
    includeWeather: IncludeWeather = IncludeWeather.default(),
    queryDate: QueryDate = QueryDate.today(),
    weatherConditions?: ClimbingConditionsScorePrimitives,
  ): SearchCriteria {
    if (minQualityRating < 0 || minQualityRating > 3) {
      throw new OneJsError(
        'Invalid quality rating',
        400,
        'minQualityRating must be between 0 and 3',
        { minQualityRating },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new SearchCriteria(
      coordinates,
      radius,
      gradeRange,
      seasonPreference,
      limit,
      exposurePreference,
      climbingStyles,
      minQualityRating,
      includeWeather,
      queryDate,
      weatherConditions,
    )
  }

  /**
   * Get search coordinates
   */
  getCoordinates(): Coordinates {
    return this.coordinates
  }

  /**
   * Get search radius
   */
  getRadius(): SearchRadius {
    return this.radius
  }

  /**
   * Get search radius in kilometers (for backward compatibility)
   */
  getRadiusKm(): number {
    return this.radius.getKilometers()
  }

  /**
   * Calculate geographic bounding box for the search area
   */
  getBoundingBox(): BoundingBox {
    return this.radius.calculateBoundingBox(this.coordinates)
  }

  /**
   * Get grade range for filtering
   */
  getGradeRange(): GradeRange {
    return this.gradeRange
  }

  /**
   * Get season preference
   */
  getSeasonPreference(): SeasonPreference {
    return this.seasonPreference
  }

  /**
   * Get result limit
   */
  getLimit(): SearchLimit {
    return this.limit
  }

  /**
   * Get exposure preference (sun/shade/any)
   */
  getExposurePreference(): ExposurePreference {
    return this.exposurePreference
  }

  /**
   * Get climbing styles filter
   */
  getClimbingStyles(): string[] {
    return this.climbingStyles
  }

  /**
   * Get minimum quality rating filter (0-3)
   */
  getMinQualityRating(): number {
    return this.minQualityRating
  }

  /**
   * Whether to include weather data in scoring
   */
  getIncludeWeather(): IncludeWeather {
    return this.includeWeather
  }

  /**
   * Get query date for weather evaluation
   */
  getQueryDate(): QueryDate {
    return this.queryDate
  }

  /**
   * Get weather conditions for the search location (optional)
   */
  getWeatherConditions(): ClimbingConditionsScorePrimitives | undefined {
    return this.weatherConditions
  }

  /**
   * Create a copy with weather conditions added
   */
  withWeatherConditions(
    weatherConditions: ClimbingConditionsScorePrimitives,
  ): SearchCriteria {
    return new SearchCriteria(
      this.coordinates,
      this.radius,
      this.gradeRange,
      this.seasonPreference,
      this.limit,
      this.exposurePreference,
      this.climbingStyles,
      this.minQualityRating,
      this.includeWeather,
      this.queryDate,
      weatherConditions,
    )
  }

  toString(): string {
    return JSON.stringify(this.toJSON())
  }

  toJSON(): Record<string, unknown> {
    return {
      latitude: this.coordinates.getLatitude(),
      longitude: this.coordinates.getLongitude(),
      radiusKm: this.radius.getKilometers(),
      minGradeBand: this.gradeRange.getMin(),
      maxGradeBand: this.gradeRange.getMax(),
      seasonPreference: this.seasonPreference,
      limit: this.limit.getValue(),
      exposurePreference: this.exposurePreference,
      climbingStyles: this.climbingStyles,
      minQualityRating: this.minQualityRating,
      includeWeather: this.includeWeather.getValue(),
      queryDate: this.queryDate.getValue(),
      weatherConditions: this.weatherConditions,
    }
  }
}

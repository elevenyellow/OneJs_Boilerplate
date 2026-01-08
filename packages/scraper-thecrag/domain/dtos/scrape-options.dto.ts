export interface ScrapeOptionsDto {
  /**
   * Lista de países a scrapear (códigos ISO o nombres)
   * Si está vacío, scrapea todos los países disponibles
   */
  countries?: string[]

  /**
   * Profundidad máxima de navegación en la jerarquía
   * 1 = solo países, 2 = países + regiones, 3 = hasta áreas, etc.
   */
  maxDepth?: number

  /**
   * Número máximo de zonas a scrapear por ejecución
   */
  maxZones?: number

  /**
   * Delay entre requests en milisegundos (rate limiting)
   */
  delayMs?: number

  /**
   * Número de reintentos en caso de error
   */
  retries?: number

  /**
   * Si debe actualizar zonas existentes o solo agregar nuevas
   */
  updateExisting?: boolean

  /**
   * URLs específicas a scrapear (ignora countries si se proporciona)
   */
  specificUrls?: string[]
}

export class ScrapeOptions {
  public readonly countries: string[]
  public readonly maxDepth: number
  public readonly maxZones: number
  public readonly delayMs: number
  public readonly retries: number
  public readonly updateExisting: boolean
  public readonly specificUrls: string[]

  constructor(options: ScrapeOptionsDto = {}) {
    this.countries = options.countries ?? []
    this.maxDepth = options.maxDepth ?? 3
    this.maxZones = options.maxZones ?? 100
    this.delayMs = options.delayMs ?? 1000
    this.retries = options.retries ?? 3
    this.updateExisting = options.updateExisting ?? true
    this.specificUrls = options.specificUrls ?? []
  }

  hasSpecificUrls(): boolean {
    return this.specificUrls.length > 0
  }

  shouldScrapeCountry(country: string): boolean {
    if (this.countries.length === 0) return true
    return this.countries.some((c) => c.toLowerCase() === country.toLowerCase())
  }
}

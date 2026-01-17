/**
 * Value Object representing whether to include weather data in search scoring.
 * Defaults to true (include weather).
 */
export class IncludeWeather {
  private constructor(private readonly value: boolean) {}

  /**
   * Create from boolean value
   */
  static create(value: boolean): IncludeWeather {
    return new IncludeWeather(value)
  }

  /**
   * Create from query parameter string
   * '0' or 'false' = exclude weather, everything else = include
   * by default include weather
   */
  static createFromQuery(queryValue: string | undefined): IncludeWeather {
    const shouldExclude =
      queryValue === '0' || queryValue?.toLowerCase() === 'false'
    return new IncludeWeather(!shouldExclude)
  }

  /**
   * Default value: include weather
   */
  static default(): IncludeWeather {
    return new IncludeWeather(true)
  }

  getValue(): boolean {
    return this.value
  }

  equals(other: IncludeWeather): boolean {
    return this.value === other.value
  }

  toString(): string {
    return String(this.value)
  }
}

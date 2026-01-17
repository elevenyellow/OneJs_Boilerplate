/**
 * Complete TypeScript types for Meteoblue API response
 * Based on the actual API response structure
 */

export interface MeteoblueAPIResponse {
  metadata: {
    modelrun_updatetime_utc: number
    name: string
    height: number
    timezone_abbrevation: string
    latitude: number
    longitude: number
    modelrun_utc: number
    spotradius: number
    sigmalevel: number
    sat_domain: string
    utc_timeoffset: number
    generation_time_ms: number
  }

  units: {
    time: string
    temperature: string
    windspeed: string
    precipitation: string
    relativehumidity: string
    winddirection: string
    pressure: string
    cloudcover: string
    cape: string
    visibility: string
    sunshinetime: string
    predictability: string
    co?: string
    pm10?: string
    pm25?: string
    no2?: string
    so2?: string
    ozone?: string
    aod550?: string
    airqualityindex?: string
    [key: string]: string | undefined
  }

  data_current: {
    time: number
    windspeed_color: string
    isobserveddata: number
    metarid: number | null
    isdaylight: number
    sunpath: {
      today: number[]
      yearlymax: number[]
      yearlymin: number[]
      currenttimeindex: number
      currentelevation: number
      currenttime: number
      timeinterpolationfactor: number
      maxdate: number
      mindate: number
      todaytimeseries: number[]
    }
    zenithangle: number
    temperature_color: string
    pictocode_detailed: number
    pictocode: number
    windspeed: number
    temperature: number
    temperature_fontcolor: string
  }

  data_1h: {
    time: number[]
    temperature: number[]
    felttemperature: number[]
    windspeed: number[]
    winddirection: string[]
    precipitation: number[]
    relativehumidity: number[]
    pictocode: number[]
    uvindex: number[]
    gust: number[]
    snowfraction: number[]
    isdaylight: number[]
    // Air quality (may have null values)
    co?: (number | null)[]
    pm10?: (number | null)[]
    pm25?: (number | null)[]
    no2?: (number | null)[]
    so2?: (number | null)[]
    ozone?: (number | null)[]
    aod550?: (number | null)[]
    airqualityindex?: (number | null)[]
    // Additional fields with color codes
    temperature_color?: string[]
    windspeed_color?: string[]
    relativehumidity_color?: string[]
    felttemperature_color?: string[]
    [key: string]: any
  }

  data_3h: {
    time: number[]
    temperature: number[]
    felttemperature: number[]
    windspeed: number[]
    winddirection: string[]
    precipitation: number[]
    relativehumidity: number[]
    pictocode: number[]
    uvindex: number[]
    gust: number[]
    snowfraction: number[]
    isdaylight: number[]
    // Air quality
    co?: (number | null)[]
    pm10?: (number | null)[]
    pm25?: (number | null)[]
    no2?: (number | null)[]
    so2?: (number | null)[]
    ozone?: (number | null)[]
    [key: string]: any
  }

  data_day: {
    time: number[]
    temperature_min: number[]
    temperature_max: number[]
    temperature_mean: number[]
    felttemperature_min: number[]
    felttemperature_max: number[]
    felttemperature_mean: number[]
    precipitation: number[]
    precipitation_probability: number[]
    windspeed_min: number[]
    windspeed_max: number[]
    windspeed_mean: number[]
    winddirection: string[]
    pictocode: number[]
    uvindex: number[]
    relativehumidity_min: number[]
    relativehumidity_max: number[]
    relativehumidity_mean: number[]
    sunrise: string[]
    sunset: string[]
    sunshinetime: number[]
    predictability: number[]
    // Many more fields in actual response
    [key: string]: any
  }

  trend_1h?: {
    time: number[]
    temperature: number[]
    dewpointtemperature: number[]
    precipitation: number[]
    windspeed: number[]
    [key: string]: any
  }

  trend_3h?: {
    time: number[]
    temperature: number[]
    dewpointtemperature: number[]
    precipitation: number[]
    windspeed: number[]
    [key: string]: any
  }

  trend_day?: {
    time: number[]
    temperature_mean: number[]
    precipitation: number[]
    windspeed_mean: number[]
    [key: string]: any
  }

  data_night_morning_afternoon?: {
    time: number[]
    daypart: string[]
    temperature_min: number[]
    temperature_max: number[]
    windspeed: number[]
    winddirection: string[]
    precipitation_probability: number[]
    pictocode: number[]
    [key: string]: any
  }
}

/**
 * Simplified query parameters for Meteoblue API
 */
export interface MeteoblueQueryParams {
  lat: number
  lon: number
  asl?: number
  tz?: string
  temperature?: 'C' | 'F' | 'K'
  windspeed?: 'kmh' | 'ms' | 'mph' | 'kn' | 'ms-1'
  precipitationamount?: 'mm' | 'inch'
  winddirection?: '3char' | '2char' | 'degree'
  timeformat?: 'iso8601' | 'timestamp' | 'timestamp_utc'
  history_days?: number
  forecast_days?: number
  expire?: number
  apikey: string
}

/**
 * Available package configurations
 */
export type MeteobluePackage =
  | 'basic-1h'
  | 'basic-3h'
  | 'basic-day'
  | 'current'
  | 'wind-1h'
  | 'wind-3h'
  | 'wind-day'
  | 'airquality-1h'
  | 'airquality-3h'
  | 'airquality-day'
  | 'trendpro-1h'
  | 'trendpro-3h'
  | 'trendpro-day'
  | 'clouds-day'
  | 'sunmoon'
  | 'pictosplit14day'
  | string // Allow custom combinations

/**
 * Client configuration
 */
export interface MeteoblueClientConfig {
  apiKey?: string // Optional, can use env var
  sharedSecret?: string // Optional, can use env var
  baseUrl?: string
  timeout?: number
  maxRetries?: number
  retryDelayMs?: number
  defaultPackages?: MeteobluePackage[]
}

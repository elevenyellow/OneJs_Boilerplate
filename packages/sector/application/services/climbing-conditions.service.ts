import { Injectable } from '@OneJs/core'
import type { DailyForecast } from '@weather'

/**
 * Servicio para analizar condiciones meteorológicas para escalada
 */
@Injectable()
export class ClimbingConditionsService {
  /**
   * Analiza si las condiciones meteorológicas son buenas para escalar
   *
   * @param forecast - Pronóstico diario
   * @param preferredOrientation - Orientación preferida (sun/shade)
   * @param sectorOrientation - Orientación del sector (N/S/E/W/etc)
   * @returns Score de 0-100 de qué tan buenas son las condiciones
   */
  analyzeConditions(
    forecast: DailyForecast,
    preferredOrientation: 'sun' | 'shade' | 'any',
    sectorOrientation: string | null,
  ): {
    score: number
    reasons: string[]
    isGoodDay: boolean
  } {
    let score = 50 // Base score
    const reasons: string[] = []

    // 1. TEMPERATURA (0-25 puntos)
    const temp = forecast.temperature.mean
    if (temp >= 15 && temp <= 25) {
      score += 25
      reasons.push('Ideal climbing temperature')
    } else if (temp >= 10 && temp < 15) {
      score += 20
      reasons.push('Cool but acceptable temperature')
    } else if (temp > 25 && temp <= 30) {
      score += 15
      reasons.push('Warm temperature')
    } else if (temp < 10) {
      score += 5
      reasons.push('Cold temperature')
    } else if (temp > 30) {
      score -= 10
      reasons.push('Too hot')
    }

    // 2. VIENTO (0-15 puntos)
    const windSpeed = forecast.wind.mean
    if (windSpeed < 10) {
      score += 15
      reasons.push('Gentle wind')
    } else if (windSpeed < 20) {
      score += 10
      reasons.push('Moderate wind')
    } else if (windSpeed < 30) {
      score += 5
      reasons.push('Strong wind')
    } else {
      score -= 10
      reasons.push('Very strong wind - dangerous')
    }

    // 3. PRECIPITACIÓN (0-20 puntos)
    const precipitation = forecast.precipitation.amount
    const rainProbability = forecast.precipitation.probability

    if (precipitation === 0 && rainProbability < 10) {
      score += 20
      reasons.push('No rain expected')
    } else if (precipitation < 1 && rainProbability < 30) {
      score += 15
      reasons.push('Low chance of rain')
    } else if (precipitation < 5 || rainProbability < 50) {
      score += 5
      reasons.push('Possibility of rain')
    } else {
      score -= 20
      reasons.push('Rain likely - not recommended')
    }

    // 4. ORIENTACIÓN Y SOL (0-20 puntos)
    const orientationScore = this.calculateOrientationScore(
      sectorOrientation,
      preferredOrientation,
      forecast.sunshineMinutes,
    )
    score += orientationScore.points
    if (orientationScore.reason) {
      reasons.push(orientationScore.reason)
    }

    // 5. HUMEDAD (0-10 puntos)
    const humidity = forecast.humidity.mean
    if (humidity < 60) {
      score += 10
      reasons.push('Low humidity - dry rock')
    } else if (humidity < 75) {
      score += 5
      reasons.push('Moderate humidity')
    } else {
      reasons.push('High humidity - rock may be damp')
    }

    // 6. UV INDEX (0-10 puntos)
    const uvIndex = forecast.uvIndex
    if (uvIndex < 5) {
      score += 10
    } else if (uvIndex < 8) {
      score += 5
      reasons.push('Moderate UV - use sun protection')
    } else {
      reasons.push('High UV - sun protection essential')
    }

    // Normalizar score a 0-100
    score = Math.max(0, Math.min(100, score))

    // Determinar si es un buen día
    const isGoodDay = score >= 60 && precipitation < 5 && windSpeed < 25

    return {
      score,
      reasons,
      isGoodDay,
    }
  }

  /**
   * Calcula score basado en orientación del sector vs preferencia
   */
  private calculateOrientationScore(
    sectorOrientation: string | null,
    preferredOrientation: 'sun' | 'shade' | 'any',
    sunshineMinutes: number,
  ): { points: number; reason?: string } {
    if (preferredOrientation === 'any' || !sectorOrientation) {
      return { points: 10 }
    }

    const orientation = sectorOrientation.toUpperCase()

    // En verano preferimos sombra (N, NE, NW)
    if (preferredOrientation === 'shade') {
      if (orientation.includes('N') || orientation === 'NORTH') {
        return {
          points: 20,
          reason: 'North orientation - shade in summer',
        }
      } else if (orientation.includes('E') && !orientation.includes('S')) {
        return {
          points: 15,
          reason: 'East orientation - afternoon shade',
        }
      } else if (orientation.includes('W') && !orientation.includes('S')) {
        return {
          points: 10,
          reason: 'West orientation - morning shade',
        }
      } else {
        return {
          points: 0,
          reason: 'South orientation - too much sun',
        }
      }
    }

    // En invierno preferimos sol (S, SE, SW)
    if (preferredOrientation === 'sun') {
      if (orientation.includes('S') || orientation === 'SOUTH') {
        return {
          points: 20,
          reason: 'South orientation - sun all day',
        }
      } else if (orientation.includes('E') && !orientation.includes('N')) {
        return {
          points: 15,
          reason: 'East orientation - morning sun',
        }
      } else if (orientation.includes('W') && !orientation.includes('N')) {
        return {
          points: 15,
          reason: 'West orientation - afternoon sun',
        }
      } else {
        return {
          points: 0,
          reason: 'North orientation - little sun',
        }
      }
    }

    return { points: 10 }
  }

  /**
   * Analiza la estacionalidad del sector
   * Los sectores tienen datos de estacionalidad de TheCrag (popularidad por mes)
   *
   * @param seasonality - Array de 12 números representando popularidad mensual
   * @param currentMonth - Mes actual (1-12)
   * @returns Score de 0-100
   */
  analyzeSeasonality(
    seasonality: number[] | null,
    currentMonth: number,
  ): { score: number; reason?: string } {
    if (!seasonality || seasonality.length < 12) {
      return { score: 50 } // Score neutral si no hay datos
    }

    const monthIndex = currentMonth - 1
    const currentMonthPopularity = seasonality[monthIndex]
    const maxPopularity = Math.max(...seasonality)
    const minPopularity = Math.min(...seasonality)

    // Si no hay variación, score neutral
    if (maxPopularity === minPopularity) {
      return { score: 50 }
    }

    // Normalizar a 0-100
    const normalizedScore =
      ((currentMonthPopularity - minPopularity) /
        (maxPopularity - minPopularity)) *
      100

    let reason: string | undefined
    if (normalizedScore > 80) {
      reason = 'Peak season - very popular this month'
    } else if (normalizedScore > 60) {
      reason = 'Good season'
    } else if (normalizedScore < 30) {
      reason = 'Off season'
    }

    return { score: normalizedScore, reason }
  }

  /**
   * Determina la orientación preferida basada en la temperatura promedio
   *
   * @param avgTemp - Temperatura promedio en los próximos días
   * @returns 'sun' para clima frío, 'shade' para clima caluroso
   */
  getPreferredOrientation(avgTemp: number): 'sun' | 'shade' | 'any' {
    if (avgTemp < 15) {
      return 'sun' // Frío - buscamos sol
    } else if (avgTemp > 25) {
      return 'shade' // Calor - buscamos sombra
    } else {
      return 'any' // Temperatura moderada - cualquiera vale
    }
  }
}

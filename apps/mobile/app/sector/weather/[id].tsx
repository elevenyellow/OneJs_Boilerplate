import {
  WeatherDetailScreen,
  type WeatherDaily,
  type WeatherHourly,
} from '@/components/WeatherDetailScreen'
import { useWeatherByCoordinates } from '@/hooks/useWeatherByCoordinates'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'

export default function SectorWeatherScreen() {
  const { lat, lon, name } = useLocalSearchParams<{
    lat: string
    lon: string
    name: string
  }>()
  const router = useRouter()

  const latitude = lat ? parseFloat(lat) : null
  const longitude = lon ? parseFloat(lon) : null

  const { data: weatherData, isLoading } = useWeatherByCoordinates(
    latitude ?? 0,
    longitude ?? 0,
    latitude !== null && longitude !== null,
  )

  // Transform API data to component format
  const daily: WeatherDaily[] = useMemo(() => {
    if (!weatherData?.daily) return []
    
    // Filter to only include today and future days
    const now = new Date()
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )

    return weatherData.daily
      .filter((day) => {
        if (!day.date) return false
        const forecastDate = new Date(day.date)
        return forecastDate >= todayStart
      })
      .map((day) => ({
        date: day.date,
        weatherCode: day.weatherCode,
        temperature: {
          min: day.temperature.min,
          max: day.temperature.max,
          mean: day.temperature.mean,
        },
        precipitation: {
          probability: day.precipitation.probability,
          amount: day.precipitation.amount,
        },
        wind: {
          mean: day.wind.mean,
          max: day.wind.max,
        },
        humidity: {
          mean: day.humidity.mean,
          min: day.humidity.min,
          max: day.humidity.max,
        },
        uvIndex: day.uvIndex,
        sunshineMinutes: day.sunshineMinutes,
      }))
  }, [weatherData?.daily])

  const hourly: WeatherHourly[] = useMemo(() => {
    if (!weatherData?.hourly) return []
    return weatherData.hourly.map((hour) => ({
      timestamp: hour.timestamp,
      temperature: hour.temperature,
      feelsLike: hour.feelsLike,
      windSpeed: hour.windSpeed,
      windDirection: hour.windDirection,
      windGust: hour.windGust,
      precipitation: hour.precipitation,
      humidity: hour.humidity,
      weatherCode: hour.weatherCode,
      uvIndex: hour.uvIndex,
      isDaylight: hour.isDaylight,
    }))
  }, [weatherData?.hourly])

  return (
    <WeatherDetailScreen
      name={name || 'Sector'}
      isLoading={isLoading}
      daily={daily}
      hourly={hourly}
      onBack={() => router.back()}
    />
  )
}

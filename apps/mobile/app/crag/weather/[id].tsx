import {
  WeatherDetailScreen,
  type WeatherDaily,
  type WeatherHourly,
} from '@/components/WeatherDetailScreen'
import { useCragDetail } from '@/hooks/useCragDetail'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'

export default function CragWeatherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: crag, isLoading } = useCragDetail(id)

  // Transform crag forecast data to component format
  const daily: WeatherDaily[] = useMemo(() => {
    if (!crag?.forecast) return []

    // Filter to only include today and future days
    const now = new Date()
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )

    return crag.forecast
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
        sunrise: day.sunrise,
        sunset: day.sunset,
      }))
  }, [crag?.forecast])

  // Transform crag hourly forecast data to component format
  const hourly: WeatherHourly[] = useMemo(() => {
    if (!crag?.hourlyForecast) return []

    return crag.hourlyForecast.map((hour) => ({
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
  }, [crag?.hourlyForecast])

  return (
    <WeatherDetailScreen
      name={crag?.name || 'Crag'}
      isLoading={isLoading}
      daily={daily}
      hourly={hourly}
      onBack={() => router.back()}
    />
  )
}

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState, useEffect } from 'react'
import * as Location from 'expo-location'

interface LocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

interface CachedLocation {
  latitude: number
  longitude: number
  timestamp: number
}

const LOCATION_CACHE_KEY = '@climb-zone:last-location'
const LOCATION_CACHE_DURATION = 10 * 60 * 1000 // 10 minutos
const DEFAULT_LOCATION = {
  latitude: 39.4699,
  longitude: -0.3763,
  error: 'Using default location (Valencia, Spain)',
}

/**
 * Hook optimizado para obtener la ubicación del usuario
 * - Usa caché de AsyncStorage para carga instantánea
 * - Refresca ubicación en segundo plano si caché es antigua
 * - Fallback a ubicación por defecto si falla
 */
export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    let isMounted = true

    async function getLocation() {
      try {
        // 1️⃣ PRIMERO: Intentar cargar ubicación cacheada (INSTANTÁNEO)
        const cachedData = await AsyncStorage.getItem(LOCATION_CACHE_KEY)
        
        if (cachedData) {
          const cached: CachedLocation = JSON.parse(cachedData)
          const age = Date.now() - cached.timestamp
          
          // Si la caché es reciente (< 10 min), usarla inmediatamente
          if (age < LOCATION_CACHE_DURATION) {
            console.log('[Location] Using cached location (age:', Math.round(age / 1000), 's)')
            
            if (isMounted) {
              setLocation({
                latitude: cached.latitude,
                longitude: cached.longitude,
                error: null,
                loading: false,
              })
            }
            
            // ✅ Ya tenemos ubicación, no necesitamos esperar GPS
            return
          }
        }

        // 2️⃣ SEGUNDO: Si no hay caché o es muy antigua, obtener ubicación actual
        const { status } = await Location.requestForegroundPermissionsAsync()
        
        if (status !== 'granted') {
          if (isMounted) {
            setLocation({
              ...DEFAULT_LOCATION,
              loading: false,
            })
          }
          return
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        const newLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }

        // Guardar en caché para próximas sesiones
        await AsyncStorage.setItem(
          LOCATION_CACHE_KEY,
          JSON.stringify({
            ...newLocation,
            timestamp: Date.now(),
          })
        )

        if (isMounted) {
          setLocation({
            ...newLocation,
            error: null,
            loading: false,
          })
        }
      } catch (error) {
        console.error('[Location] Error getting location:', error)
        
        if (isMounted) {
          // Si falla (común en web), usar ubicación por defecto
          setLocation({
            ...DEFAULT_LOCATION,
            loading: false,
          })
        }
      }
    }

    getLocation()

    return () => {
      isMounted = false
    }
  }, [])

  const refresh = async () => {
    setLocation((prev) => ({ ...prev, loading: true }))

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }

      // Actualizar caché
      await AsyncStorage.setItem(
        LOCATION_CACHE_KEY,
        JSON.stringify({
          ...newLocation,
          timestamp: Date.now(),
        })
      )

      setLocation({
        ...newLocation,
        error: null,
        loading: false,
      })
    } catch (error) {
      setLocation({
        ...DEFAULT_LOCATION,
        loading: false,
      })
    }
  }

  return { ...location, refresh }
}





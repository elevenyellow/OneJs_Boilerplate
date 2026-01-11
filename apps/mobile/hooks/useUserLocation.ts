import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState, useEffect, useCallback } from 'react'
import { useLocation } from './useLocation'
import { loadLocation, saveLocation } from '@/utils/filterStorage'

export interface CustomLocation {
  lat: number
  lon: number
  name: string
}

interface UserLocationState {
  latitude: number | null
  longitude: number | null
  locationName: string
  isCustomLocation: boolean
  loading: boolean
  error: string | null
}

const CUSTOM_LOCATION_KEY = '@climb_zone:custom_location'

/**
 * Hook that combines GPS location with custom/manual location selection.
 * - If user has set a custom location, use that
 * - Otherwise, fall back to GPS location
 * - Provides methods to set custom location or reset to GPS
 */
export function useUserLocation() {
  const gpsLocation = useLocation()
  
  const [customLocation, setCustomLocation] = useState<CustomLocation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load custom location on mount
  useEffect(() => {
    async function loadCustomLocation() {
      try {
        const saved = await loadLocation()
        if (saved) {
          setCustomLocation({
            lat: saved.lat,
            lon: saved.lon,
            name: saved.name || 'Ubicación guardada',
          })
        }
      } catch (error) {
        console.error('[useUserLocation] Error loading custom location:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCustomLocation()
  }, [])

  /**
   * Set a custom location to use as search center
   */
  const setLocation = useCallback(async (location: CustomLocation) => {
    try {
      await saveLocation({
        lat: location.lat,
        lon: location.lon,
        name: location.name,
      })
      setCustomLocation(location)
      console.log('[useUserLocation] Custom location set:', location.name)
    } catch (error) {
      console.error('[useUserLocation] Error saving custom location:', error)
    }
  }, [])

  /**
   * Reset to GPS location (clear custom location)
   */
  const resetToGPS = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CUSTOM_LOCATION_KEY)
      // Also clear the filterStorage location
      await AsyncStorage.removeItem('@climb_zone:last_location')
      setCustomLocation(null)
      console.log('[useUserLocation] Reset to GPS location')
    } catch (error) {
      console.error('[useUserLocation] Error resetting to GPS:', error)
    }
  }, [])

  /**
   * Refresh GPS location
   */
  const refreshGPS = useCallback(async () => {
    if (!customLocation) {
      await gpsLocation.refresh()
    }
  }, [customLocation, gpsLocation])

  // Determine final location values
  const state: UserLocationState = {
    latitude: customLocation?.lat ?? gpsLocation.latitude,
    longitude: customLocation?.lon ?? gpsLocation.longitude,
    locationName: customLocation?.name ?? 'Tu ubicación',
    isCustomLocation: !!customLocation,
    loading: isLoading || (!customLocation && gpsLocation.loading),
    error: !customLocation ? gpsLocation.error : null,
  }

  return {
    ...state,
    setLocation,
    resetToGPS,
    refreshGPS,
    // Expose GPS location separately for reference
    gpsLocation: {
      latitude: gpsLocation.latitude,
      longitude: gpsLocation.longitude,
    },
  }
}

/**
 * Popular climbing zones for quick selection
 */
export const POPULAR_ZONES: CustomLocation[] = [
  { lat: 39.4699, lon: -0.3763, name: 'Valencia, España' },
  { lat: 41.3851, lon: 2.1734, name: 'Barcelona, España' },
  { lat: 40.4168, lon: -3.7038, name: 'Madrid, España' },
  { lat: 36.7213, lon: -4.4214, name: 'Málaga, España' },
  { lat: 43.2630, lon: -2.9350, name: 'Bilbao, España' },
  { lat: 37.1773, lon: -3.5986, name: 'Granada, España' },
  { lat: 38.3452, lon: -0.4810, name: 'Alicante, España' },
  { lat: 41.6488, lon: -0.8891, name: 'Zaragoza, España' },
  { lat: 39.8628, lon: -4.0273, name: 'Toledo, España' },
  { lat: 42.8465, lon: -2.6724, name: 'Vitoria, España' },
  // International
  { lat: 44.1366, lon: 4.8077, name: 'Gorges du Verdon, Francia' },
  { lat: 45.9237, lon: 6.8694, name: 'Chamonix, Francia' },
  { lat: 46.5197, lon: 11.3553, name: 'Dolomitas, Italia' },
  { lat: 35.1400, lon: 25.0600, name: 'Kalymnos, Grecia' },
]

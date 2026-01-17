import * as Location from 'expo-location'
import { devLog } from '@/utils/logger'

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

export interface LocationPermissionStatus {
  granted: boolean
  canAskAgain: boolean
}

/**
 * Request GPS location permissions
 * @returns Permission status object
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status, canAskAgain } =
      await Location.requestForegroundPermissionsAsync()

    return {
      granted: status === 'granted',
      canAskAgain,
    }
  } catch (error) {
    devLog.error('Error requesting location permission:', error)
    return {
      granted: false,
      canAskAgain: false,
    }
  }
}

/**
 * Get current location permission status (without requesting)
 * @returns Permission status object
 */
export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  try {
    const { status, canAskAgain } =
      await Location.getForegroundPermissionsAsync()

    return {
      granted: status === 'granted',
      canAskAgain,
    }
  } catch (error) {
    devLog.error('Error checking location permission:', error)
    return {
      granted: false,
      canAskAgain: false,
    }
  }
}

/**
 * Get current user location with timeout and fallback to last known position
 * @param options Optional configuration for location request
 * @param timeoutMs Timeout in milliseconds (default: 15000ms)
 * @returns User location
 * @throws Error if location permission not granted, services disabled, or timeout
 */
export async function getCurrentLocation(
  options?: Location.LocationOptions,
  timeoutMs = 15000,
): Promise<UserLocation> {
  // Check if we have permission
  const permission = await getLocationPermissionStatus()

  if (!permission.granted) {
    devLog.warn('📍 Location permission not granted')
    throw new Error('Location permission not granted')
  }

  // Check if location services are enabled
  const servicesEnabled = await Location.hasServicesEnabledAsync()
  if (!servicesEnabled) {
    devLog.warn('📍 Location services disabled')
    throw new Error('Location services disabled')
  }

  devLog.log('📍 Requesting current position...')

  // Try to get last known position first (instant, no GPS required)
  try {
    const lastKnown = await Location.getLastKnownPositionAsync()
    if (lastKnown) {
      const ageMs = Date.now() - lastKnown.timestamp
      const ageMinutes = Math.floor(ageMs / 60000)
      devLog.log(`📍 Last known position available (${ageMinutes} min old)`)

      // If last known is less than 5 minutes old, use it immediately
      if (ageMs < 5 * 60 * 1000) {
        devLog.log('📍 Using recent last known position')
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy ?? undefined,
          timestamp: lastKnown.timestamp,
        }
      }
    }
  } catch {
    devLog.log('📍 No last known position available')
  }

  // Get current location with timeout
  const locationPromise = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    ...options,
  })

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Location request timeout')), timeoutMs)
  })

  try {
    const location = await Promise.race([locationPromise, timeoutPromise])

    devLog.log(
      '📍 Got location:',
      location.coords.latitude,
      location.coords.longitude,
    )

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
      timestamp: location.timestamp,
    }
  } catch (error) {
    // If getCurrentPosition times out, try last known as fallback
    devLog.warn('📍 Current position timed out, trying last known as fallback')
    const lastKnown = await Location.getLastKnownPositionAsync()

    if (lastKnown) {
      devLog.log('📍 Using last known position as fallback')
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
        accuracy: lastKnown.coords.accuracy ?? undefined,
        timestamp: lastKnown.timestamp,
      }
    }

    // No fallback available, throw the original error
    throw error
  }
}

/**
 * Check if location services are enabled on the device
 */
export async function isLocationEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync()
  } catch (error) {
    devLog.error('Error checking location services:', error)
    return false
  }
}

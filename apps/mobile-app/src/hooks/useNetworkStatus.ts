/**
 * useNetworkStatus Hook
 * React hook for accessing network state and pending offline requests
 */

import { useCallback, useEffect, useState } from 'react'
import {
  networkMonitor,
  offlineQueue,
  type NetworkState,
} from '@/services/network'

/**
 * Network status information for UI components
 */
export interface NetworkStatus {
  /** Whether the device is connected to the internet */
  isOnline: boolean
  /** Connection type (wifi, cellular, etc.) */
  connectionType: string
  /** Number of requests waiting to be sent */
  pendingRequests: number
  /** Force refresh network state */
  refresh: () => Promise<void>
}

/**
 * Hook to access current network state
 *
 * Features:
 * - Real-time connection status updates
 * - Pending offline request count
 * - Connection type information
 *
 * @returns Network status object
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, pendingRequests } = useNetworkStatus()
 *
 *   if (!isOnline) {
 *     return <OfflineBanner pending={pendingRequests} />
 *   }
 *
 *   return <MainContent />
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkState, setNetworkState] = useState<NetworkState>(() => ({
    isConnected: networkMonitor.isOnline,
    isInternetReachable: networkMonitor.isOnline,
    connectionType: networkMonitor.connectionType,
  }))

  const [pendingRequests, setPendingRequests] = useState<number>(
    () => offlineQueue.pendingCount,
  )

  // Subscribe to network state changes
  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe((state) => {
      setNetworkState(state)
    })

    return unsubscribe
  }, [])

  // Poll pending requests count (queue doesn't have events)
  useEffect(() => {
    // Update immediately
    setPendingRequests(offlineQueue.pendingCount)

    // Poll every 2 seconds while component is mounted
    const intervalId = setInterval(() => {
      setPendingRequests(offlineQueue.pendingCount)
    }, 2000)

    return () => clearInterval(intervalId)
  }, [])

  // Refresh function
  const refresh = useCallback(async () => {
    await networkMonitor.refresh()
    setPendingRequests(offlineQueue.pendingCount)
  }, [])

  // Compute isOnline from state
  const isOnline =
    networkState.isConnected && networkState.isInternetReachable !== false

  return {
    isOnline,
    connectionType: networkState.connectionType,
    pendingRequests,
    refresh,
  }
}

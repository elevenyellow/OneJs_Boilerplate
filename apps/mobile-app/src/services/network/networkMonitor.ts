/**
 * Network Monitor Service
 * Tracks device connectivity state and emits events on changes
 */

import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from '@react-native-community/netinfo'
import { devLog } from '@/utils/logger'

/**
 * Network state information
 */
export interface NetworkState {
  isConnected: boolean
  isInternetReachable: boolean | null
  connectionType: string
}

/**
 * Callback type for network state changes
 */
export type NetworkStateCallback = (state: NetworkState) => void

/**
 * Network Monitor singleton
 * Manages connection state and notifies subscribers of changes
 */
class NetworkMonitorService {
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
  }

  private subscribers: Set<NetworkStateCallback> = new Set()
  private netInfoSubscription: NetInfoSubscription | null = null
  private initialized = false

  /**
   * Initialize the network monitor
   * Call this once when the app starts
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    devLog.log('🌐 [NetworkMonitor] Initializing...')

    try {
      // Get initial state
      const state = await NetInfo.fetch()
      this.updateState(state)

      // Subscribe to changes
      this.netInfoSubscription = NetInfo.addEventListener((state) => {
        this.updateState(state)
      })

      this.initialized = true
      devLog.log('✅ [NetworkMonitor] Initialized:', this.currentState)
    } catch (error) {
      devLog.error('❌ [NetworkMonitor] Failed to initialize:', error)
      // Assume connected if we can't determine state
      this.currentState = {
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'unknown',
      }
    }
  }

  /**
   * Update internal state and notify subscribers
   */
  private updateState(netInfoState: NetInfoState): void {
    const newState: NetworkState = {
      isConnected: netInfoState.isConnected ?? false,
      isInternetReachable: netInfoState.isInternetReachable,
      connectionType: netInfoState.type,
    }

    const wasOnline = this.isOnline
    this.currentState = newState
    const isNowOnline = this.isOnline

    // Log state changes
    if (wasOnline !== isNowOnline) {
      devLog.log(
        `🌐 [NetworkMonitor] Connection ${isNowOnline ? 'restored' : 'lost'}:`,
        newState,
      )
    }

    // Notify all subscribers
    this.subscribers.forEach((callback) => {
      try {
        callback(newState)
      } catch (error) {
        devLog.error('❌ [NetworkMonitor] Subscriber error:', error)
      }
    })
  }

  /**
   * Check if device is online (connected and internet reachable)
   */
  get isOnline(): boolean {
    return (
      this.currentState.isConnected &&
      this.currentState.isInternetReachable !== false
    )
  }

  /**
   * Get current connection type (wifi, cellular, etc.)
   */
  get connectionType(): string {
    return this.currentState.connectionType
  }

  /**
   * Get full network state
   */
  get state(): NetworkState {
    return { ...this.currentState }
  }

  /**
   * Subscribe to network state changes
   * Returns unsubscribe function
   */
  subscribe(callback: NetworkStateCallback): () => void {
    this.subscribers.add(callback)

    // Immediately call with current state
    callback(this.currentState)

    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Force refresh network state
   */
  async refresh(): Promise<NetworkState> {
    try {
      const state = await NetInfo.fetch()
      this.updateState(state)
    } catch (error) {
      devLog.error('❌ [NetworkMonitor] Failed to refresh:', error)
    }
    return this.currentState
  }

  /**
   * Cleanup subscriptions
   * Call when app is terminating
   */
  cleanup(): void {
    if (this.netInfoSubscription) {
      this.netInfoSubscription()
      this.netInfoSubscription = null
    }
    this.subscribers.clear()
    this.initialized = false
    devLog.log('🌐 [NetworkMonitor] Cleaned up')
  }
}

/**
 * Singleton instance
 */
export const networkMonitor = new NetworkMonitorService()

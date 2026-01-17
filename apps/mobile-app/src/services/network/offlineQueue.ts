/**
 * Offline Queue Service
 * Queues failed requests when offline and retries when connection is restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { devLog } from '@/utils/logger'
import { networkMonitor } from './networkMonitor'

/**
 * Queued request structure
 */
export interface QueuedRequest {
  id: string
  method: string
  endpoint: string
  body?: unknown
  headers?: Record<string, string>
  createdAt: number
  retryCount: number
}

/**
 * Result of processing a queued request
 */
interface ProcessResult {
  success: boolean
  error?: string
}

/**
 * Callback for processing a request
 */
type RequestProcessor = (request: QueuedRequest) => Promise<ProcessResult>

const QUEUE_STORAGE_KEY = '@climb_app:offline_queue'
const MAX_QUEUE_SIZE = 50
const MAX_RETRY_COUNT = 5
const QUEUE_ITEM_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Offline Queue Manager
 * Persists failed requests and processes them when back online
 */
class OfflineQueueService {
  private queue: QueuedRequest[] = []
  private isProcessing = false
  private requestProcessor: RequestProcessor | null = null
  private unsubscribeNetwork: (() => void) | null = null
  private initialized = false

  /**
   * Initialize the offline queue
   * Loads persisted queue and sets up network listener
   */
  async initialize(processor: RequestProcessor): Promise<void> {
    if (this.initialized) {
      return
    }

    devLog.log('📦 [OfflineQueue] Initializing...')

    this.requestProcessor = processor

    // Load persisted queue
    await this.loadQueue()

    // Clean expired items
    this.cleanExpiredItems()

    // Listen for network changes
    this.unsubscribeNetwork = networkMonitor.subscribe((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        this.processQueue()
      }
    })

    this.initialized = true
    devLog.log(
      '✅ [OfflineQueue] Initialized with',
      this.queue.length,
      'pending requests',
    )
  }

  /**
   * Add a request to the queue
   */
  async enqueue(
    request: Omit<QueuedRequest, 'id' | 'createdAt' | 'retryCount'>,
  ): Promise<void> {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      devLog.warn('⚠️ [OfflineQueue] Queue full, removing oldest item')
      this.queue.shift()
    }

    const queuedRequest: QueuedRequest = {
      ...request,
      id: generateId(),
      createdAt: Date.now(),
      retryCount: 0,
    }

    this.queue.push(queuedRequest)
    await this.persistQueue()

    devLog.log('📦 [OfflineQueue] Enqueued request:', {
      id: queuedRequest.id,
      method: queuedRequest.method,
      endpoint: queuedRequest.endpoint,
      queueSize: this.queue.length,
    })
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    if (
      this.isProcessing ||
      this.queue.length === 0 ||
      !this.requestProcessor
    ) {
      return
    }

    if (!networkMonitor.isOnline) {
      devLog.log('📦 [OfflineQueue] Still offline, skipping queue processing')
      return
    }

    this.isProcessing = true
    devLog.log(
      '📦 [OfflineQueue] Processing',
      this.queue.length,
      'queued requests',
    )

    const processedIds: string[] = []
    const failedRequests: QueuedRequest[] = []

    for (const request of this.queue) {
      try {
        const result = await this.requestProcessor(request)

        if (result.success) {
          processedIds.push(request.id)
          devLog.log('✅ [OfflineQueue] Successfully processed:', request.id)
        } else {
          request.retryCount++

          if (request.retryCount >= MAX_RETRY_COUNT) {
            devLog.warn(
              '⚠️ [OfflineQueue] Max retries reached, discarding:',
              request.id,
            )
            processedIds.push(request.id)
          } else {
            failedRequests.push(request)
            devLog.log(
              '🔄 [OfflineQueue] Will retry later:',
              request.id,
              `(attempt ${request.retryCount})`,
            )
          }
        }
      } catch (error) {
        devLog.error(
          '❌ [OfflineQueue] Error processing request:',
          request.id,
          error,
        )
        request.retryCount++

        if (request.retryCount < MAX_RETRY_COUNT) {
          failedRequests.push(request)
        } else {
          processedIds.push(request.id)
        }
      }
    }

    // Update queue with remaining failed requests
    this.queue = failedRequests
    await this.persistQueue()

    this.isProcessing = false

    devLog.log('📦 [OfflineQueue] Processing complete:', {
      processed: processedIds.length,
      remaining: this.queue.length,
    })
  }

  /**
   * Get number of pending requests
   */
  get pendingCount(): number {
    return this.queue.length
  }

  /**
   * Get all pending requests (read-only)
   */
  get pendingRequests(): readonly QueuedRequest[] {
    return [...this.queue]
  }

  /**
   * Clear all queued requests
   */
  async clear(): Promise<void> {
    this.queue = []
    await this.persistQueue()
    devLog.log('📦 [OfflineQueue] Cleared all queued requests')
  }

  /**
   * Remove a specific request from queue
   */
  async remove(requestId: string): Promise<void> {
    this.queue = this.queue.filter((r) => r.id !== requestId)
    await this.persistQueue()
  }

  /**
   * Load queue from persistent storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      devLog.error('❌ [OfflineQueue] Failed to load queue:', error)
      this.queue = []
    }
  }

  /**
   * Save queue to persistent storage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      devLog.error('❌ [OfflineQueue] Failed to persist queue:', error)
    }
  }

  /**
   * Remove expired items from queue
   */
  private cleanExpiredItems(): void {
    const now = Date.now()
    const originalLength = this.queue.length

    this.queue = this.queue.filter(
      (request) => now - request.createdAt < QUEUE_ITEM_EXPIRY_MS,
    )

    if (this.queue.length < originalLength) {
      devLog.log(
        '📦 [OfflineQueue] Cleaned',
        originalLength - this.queue.length,
        'expired items',
      )
      this.persistQueue()
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork()
      this.unsubscribeNetwork = null
    }
    this.requestProcessor = null
    this.initialized = false
    devLog.log('📦 [OfflineQueue] Cleaned up')
  }
}

/**
 * Generate unique ID for queued request
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Singleton instance
 */
export const offlineQueue = new OfflineQueueService()

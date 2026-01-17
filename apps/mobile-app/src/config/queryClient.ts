import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query Client Configuration
 * Manages server state caching and refetching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 1 * 60 * 1000, // 1 minute - data considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time (previously cacheTime)

      // Retry configuration
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,

      // Network error handling
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      // Retry configuration for mutations
      retry: 1,
      networkMode: 'online',
    },
  },
})

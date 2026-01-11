import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

/**
 * Configuración optimizada de React Query con:
 * - Caché persistente en AsyncStorage
 * - Estrategia aggressive de caché para reducir llamadas API
 * - Configuración offline-first
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes - considerar datos frescos
      staleTime: 5 * 60 * 1000,
      
      // Keep data in cache for 24 hours
      gcTime: 24 * 60 * 60 * 1000,
      
      // Don't refetch when window regains focus (reduce API calls)
      refetchOnWindowFocus: false,
      
      // Don't refetch when component mounts if we have cached data
      refetchOnMount: false,
      
      // Retry only once on error (faster failure)
      retry: 1,
      
      // Use cached data first, then network (offline-first approach)
      networkMode: 'offlineFirst',
    },
  },
})

/**
 * Persister para guardar datos de React Query en AsyncStorage
 * Esto permite que los datos sobrevivan entre sesiones de la app
 * 
 * NOTA: Excluimos ciertas queries grandes para evitar el error
 * "Row too big to fit into CursorWindow" en Android
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'climb-zone-cache-v2', // Bumped version to clear old cache
  throttleTime: 1000, // Guardar cambios cada 1 segundo
})

/**
 * Filtro para determinar qué queries se persisten en AsyncStorage
 * Excluimos queries grandes que pueden causar errores en Android SQLite
 */
export const shouldDehydrateQuery = (query: { queryKey: readonly unknown[] }) => {
  const key = query.queryKey
  
  // Don't persist crag detail queries (too large with routes, topos, weather)
  if (key[0] === 'crag' && typeof key[1] === 'string') {
    return false
  }
  
  // Don't persist sector search results (can be large)
  if (key[0] === 'sectors' && key[1] === 'search') {
    return false
  }
  
  // Persist everything else
  return true
}

/**
 * Invalida selectivamente queries específicas
 */
export const invalidateSearchQueries = () => {
  queryClient.invalidateQueries({ queryKey: ['sectors', 'search'] })
}

export const invalidateLocationQueries = () => {
  queryClient.invalidateQueries({ queryKey: ['location'] })
}

/**
 * Limpia toda la caché (útil para debugging)
 */
export const clearCache = async () => {
  await queryClient.clear()
  await AsyncStorage.removeItem('climb-zone-cache-v1')
  await AsyncStorage.removeItem('climb-zone-cache-v2')
  console.log('[QueryClient] Cache cleared')
}

/**
 * Limpia caches antiguos para evitar errores de migración
 */
export const cleanupOldCache = async () => {
  try {
    // Remove old cache version that might have large data
    await AsyncStorage.removeItem('climb-zone-cache-v1')
    console.log('[QueryClient] Old cache cleaned up')
  } catch (error) {
    console.warn('[QueryClient] Failed to cleanup old cache:', error)
  }
}

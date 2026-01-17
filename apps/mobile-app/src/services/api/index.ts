/**
 * API Services
 * Exports for all API-related functionality
 */

// Core client
export { apiClient } from './apiClient'
export type { RequestOptions } from './apiClient'

// Error handling
export { ApiError, isApiError } from './errors'
export type { ApiErrorCode } from './errors'

// Domain APIs
export { zoneApi } from './zoneApi'
export {
  getCragOverviewWithSectors,
  getSectorRoutes,
  getCragRoutes,
} from './sectorApi'
export { searchCrags } from './cragSearch'
export { createAscent, getUserAscents } from './ascents'

// Transformers
export { transformCragsToSectors, scoredCragToSectorUI } from './transformers'

import { useMemo } from 'react'

interface UseSearchFilterOptions<T extends object> {
  /**
   * The items to filter
   */
  items: T[]

  /**
   * The current search query
   */
  query: string

  /**
   * The field to search on (supports nested paths with dots, e.g., 'user.name')
   * @default 'name'
   */
  searchField?: string

  /**
   * Whether to return empty array when query is empty
   * @default false (returns all items when query is empty)
   */
  requireQuery?: boolean

  /**
   * Custom filter function for more complex filtering
   * If provided, overrides the default field-based search
   */
  filterFn?: (item: T, query: string) => boolean
}

interface UseSearchFilterResult<T> {
  /**
   * The filtered items
   */
  filteredItems: T[]

  /**
   * Whether there is an active search query
   */
  hasQuery: boolean

  /**
   * The trimmed and lowercased query
   */
  normalizedQuery: string
}

/**
 * Get a nested property value from an object using dot notation
 */
function getNestedValue(obj: object, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object'
      ? (current as Record<string, unknown>)[key]
      : undefined
  }, obj as unknown)
}

/**
 * Hook to filter items by a search query.
 *
 * Provides client-side filtering with case-insensitive substring matching.
 * Supports both simple field-based search and custom filter functions.
 *
 * @example
 * // Basic usage - filter by 'name' field
 * const { filteredItems } = useSearchFilter({
 *   items: sectors,
 *   query: searchQuery,
 * })
 *
 * @example
 * // Return empty when no query
 * const { filteredItems } = useSearchFilter({
 *   items: sectors,
 *   query: searchQuery,
 *   requireQuery: true,
 * })
 *
 * @example
 * // Custom filter function
 * const { filteredItems } = useSearchFilter({
 *   items: sectors,
 *   query: searchQuery,
 *   filterFn: (item, q) =>
 *     item.name.toLowerCase().includes(q) ||
 *     item.location.toLowerCase().includes(q),
 * })
 */
export function useSearchFilter<T extends object>({
  items,
  query,
  searchField = 'name',
  requireQuery = false,
  filterFn,
}: UseSearchFilterOptions<T>): UseSearchFilterResult<T> {
  const normalizedQuery = query.trim().toLowerCase()
  const hasQuery = normalizedQuery.length > 0

  const filteredItems = useMemo(() => {
    // If no query and requireQuery is true, return empty array
    if (!hasQuery) {
      return requireQuery ? [] : items
    }

    // Use custom filter function if provided
    if (filterFn) {
      return items.filter((item) => filterFn(item, normalizedQuery))
    }

    // Default field-based filtering
    return items.filter((item) => {
      const value = getNestedValue(item, searchField)
      if (typeof value !== 'string') return false
      return value.toLowerCase().includes(normalizedQuery)
    })
  }, [items, normalizedQuery, hasQuery, requireQuery, filterFn, searchField])

  return {
    filteredItems,
    hasQuery,
    normalizedQuery,
  }
}

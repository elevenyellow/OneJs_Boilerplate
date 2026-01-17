import { useState, useCallback } from 'react'
import type {
  SearchFiltersValues,
  SortOption,
  ExplorerSearchParams,
} from '@/components/explorer'
import type { SectorUI } from '@/types/ui'

interface UseExplorerFiltersOptions {
  updateSearchParams: (params: Partial<ExplorerSearchParams>) => void
}

interface UseExplorerFiltersResult {
  sortBy: SortOption
  isSearchMode: boolean
  searchQuery: string
  showFiltersModal: boolean
  handleSortChange: (newSort: SortOption) => void
  handleToggleSearch: () => void
  handleCloseSearch: () => void
  handleOpenFilters: () => void
  handleCloseFilters: () => void
  handleApplyFilters: (filters: SearchFiltersValues) => void
  handleQuickFilterChange: (updates: Partial<ExplorerSearchParams>) => void
  setSearchQuery: (query: string) => void
  getSortedSectors: (sectors: SectorUI[]) => SectorUI[]
  getSearchFilteredSectors: (sortedSectors: SectorUI[]) => SectorUI[]
}

export function useExplorerFilters({
  updateSearchParams,
}: UseExplorerFiltersOptions): UseExplorerFiltersResult {
  const [sortBy, setSortBy] = useState<SortOption>('bestMatch')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort)
  }, [])

  const handleToggleSearch = useCallback(() => {
    setIsSearchMode((prev) => {
      if (prev) {
        // Closing search - clear query
        setSearchQuery('')
      }
      return !prev
    })
  }, [])

  const handleCloseSearch = useCallback(() => {
    setIsSearchMode(false)
    setSearchQuery('')
  }, [])

  const handleOpenFilters = useCallback(() => {
    setShowFiltersModal(true)
  }, [])

  const handleCloseFilters = useCallback(() => {
    setShowFiltersModal(false)
  }, [])

  const handleApplyFilters = useCallback(
    (filters: SearchFiltersValues) => {
      updateSearchParams({
        radiusKm: filters.radiusKm,
        minGradeBand: filters.minGradeBand,
        maxGradeBand: filters.maxGradeBand,
        exposurePreference: filters.exposurePreference,
        climbingStyles: filters.climbingStyles,
        minQualityRating: filters.minQualityRating,
      })
      setShowFiltersModal(false)
    },
    [updateSearchParams],
  )

  const handleQuickFilterChange = useCallback(
    (updates: Partial<ExplorerSearchParams>) => {
      updateSearchParams(updates)
    },
    [updateSearchParams],
  )

  const getSortedSectors = useCallback(
    (sectors: SectorUI[]) => {
      return [...sectors].sort((a, b) => {
        switch (sortBy) {
          case 'bestMatch':
            return (b.totalScore ?? 0) - (a.totalScore ?? 0)
          case 'distance':
            return (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
          case 'quality':
            return (b.qualityRating ?? 0) - (a.qualityRating ?? 0)
          case 'popularity':
            return (b.popularityScore ?? 0) - (a.popularityScore ?? 0)
          case 'routeCount':
            return (b.routeCount ?? 0) - (a.routeCount ?? 0)
          case 'name':
            return a.name.localeCompare(b.name)
          default:
            return 0
        }
      })
    },
    [sortBy],
  )

  const getSearchFilteredSectors = useCallback(
    (sortedSectors: SectorUI[]) => {
      const trimmedQuery = searchQuery?.trim()?.toLowerCase() || ''
      if (!trimmedQuery) return sortedSectors

      return sortedSectors.filter((sector) =>
        sector.name.toLowerCase().includes(trimmedQuery),
      )
    },
    [searchQuery],
  )

  return {
    sortBy,
    isSearchMode,
    searchQuery,
    showFiltersModal,
    handleSortChange,
    handleToggleSearch,
    handleCloseSearch,
    handleOpenFilters,
    handleCloseFilters,
    handleApplyFilters,
    handleQuickFilterChange,
    setSearchQuery,
    getSortedSectors,
    getSearchFilteredSectors,
  }
}

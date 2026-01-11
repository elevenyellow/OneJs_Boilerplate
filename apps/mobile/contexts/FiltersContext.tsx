import { loadFilters, saveFilters, type StoredFilters } from '@/utils/filterStorage'
import { gradeToIndex } from '@/utils/gradeConverter'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Grade range type
 */
export interface GradeRange {
  min: string
  max: string
}

/**
 * Global filters state
 */
export interface GlobalFilters {
  gradeRange: GradeRange
  maxDistance?: number
  forceOrientation?: 'sun' | 'shade' | 'any'
  minRoutes?: number
  hasTopo?: boolean
}

/**
 * Context value interface
 */
interface FiltersContextValue {
  // Current grade range
  gradeRange: GradeRange
  
  // All filters
  filters: GlobalFilters
  
  // Update just the grade range (most common operation)
  setGradeRange: (range: GradeRange) => void
  
  // Update all filters
  setFilters: (filters: Partial<GlobalFilters>) => void
  
  // Check if a grade index is within user's range
  isGradeInRange: (gradeIndex: number | null) => boolean
  
  // Show/hide the grade picker modal
  showGradePicker: () => void
  hideGradePicker: () => void
  isGradePickerVisible: boolean
  
  // Loading state
  isLoading: boolean
}

const defaultGradeRange: GradeRange = { min: '5c', max: '6c' }

const defaultFilters: GlobalFilters = {
  gradeRange: defaultGradeRange,
  maxDistance: 100,
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

/**
 * FiltersProvider - Wraps the app to provide global filter state
 */
export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(defaultFilters)
  const [isGradePickerVisible, setIsGradePickerVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load saved filters on mount
  useEffect(() => {
    loadFilters().then((stored) => {
      if (stored) {
        setFiltersState({
          ...defaultFilters,
          ...stored,
          gradeRange: stored.gradeRange || defaultGradeRange,
        })
      }
      setIsLoading(false)
    })
  }, [])

  // Save filters whenever they change
  const setFilters = useCallback((newFilters: Partial<GlobalFilters>) => {
    setFiltersState((prev) => {
      const updated = { ...prev, ...newFilters }
      // Save to storage (async, fire and forget)
      saveFilters(updated as StoredFilters)
      return updated
    })
  }, [])

  // Convenience method for just updating grade range
  const setGradeRange = useCallback((range: GradeRange) => {
    setFilters({ gradeRange: range })
  }, [setFilters])

  // Check if a grade index is within user's selected range
  const isGradeInRange = useCallback((gradeIndex: number | null): boolean => {
    if (gradeIndex === null) return false
    
    const minIndex = gradeToIndex(filters.gradeRange.min)
    const maxIndex = gradeToIndex(filters.gradeRange.max)
    
    if (minIndex === null || maxIndex === null) return true // Can't determine, show as in range
    
    return gradeIndex >= minIndex && gradeIndex <= maxIndex
  }, [filters.gradeRange])

  const showGradePicker = useCallback(() => setIsGradePickerVisible(true), [])
  const hideGradePicker = useCallback(() => setIsGradePickerVisible(false), [])

  const value = useMemo<FiltersContextValue>(() => ({
    gradeRange: filters.gradeRange,
    filters,
    setGradeRange,
    setFilters,
    isGradeInRange,
    showGradePicker,
    hideGradePicker,
    isGradePickerVisible,
    isLoading,
  }), [filters, setGradeRange, setFilters, isGradeInRange, showGradePicker, hideGradePicker, isGradePickerVisible, isLoading])

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  )
}

/**
 * Hook to access global filters
 */
export function useFilters(): FiltersContextValue {
  const context = useContext(FiltersContext)
  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider')
  }
  return context
}

/**
 * Hook specifically for grade range (convenience)
 */
export function useGradeRange() {
  const { gradeRange, setGradeRange, isGradeInRange, showGradePicker } = useFilters()
  return { gradeRange, setGradeRange, isGradeInRange, showGradePicker }
}

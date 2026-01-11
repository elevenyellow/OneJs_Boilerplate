/**
 * Performance monitoring utilities for ClimbZone
 * Ayuda a medir y monitorear el rendimiento de la app
 */

export const perfLog = {
  /**
   * Inicia un marcador de performance
   */
  start: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`)
    }
    console.log(`[Perf] ⏱️  ${label} - Started`)
  },

  /**
   * Finaliza un marcador y muestra el tiempo transcurrido
   */
  end: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`)
      try {
        performance.measure(label, `${label}-start`, `${label}-end`)
        const measure = performance.getEntriesByName(label)[0]
        console.log(`[Perf] ✅ ${label}: ${measure.duration.toFixed(2)}ms`)
      } catch (e) {
        console.log(`[Perf] ✅ ${label} - Completed`)
      }
    } else {
      console.log(`[Perf] ✅ ${label} - Completed`)
    }
  },

  /**
   * Mide el tiempo de ejecución de una función async
   */
  measure: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    perfLog.start(label)
    try {
      const result = await fn()
      perfLog.end(label)
      return result
    } catch (error) {
      console.log(`[Perf] ❌ ${label} - Failed`)
      throw error
    }
  },
}

/**
 * Hook para medir el tiempo de montaje de un componente
 */
export const usePerformanceMonitor = (componentName: string) => {
  if (__DEV__) {
    // Solo en desarrollo
    console.log(`[Perf] 🎨 ${componentName} - Rendering`)
  }
}

/**
 * Muestra un resumen de todas las mediciones
 */
export const showPerformanceSummary = () => {
  if (typeof performance !== 'undefined') {
    const measures = performance.getEntriesByType('measure')

    if (measures.length === 0) {
      console.log('[Perf] No measurements available')
      return
    }

    console.log('\n=== Performance Summary ===')
    measures.forEach((measure) => {
      console.log(`  ${measure.name}: ${measure.duration.toFixed(2)}ms`)
    })
    console.log('===========================\n')
  }
}

/**
 * Limpia todas las mediciones
 */
export const clearPerformanceData = () => {
  if (typeof performance !== 'undefined') {
    performance.clearMarks()
    performance.clearMeasures()
    console.log('[Perf] 🧹 Performance data cleared')
  }
}

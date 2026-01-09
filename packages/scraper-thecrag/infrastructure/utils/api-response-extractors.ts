/**
 * Helper functions para procesar campos de apiResponseRaw
 */

/**
 * Extrae averageHeight del formato TheCrag [valor, unidad]
 * Ejemplo: [17, "m"] → 17
 */
export function extractAverageHeight(data: unknown): number | null {
  if (!data) return null
  
  if (Array.isArray(data) && data.length >= 1) {
    const value = Number(data[0])
    return isNaN(value) ? null : value
  }
  
  if (typeof data === 'number') return data
  if (typeof data === 'string') {
    const value = parseFloat(data)
    return isNaN(value) ? null : value
  }
  
  return null
}

/**
 * Extrae redirectStubs (array de strings)
 */
export function extractRedirectStubs(data: unknown): string[] {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.filter(item => typeof item === 'string')
  }
  return []
}

/**
 * Extrae tlc (Top Level Crag) object
 */
export function extractTlc(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  return data as Record<string, unknown>
}

/**
 * Extrae numberRoutes
 */
export function extractNumberRoutes(data: unknown): number | null {
  if (data === null || data === undefined) return null
  const num = Number(data)
  return isNaN(num) ? null : num
}

/**
 * Extrae subAreaCount
 */
export function extractSubAreaCount(data: unknown): number | null {
  if (data === null || data === undefined) return null
  const num = Number(data)
  return isNaN(num) ? null : num
}

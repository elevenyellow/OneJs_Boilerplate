/**
 * Extrae la orientación de un texto (descripción, beta, etc.)
 * Busca patrones como "orientación norte", "south-facing", "cara este", etc.
 */
export function extractOrientationFromText(text: string): string[] | null {
  if (!text) return null

  const lowerText = text.toLowerCase()
  const orientations: Set<string> = new Set()

  // Patrones en español
  const spanishPatterns = [
    /orientaci[oó]n\s+(norte|sur|este|oeste|n|s|e|o|noreste|noroeste|sureste|suroeste|ne|no|se|so)/gi,
    /mira\s+(?:al\s+|hacia\s+el\s+)?(norte|sur|este|oeste)/gi,
    /cara\s+(norte|sur|este|oeste|noreste|noroeste|sureste|suroeste)/gi,
    /exposici[oó]n\s+(norte|sur|este|oeste)/gi,
    /pared\s+(norte|sur|este|oeste)/gi,
  ]

  // Patrones en inglés
  const englishPatterns = [
    /(north|south|east|west|northeast|northwest|southeast|southwest)[\s-]facing/gi,
    /facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/gi,
    /(north|south|east|west)[\s-](?:oriented|exposure)/gi,
  ]

  // Mapeo de direcciones españolas a códigos
  const spanishMapping: Record<string, string> = {
    norte: 'N',
    sur: 'S',
    este: 'E',
    oeste: 'W',
    noreste: 'NE',
    noroeste: 'NW',
    sureste: 'SE',
    suroeste: 'SW',
    n: 'N',
    s: 'S',
    e: 'E',
    o: 'W',
    ne: 'NE',
    no: 'NW',
    se: 'SE',
    so: 'SW',
  }

  // Mapeo de direcciones inglesas a códigos
  const englishMapping: Record<string, string> = {
    north: 'N',
    south: 'S',
    east: 'E',
    west: 'W',
    northeast: 'NE',
    northwest: 'NW',
    southeast: 'SE',
    southwest: 'SW',
  }

  // Buscar patrones españoles
  for (const pattern of spanishPatterns) {
    const matches = lowerText.matchAll(pattern)
    for (const match of matches) {
      const direction = match[1]?.toLowerCase()
      if (direction && spanishMapping[direction]) {
        orientations.add(spanishMapping[direction])
      }
    }
  }

  // Buscar patrones ingleses
  for (const pattern of englishPatterns) {
    const matches = lowerText.matchAll(pattern)
    for (const match of matches) {
      const direction = match[1]?.toLowerCase()
      if (direction && englishMapping[direction]) {
        orientations.add(englishMapping[direction])
      }
    }
  }

  return orientations.size > 0 ? Array.from(orientations) : null
}

/**
 * Extrae orientación de los campos beta de un sector
 */
export function extractOrientationFromBeta(beta: unknown): string[] | null {
  if (!beta || !Array.isArray(beta)) return null

  const allOrientations: Set<string> = new Set()

  for (const item of beta) {
    if (item && typeof item === 'object' && 'markdown' in item) {
      const markdown = (item as any).markdown
      if (typeof markdown === 'string') {
        const orientations = extractOrientationFromText(markdown)
        if (orientations) {
          orientations.forEach((o) => allOrientations.add(o))
        }
      }
    }
  }

  return allOrientations.size > 0 ? Array.from(allOrientations) : null
}

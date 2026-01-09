import { CragEntity } from '@climb-zone/crag'
import { SectorEntity } from '@climb-zone/sector'
import { RouteEntity } from '@climb-zone/route'

/**
 * Text Generator Service
 * Generates rich text representations of climbing zones for semantic embeddings
 * Supports multilingual queries by including descriptive text in multiple languages
 */
export class TextGeneratorService {
  /**
   * Generate a comprehensive text representation of a crag
   * This text will be used to create a semantic embedding
   */
  generateCragText(
    crag: CragEntity,
    sectors: SectorEntity[],
    routes: RouteEntity[],
  ): string {
    const parts: string[] = []

    // Name and location
    parts.push(`Climbing zone ${crag.name.toString()}`)

    if (crag.altNames.toArray().length > 0) {
      parts.push(`Also known as: ${crag.altNames.toArray().join(', ')}`)
    }

    // Description
    if (crag.description) {
      parts.push(`Description: ${crag.description}`)
    }

    // Geographic location
    if (crag.latitude && crag.longitude) {
      parts.push(
        `Coordinates: ${crag.latitude.toFixed(4)}, ${crag.longitude.toFixed(4)}`,
      )
    }

    // Approach
    if (crag.approach) {
      parts.push(`Approach: ${crag.approach}`)
    }

    // Seasonality
    const bestMonths = crag.getBestMonths()
    if (bestMonths.length > 0) {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]
      const monthsText = bestMonths.map((m) => monthNames[m - 1]).join(', ')
      parts.push(`Best season for climbing: ${monthsText}`)
    }

    // Route statistics
    const totalRoutes = routes.length
    parts.push(`Total routes: ${totalRoutes}`)

    if (totalRoutes > 0) {
      // Grade distribution
      const grades = routes
        .map((r) => r.gradeString)
        .filter((g) => g !== null) as string[]

      if (grades.length > 0) {
        const sortedGrades = grades.sort()
        const minGrade = sortedGrades[0]
        const maxGrade = sortedGrades[sortedGrades.length - 1]
        parts.push(`Grade range: from ${minGrade} to ${maxGrade}`)

        // Most common grades
        const gradeCount = this.countGrades(grades)
        const topGrades = Object.entries(gradeCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([grade]) => grade)

        if (topGrades.length > 0) {
          parts.push(`Predominant grades: ${topGrades.join(', ')}`)
        }
      }

      // Climbing types
      const sportRoutes = routes.filter((r) => r.isSport()).length
      const multiPitchRoutes = routes.filter((r) => r.isMultiPitch()).length

      if (sportRoutes > 0) {
        parts.push(`${sportRoutes} bolted sport routes`)
      }
      if (multiPitchRoutes > 0) {
        parts.push(`${multiPitchRoutes} multi-pitch routes`)
      }
    }

    // Sector characteristics
    if (sectors.length > 0) {
      // Orientations
      const orientations = sectors
        .map((s) => s.orientation?.toString())
        .filter(Boolean) as string[]

      if (orientations.length > 0) {
        const uniqueOrientations = [...new Set(orientations)]
        parts.push(`Orientations: ${uniqueOrientations.join(', ')}`)
      }

      // Rock types
      const rockTypes = sectors
        .map((s) => s.rockType?.toString())
        .filter(Boolean) as string[]

      if (rockTypes.length > 0) {
        const uniqueRockTypes = [...new Set(rockTypes)]
        parts.push(`Rock type: ${uniqueRockTypes.join(', ')}`)
      }

      // Climbing styles
      const styles = sectors.flatMap((s) => s.climbingStyle.toArray()).filter(Boolean)

      if (styles.length > 0) {
        const uniqueStyles = [...new Set(styles)]
        parts.push(`Climbing styles: ${uniqueStyles.join(', ')}`)
      }

      // Sun exposure
      const shadedSectors = sectors.filter((s) => s.isShaded()).length
      if (shadedSectors > sectors.length / 2) {
        parts.push('Mostly shaded, good for summer')
      } else if (shadedSectors < sectors.length / 4) {
        parts.push('Very sunny, ideal for winter')
      }
    }

    // Popularity and quality
    if (crag.totalFavorites && crag.totalFavorites >= 50) {
      parts.push(`Popular zone with ${crag.totalFavorites} favorites`)
    }

    if (crag.kudos && crag.kudos.toNumber() >= 80) {
      parts.push('Highly rated by the climbing community')
    }

    // Facilities
    if (crag.hasPhotos()) {
      parts.push(`${crag.numberPhotos} photos available`)
    }

    if (crag.hasTopos()) {
      parts.push(`${crag.numberTopos} topos/route diagrams available`)
    }

    if (crag.requiresPermit()) {
      parts.push('Requires permit or authorization to climb')
    }

    // Ethics
    if (crag.ethic) {
      parts.push(`Ethics: ${crag.ethic}`)
    }

    return parts.join('. ') + '.'
  }

  /**
   * Generate a shorter text representation (for previews)
   */
  generateShortText(crag: CragEntity, routes: RouteEntity[]): string {
    const parts: string[] = []

    parts.push(crag.name.toString())

    if (routes.length > 0) {
      const grades = routes
        .map((r) => r.gradeString)
        .filter((g) => g !== null) as string[]

      if (grades.length > 0) {
        const sortedGrades = grades.sort()
        parts.push(`${grades.length} routes`)
        parts.push(`${sortedGrades[0]}-${sortedGrades[sortedGrades.length - 1]}`)
      }
    }

    if (crag.description) {
      const shortDesc = crag.description.substring(0, 100)
      parts.push(shortDesc)
    }

    return parts.join('. ')
  }

  /**
   * Count occurrences of each grade
   */
  private countGrades(grades: string[]): Record<string, number> {
    const count: Record<string, number> = {}
    for (const grade of grades) {
      count[grade] = (count[grade] || 0) + 1
    }
    return count
  }

  /**
   * Generate multilingual keywords for better semantic search
   */
  generateKeywords(
    crag: CragEntity,
    sectors: SectorEntity[],
    routes: RouteEntity[],
  ): string[] {
    const keywords: string[] = []

    // Location keywords
    keywords.push('climbing', 'escalada', 'sport climbing', 'escalada deportiva')

    // Route types
    if (routes.some((r) => r.isSport())) {
      keywords.push('sport', 'deportiva', 'bolted', 'equipada')
    }

    if (routes.some((r) => r.isMultiPitch())) {
      keywords.push('multi-pitch', 'varios largos', 'long routes', 'rutas largas')
    }

    // Rock characteristics
    const rockTypes = sectors
      .map((s) => s.rockType?.toString().toLowerCase())
      .filter(Boolean)

    if (rockTypes.includes('limestone')) {
      keywords.push('limestone', 'caliza', 'rock')
    }

    if (rockTypes.includes('granite')) {
      keywords.push('granite', 'granito')
    }

    // Styles
    const styles = sectors.flatMap((s) => s.climbingStyle.toArray())

    if (styles.includes('overhang') || styles.includes('roof')) {
      keywords.push('overhang', 'desplome', 'steep', 'inclinado')
    }

    if (styles.includes('slab') || styles.includes('vertical')) {
      keywords.push('slab', 'placa', 'vertical', 'face climbing')
    }

    return [...new Set(keywords)]
  }
}

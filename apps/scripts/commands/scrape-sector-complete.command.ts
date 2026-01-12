import { TheCragApiScraper } from '@scraper-thecrag'
import { NodeId } from '@scraper-thecrag/domain/value-objects/node-id.vo'

/**
 * Command to scrape a complete sector with all routes and their topo annotations.
 *
 * Usage:
 *   bun run:script scrape-sector-complete <sectorId> [--recursive]
 *
 * Examples:
 *   # Scrape a single sector with all its routes
 *   bun run:script scrape-sector-complete 1447606131
 *
 *   # Scrape a sector and all its sub-sectors recursively
 *   bun run:script scrape-sector-complete 1447606131 --recursive
 */
export async function scrapeSectorComplete(container: unknown, cookie: string) {
  const sectorIdArg = process.argv[3]
  const isRecursive = process.argv.includes('--recursive')

  if (!sectorIdArg) {
    console.error('❌ Usage: scrape-sector-complete <sectorId> [--recursive]')
    console.error('   Example: scrape-sector-complete 1447606131')
    process.exit(1)
  }

  const dic = container as { get: <T>(token: unknown) => T }
  const apiScraper = dic.get<TheCragApiScraper>(TheCragApiScraper)

  // Configure scraper
  apiScraper.setCookie(cookie)
  apiScraper.setDelay(200)

  console.log('🧗 SCRAPE SECTOR COMPLETE - Full sector with routes and topos')
  console.log('='.repeat(80))
  console.log('')
  console.log(`📍 Sector ID: ${sectorIdArg}`)
  console.log(`🔄 Recursive: ${isRecursive ? 'Yes' : 'No'}`)
  console.log('')

  const sectorId = NodeId.create(sectorIdArg)

  if (isRecursive) {
    // Scrape sector with all sub-sectors recursively
    console.log('🔍 Scraping sector with sub-sectors recursively...')
    console.log('')

    const sectors = await apiScraper.scrapeSectorWithSubSectors(sectorId, {
      maxDepth: 3,
      maxRoutesPerSector: 50, // Limit for demo purposes
    })

    console.log('')
    console.log('='.repeat(80))
    console.log(`✅ Scraped ${sectors.length} sector(s)`)
    console.log('')

    for (const sector of sectors) {
      printSectorSummary(sector)
    }
  } else {
    // Scrape single sector with routes
    console.log('🔍 Scraping single sector with routes...')
    console.log('')

    const sector = await apiScraper.scrapeSectorWithRoutes(sectorId, {
      includeSubSectors: true,
      maxRoutes: 50, // Limit for demo purposes
    })

    console.log('')
    console.log('='.repeat(80))
    printSectorDetails(sector)
  }
}

function printSectorSummary(sector: {
  getName: () => string
  getRouteCount: () => number
  getTopoCount: () => number
  getRoutesWithAnnotationsCount: () => number
  getTopoAnnotationCoverage: () => number
  hasSubSectors: () => boolean
  getSubSectorCount: () => number
}) {
  console.log(`📁 ${sector.getName()}`)
  console.log(`   Routes: ${sector.getRouteCount()}`)
  console.log(`   Topos: ${sector.getTopoCount()}`)
  console.log(
    `   Routes with annotations: ${sector.getRoutesWithAnnotationsCount()} (${sector.getTopoAnnotationCoverage().toFixed(1)}%)`,
  )
  if (sector.hasSubSectors()) {
    console.log(`   Sub-sectors: ${sector.getSubSectorCount()}`)
  }
  console.log('')
}

function printSectorDetails(sector: {
  toDto: () => {
    id: string
    name: string
    url: string
    stats: {
      routeCount: number
      topoCount: number
      routesWithAnnotations: number
      annotationCoverage: number
    }
    topoImages: Array<{
      topoId: string
      thumbnailUrl: string
      fullImageUrl: string
      routeCount: number
      areaCount: number
    }>
    routes: Array<{
      id: string
      name: string
      grade: string | null
      hasTopoAnnotation: boolean
      svgPathData: string
    }>
    subSectorIds: string[]
  }
}) {
  const dto = sector.toDto()

  console.log(`✅ Sector: ${dto.name}`)
  console.log(`   ID: ${dto.id}`)
  console.log(`   URL: ${dto.url}`)
  console.log('')

  console.log('📊 Statistics:')
  console.log(`   Total routes: ${dto.stats.routeCount}`)
  console.log(`   Topo images: ${dto.stats.topoCount}`)
  console.log(`   Routes with annotations: ${dto.stats.routesWithAnnotations}`)
  console.log(
    `   Annotation coverage: ${dto.stats.annotationCoverage.toFixed(1)}%`,
  )
  console.log('')

  if (dto.topoImages.length > 0) {
    console.log('🖼️  Topo Images:')
    for (const topo of dto.topoImages) {
      console.log(`   - Topo ${topo.topoId}:`)
      console.log(`     Routes: ${topo.routeCount}, Areas: ${topo.areaCount}`)
      console.log(`     Full: ${topo.fullImageUrl}`)
    }
    console.log('')
  }

  if (dto.routes.length > 0) {
    console.log('🧗 Routes:')
    for (const route of dto.routes.slice(0, 10)) {
      // Show first 10
      const topoIndicator = route.hasTopoAnnotation ? '✓' : '✗'
      console.log(
        `   [${topoIndicator}] ${route.name} (${route.grade || 'no grade'})`,
      )
    }
    if (dto.routes.length > 10) {
      console.log(`   ... and ${dto.routes.length - 10} more routes`)
    }
    console.log('')
  }

  if (dto.subSectorIds.length > 0) {
    console.log('📂 Sub-sectors (need separate scraping):')
    for (const subId of dto.subSectorIds) {
      console.log(`   - ${subId}`)
    }
    console.log('')
  }

  // Print full DTO as JSON for debugging
  console.log('📄 Full DTO (JSON):')
  console.log(JSON.stringify(dto, null, 2))
}

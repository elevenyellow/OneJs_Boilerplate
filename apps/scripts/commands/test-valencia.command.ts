/**
 * Comando: test-valencia
 * Scrape solo la región de Valencia para testing
 */

import { AreaId, AreaPrismaRepository } from '@climb-zone/area'
import {
  ContinentEntity,
  ContinentPrismaRepository,
} from '@climb-zone/continent'
import {
  CountryEntity,
  CountryId,
  CountryPrismaRepository,
} from '@climb-zone/country'
import { CragId, CragPrismaRepository } from '@climb-zone/crag'
import {
  RegionEntity,
  RegionId,
  RegionPrismaRepository,
} from '@climb-zone/region'
import { RoutePrismaRepository } from '@climb-zone/route'
import { SectorPrismaRepository } from '@climb-zone/sector'
import { ExternalId, Geometry, Name } from '@climb-zone/shared'
import { TheCragApiScraper } from '@scraper-thecrag'
import { ScrapedDataMapperService } from '@scraper-thecrag/application/services/scraped-data-mapper.service'

// Retry utility for database operations
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  operationName = 'operation',
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error

      // Check if it's a connection error
      const isConnectionError =
        error?.code === 'P1001' ||
        error?.message?.includes("Can't reach database") ||
        error?.message?.includes('Connection') ||
        error?.message?.includes('timeout')

      if (isConnectionError && attempt < maxRetries) {
        const delay = delayMs * attempt // Exponential backoff
        console.log(
          `   ⚠️  Connection error in ${operationName}, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // If not a connection error or out of retries, throw
      throw error
    }
  }

  throw lastError
}

interface Stats {
  regions: number
  crags: number
  areas: number
  sectors: number
  routes: number
  errors: number
  newFieldsSampled: {
    altNames: number
    locatedness: number
    numberPhotos: number
    numberTopos: number
    totalFavorites: number
    orientation: number
    rockType: number
  }
}

export async function testValencia(container: any, cookie: string) {
  // Get repositories and services from container
  const scraper = container.get(TheCragApiScraper)
  const mapper = container.get(ScrapedDataMapperService)
  const countryRepo = container.get(CountryPrismaRepository)
  const continentRepo = container.get(ContinentPrismaRepository)
  const regionRepo = container.get(RegionPrismaRepository)
  const cragRepo = container.get(CragPrismaRepository)
  const areaRepo = container.get(AreaPrismaRepository)
  const sectorRepo = container.get(SectorPrismaRepository)
  const routeRepo = container.get(RoutePrismaRepository)

  // Configure scraper
  scraper.setCookie(cookie)
  scraper.setDelay(50) // Fast for testing

  const stats: Stats = {
    regions: 0,
    crags: 0,
    areas: 0,
    sectors: 0,
    routes: 0,
    errors: 0,
    newFieldsSampled: {
      altNames: 0,
      locatedness: 0,
      numberPhotos: 0,
      numberTopos: 0,
      totalFavorites: 0,
      orientation: 0,
      rockType: 0,
    },
  }

  console.log('🌍 Navegando a Valencia...\n')

  // Find Spain
  const worldChildren = await scraper.getChildren(7546063) // World
  const europe = worldChildren.find((c) => c.name === 'Europe')

  if (!europe) {
    throw new Error('❌ Europe not found')
  }
  console.log(`✅ Found Europe (ID: ${europe.id})`)

  const europeChildren = await scraper.getChildren(europe.id)
  const spainNode = europeChildren.find((c) => c.name === 'Spain')

  if (!spainNode) {
    throw new Error('❌ Spain not found in Europe')
  }
  console.log(`✅ Found Spain (ID: ${spainNode.id})`)

  // Get or create Spain in database
  let spainCountry = await countryRepo.findByExternalId(
    ExternalId.create(spainNode.id),
  )

  if (!spainCountry) {
    console.log('⚠️  Spain not in database, creating it now...')

    // Find or create Europe continent
    let europeContinent = await continentRepo.findByExternalId(
      ExternalId.create(europe.id),
    )

    if (!europeContinent) {
      const newEurope = ContinentEntity.create(
        ExternalId.create(europe.id),
        'Europe',
        europe.geometry ? Geometry.fromJSON(europe.geometry) : null,
      )
      europeContinent = await continentRepo.save(newEurope)
      console.log(`   ✅ Europe continent created`)
    }

    // Create Spain
    const spainInfo = await scraper.getNodeInfo(spainNode.id)
    const spainGeometry = spainInfo?.geometry ?? spainNode.geometry
    const newSpain = CountryEntity.create(
      ExternalId.create(spainNode.id),
      europeContinent.id.toString(),
      'Spain',
      spainGeometry ? Geometry.fromJSON(spainGeometry) : null,
    )
    spainCountry = await countryRepo.save(newSpain)
    console.log(`   ✅ Spain created in DB`)
  }

  const spainCountryId = spainCountry.id
  console.log(`✅ Spain in DB (ID: ${spainCountryId.toString()})`)

  // Get all regions of Spain and find Valencia
  console.log('\n🔍 Looking for "Comunidad Valenciana"...\n')
  const spainRegions = await scraper.getChildren(spainNode.id)

  const valenciaNode = spainRegions.find(
    (r) =>
      r.name === 'Comunidad Valenciana' || r.name === 'Valencian Community',
  )

  if (!valenciaNode) {
    console.log('❌ Valencia not found. Available regions:')
    spainRegions.forEach((r) => console.log(`   - ${r.name}`))
    throw new Error('Valencia not found')
  }

  console.log(`✅ Found ${valenciaNode.name} (ID: ${valenciaNode.id})\n`)
  console.log('📦 Starting Valencia scraping...\n')

  const regionStart = Date.now()

  // Save or get region
  const regionInfo = await scraper.getNodeInfo(valenciaNode.id)
  const geometryData = valenciaNode.geometry ?? regionInfo?.geometry

  // Sample new fields
  sampleNewFields(regionInfo, stats)

  const regionEntity = new RegionEntity(
    RegionId.generate(),
    ExternalId.create(valenciaNode.id),
    spainCountryId,
    Name.create(valenciaNode.name),
    geometryData ? Geometry.fromJSON(geometryData) : null,
  )
  const savedRegion = await regionRepo.saveByExternalId(regionEntity)
  stats.regions++

  console.log(`💾 Region saved: ${savedRegion.name}`)
  printFieldsSample(regionInfo)

  // Get all children of Valencia region
  await processRegionChildren(
    valenciaNode.id,
    savedRegion.id,
    spainCountryId,
    scraper,
    mapper,
    cragRepo,
    areaRepo,
    sectorRepo,
    routeRepo,
    stats,
  )

  const duration = ((Date.now() - regionStart) / 1000).toFixed(1)
  console.log(`\n✅ Valencia completed in ${duration}s`)

  // Final report
  printFinalReport(stats)
}

function sampleNewFields(info: any, stats: Stats) {
  if (info?.altNames?.length) stats.newFieldsSampled.altNames++
  if (info?.locatedness !== undefined) stats.newFieldsSampled.locatedness++
  if (info?.numberPhotos) stats.newFieldsSampled.numberPhotos++
  if (info?.numberTopos) stats.newFieldsSampled.numberTopos++
  if (info?.totalFavorites) stats.newFieldsSampled.totalFavorites++
  if (info?.orientation) stats.newFieldsSampled.orientation++
  if (info?.rockType) stats.newFieldsSampled.rockType++
}

function printFieldsSample(info: any) {
  console.log(`📊 New fields detected:`)
  console.log(`   - altNames: ${info?.altNames?.length || 0} names`)
  console.log(`   - locatedness: ${info?.locatedness ?? 'N/A'}`)
  console.log(`   - numberPhotos: ${info?.numberPhotos ?? 0}`)
  console.log(`   - numberTopos: ${info?.numberTopos ?? 0}`)
  console.log(`   - totalFavorites: ${info?.totalFavorites ?? 0}`)
  console.log(`   - orientation: ${info?.orientation ?? 'N/A'}`)
  console.log(`   - rockType: ${info?.rockType ?? 'N/A'}\n`)
}

function printFinalReport(stats: Stats) {
  console.log('\n' + '='.repeat(80))
  console.log('🎉 VALENCIA SCRAPING COMPLETED')
  console.log('='.repeat(80))
  console.log(`Regions: ${stats.regions}`)
  console.log(`Crags: ${stats.crags}`)
  console.log(`Areas: ${stats.areas}`)
  console.log(`Sectors: ${stats.sectors}`)
  console.log(`Routes: ${stats.routes}`)
  console.log(`Errors: ${stats.errors}`)
  console.log('\n📊 New Fields Sampling:')
  console.log(`  altNames found in: ${stats.newFieldsSampled.altNames} nodes`)
  console.log(
    `  locatedness found in: ${stats.newFieldsSampled.locatedness} nodes`,
  )
  console.log(
    `  numberPhotos found in: ${stats.newFieldsSampled.numberPhotos} nodes`,
  )
  console.log(
    `  numberTopos found in: ${stats.newFieldsSampled.numberTopos} nodes`,
  )
  console.log(
    `  totalFavorites found in: ${stats.newFieldsSampled.totalFavorites} nodes`,
  )
  console.log(
    `  orientation found in: ${stats.newFieldsSampled.orientation} nodes`,
  )
  console.log(`  rockType found in: ${stats.newFieldsSampled.rockType} nodes`)
  console.log('='.repeat(80))
}

async function processRegionChildren(
  nodeId: number,
  regionId: RegionId,
  countryId: CountryId,
  scraper: TheCragApiScraper,
  mapper: ScrapedDataMapperService,
  cragRepo: CragPrismaRepository,
  areaRepo: AreaPrismaRepository,
  sectorRepo: SectorPrismaRepository,
  routeRepo: RoutePrismaRepository,
  stats: Stats,
): Promise<void> {
  const children = await scraper.getChildren(nodeId)

  // Process children in parallel batches - REDUCED from 5 to 2 to avoid DB connection issues
  const BATCH_SIZE = 10
  for (let i = 0; i < children.length; i += BATCH_SIZE) {
    const batch = children.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (child) => {
        try {
          const [info, hasRoutes] = await Promise.all([
            scraper.getNodeInfo(child.id),
            scraper.getRoutes(child.id).then((r) => r.length > 0),
          ])

          // Sample new fields
          sampleNewFields(info, stats)

          const geometry = info?.geometry ?? child.geometry
          const isCragLevel = child.type === 'Crag'

          if (isCragLevel || hasRoutes) {
            // This is a Crag - save it with retry
            const crag = await retryWithBackoff(
              async () => {
                const cragData = mapper.mapToCrag(
                  child.id,
                  child.name,
                  countryId,
                  geometry,
                  info,
                  regionId,
                )
                return await cragRepo.saveByExternalId(
                  mapper.createCragEntity(cragData),
                  info?.apiResponseRaw,
                )
              },
              3,
              1000,
              `saving crag ${child.name}`,
            )
            stats.crags++

            console.log(`   ⛰️  Crag: ${child.name}`)

            // Process crag children (areas/sectors)
            await processCragChildren(
              child.id,
              child.name, // Pasar el nombre del crag
              crag.id,
              scraper,
              mapper,
              areaRepo,
              sectorRepo,
              routeRepo,
              stats,
            )
          } else {
            // This is a sub-region or area, recurse
            await processRegionChildren(
              child.id,
              regionId,
              countryId,
              scraper,
              mapper,
              cragRepo,
              areaRepo,
              sectorRepo,
              routeRepo,
              stats,
            )
          }
        } catch (error) {
          stats.errors++
          console.error(`   ❌ Error processing ${child.name}:`, error)
        }
      }),
    )

    // Small delay between batches to avoid overwhelming the DB
    if (i + BATCH_SIZE < children.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

async function processCragChildren(
  nodeId: number,
  nodeName: string, // Nombre del nodo actual
  cragId: CragId,
  scraper: TheCragApiScraper,
  mapper: ScrapedDataMapperService,
  areaRepo: AreaPrismaRepository,
  sectorRepo: SectorPrismaRepository,
  routeRepo: RoutePrismaRepository,
  stats: Stats,
  parentAreaId: AreaId | null = null,
): Promise<void> {
  // Fetch data from API in parallel (no DB connections here)
  const [info, children, routes] = await Promise.all([
    scraper.getNodeInfo(nodeId),
    scraper.getChildren(nodeId),
    scraper.getRoutes(nodeId),
  ])

  // Sample new fields
  sampleNewFields(info, stats)

  // If has routes, this is a sector
  if (routes.length > 0) {
    // Create area if needed (sequential DB operation)
    let areaId = parentAreaId
    if (!areaId) {
      const area = await retryWithBackoff(
        async () => {
          const areaData = mapper.mapToArea(
            nodeId,
            info?.name || nodeName || 'Default Area',
            cragId,
            null,
            info?.geometry,
            info,
            'Area',
          )
          return await areaRepo.saveByExternalId(
            mapper.createAreaEntity(areaData),
            info?.apiResponseRaw,
          )
        },
        3,
        1000,
        `saving area ${nodeName}`,
      )
      areaId = area.id
      stats.areas++
    }

    // Create sector (sequential DB operation)
    const sectorName = info?.name || nodeName
    const sector = await retryWithBackoff(
      async () => {
        const sectorData = mapper.mapToSector(
          nodeId,
          sectorName,
          areaId,
          info?.geometry,
          info,
          'Sector',
        )
        return await sectorRepo.saveByExternalId(
          mapper.createSectorEntity(sectorData),
          info?.apiResponseRaw,
        )
      },
      3,
      1000,
      `saving sector ${sectorName}`,
    )
    stats.sectors++

    // Save routes sequentially to avoid DB overload (they share one connection)
    for (const route of routes) {
      await retryWithBackoff(
        async () => {
          const routeData = mapper.mapToRoute(route, sector.id)
          await routeRepo.saveByExternalId(mapper.createRouteEntity(routeData))
        },
        3,
        1000,
        `saving route`,
      )
      stats.routes++
    }

    console.log(`      📍 Sector: ${sectorName} (${routes.length} routes)`)
  }

  // Process children sequentially to avoid DB overload
  for (const child of children) {
    await processCragChildren(
      child.id,
      child.name,
      cragId,
      scraper,
      mapper,
      areaRepo,
      sectorRepo,
      routeRepo,
      stats,
      parentAreaId,
    )
  }
}

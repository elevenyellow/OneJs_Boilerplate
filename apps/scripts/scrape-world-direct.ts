#!/usr/bin/env bun
/**
 * Script to scrape ALL climbing zones in the world and save to database
 * Strategy: World → Continents → Countries → Regions → Crags → Areas → Sectors → Routes
 * 
 * This script processes countries sequentially to avoid overwhelming TheCrag API.
 * 
 * Usage:
 *   bun run apps/scripts/scrape-world-direct.ts                    # Scrape all continents
 *   bun run apps/scripts/scrape-world-direct.ts --continent=Europe # Scrape only Europe
 *   bun run apps/scripts/scrape-world-direct.ts --resume           # Resume from last checkpoint
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
import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { PrismaPlugin } from '@OneJs/prisma'
import { TheCragApiScraper } from '@scraper-thecrag'
import { ScrapedDataMapperService } from '@scraper-thecrag/application/services/scraped-data-mapper.service'
import * as fs from 'fs'
import * as path from 'path'

const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

const WORLD_NODE_ID = 7546063
const IGNORED_CONTINENTS = ['Virtual', 'test area']
const CHECKPOINT_FILE = path.join(process.cwd(), '.scraper-checkpoint.json')

interface WorldStats {
  continents: number
  countries: number
  regions: number
  crags: number
  areas: number
  sectors: number
  routes: number
  errors: number
  startTime: number
  currentContinent?: string
  currentCountry?: string
}

interface CountryStats {
  regions: number
  crags: number
  areas: number
  sectors: number
  routes: number
  errors: number
}

interface Checkpoint {
  lastProcessedCountryId: number | null
  lastProcessedContinentName: string | null
  completedCountries: number[]
  timestamp: string
}

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    continent: args.find((arg) => arg.startsWith('--continent='))?.split('=')[1],
    resume: args.includes('--resume'),
  }
}

function loadCheckpoint(): Checkpoint | null {
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    return null
  }
  try {
    const data = fs.readFileSync(CHECKPOINT_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('⚠️  Failed to load checkpoint:', error)
    return null
  }
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2))
  } catch (error) {
    console.error('⚠️  Failed to save checkpoint:', error)
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

async function main() {
  const args = parseArgs()
  console.log('🚀 Starting OneJs...\n')

  // Initialize OneJs with all plugins
  PluginRegistry.register(new PrismaPlugin())
  PluginRegistry.register(new BootstrapLoader())

  const oneJs = new OneJs(import.meta.url)
  await oneJs.start()

  const container = ContainerProvider.getContainer()

  // Get all repositories and services
  const scraper = container.get(TheCragApiScraper)
  const mapper = container.get(ScrapedDataMapperService)
  const continentRepo = container.get(ContinentPrismaRepository)
  const countryRepo = container.get(CountryPrismaRepository)
  const regionRepo = container.get(RegionPrismaRepository)
  const cragRepo = container.get(CragPrismaRepository)
  const areaRepo = container.get(AreaPrismaRepository)
  const sectorRepo = container.get(SectorPrismaRepository)
  const routeRepo = container.get(RoutePrismaRepository)

  // Configure scraper
  scraper.setCookie(COOKIE)
  scraper.setDelay(100)

  // Load checkpoint if resuming
  let checkpoint: Checkpoint | null = null
  if (args.resume) {
    checkpoint = loadCheckpoint()
    if (checkpoint) {
      console.log('📍 Resuming from checkpoint:')
      console.log(`   Last continent: ${checkpoint.lastProcessedContinentName}`)
      console.log(`   Completed countries: ${checkpoint.completedCountries.length}`)
      console.log(`   Timestamp: ${checkpoint.timestamp}\n`)
    }
  }

  const stats: WorldStats = {
    continents: 0,
    countries: 0,
    regions: 0,
    crags: 0,
    areas: 0,
    sectors: 0,
    routes: 0,
    errors: 0,
    startTime: Date.now(),
  }

  console.log('🌍 Step 1: Getting continents from World...\n')

  // Get all continents
  const continentNodes = await scraper.getChildren(WORLD_NODE_ID)
  const filteredContinents = continentNodes.filter(
    (c) => !IGNORED_CONTINENTS.includes(c.name),
  )

  console.log(
    `✅ Found ${filteredContinents.length} continents (filtered out ${IGNORED_CONTINENTS.join(', ')})\n`,
  )

  // Filter by continent argument if provided
  const continentsToProcess = args.continent
    ? filteredContinents.filter((c) => c.name === args.continent)
    : filteredContinents

  if (continentsToProcess.length === 0) {
    console.error(`❌ No continents found matching: ${args.continent}`)
    process.exit(1)
  }

  console.log(
    `📦 Processing ${continentsToProcess.length} continent(s)${args.continent ? ` (filtered: ${args.continent})` : ''}...\n`,
  )

  // Process each continent
  for (let i = 0; i < continentsToProcess.length; i++) {
    const continentNode = continentsToProcess[i]
    const continentStart = Date.now()

    console.log('='.repeat(80))
    console.log(
      `[${i + 1}/${continentsToProcess.length}] 🌍 ${continentNode.name} (ID: ${continentNode.id})`,
    )
    console.log('='.repeat(80))

    stats.currentContinent = continentNode.name

    try {
      // Save or get continent
      const continentInfo = await scraper.getNodeInfo(continentNode.id)
      const geometryData = continentNode.geometry ?? continentInfo?.geometry
      const continentEntity = ContinentEntity.create(
        ExternalId.create(continentNode.id),
        continentNode.name,
        geometryData ? Geometry.fromJSON(geometryData) : null,
      )
      const savedContinent = await continentRepo.save(continentEntity)
      stats.continents++

      console.log(`💾 Continent saved: ${savedContinent.name}\n`)

      // Get all countries in this continent
      const countryNodes = await scraper.getChildren(continentNode.id)
      console.log(`📍 Found ${countryNodes.length} countries in ${continentNode.name}\n`)

      // Process each country
      for (let j = 0; j < countryNodes.length; j++) {
        const countryNode = countryNodes[j]

        // Skip if already processed (resume mode)
        if (checkpoint?.completedCountries.includes(countryNode.id)) {
          console.log(
            `[${j + 1}/${countryNodes.length}] ⏭️  ${countryNode.name} - Skipped (already processed)\n`,
          )
          continue
        }

        const countryStart = Date.now()

        console.log(
          `[${j + 1}/${countryNodes.length}] 🏳️  ${countryNode.name} (ID: ${countryNode.id})`,
        )

        stats.currentCountry = countryNode.name

        try {
          // Process this country
          const countryStats = await processCountry(
            countryNode.id,
            countryNode.name,
            savedContinent.id,
            countryNode.geometry,
            scraper,
            mapper,
            countryRepo,
            regionRepo,
            cragRepo,
            areaRepo,
            sectorRepo,
            routeRepo,
          )

          // Update global stats
          stats.countries++
          stats.regions += countryStats.regions
          stats.crags += countryStats.crags
          stats.areas += countryStats.areas
          stats.sectors += countryStats.sectors
          stats.routes += countryStats.routes
          stats.errors += countryStats.errors

          const duration = formatDuration(Date.now() - countryStart)
          console.log(`   ✅ ${countryNode.name} completed in ${duration}`)
          console.log(
            `   📊 Country: ${countryStats.regions}R ${countryStats.crags}C ${countryStats.areas}A ${countryStats.sectors}S ${countryStats.routes}Rt`,
          )
          console.log(
            `   📊 Total: ${stats.countries}Co ${stats.regions}R ${stats.crags}C ${stats.areas}A ${stats.sectors}S ${stats.routes}Rt\n`,
          )

          // Save checkpoint
          const completedCountries = checkpoint?.completedCountries || []
          completedCountries.push(countryNode.id)
          saveCheckpoint({
            lastProcessedCountryId: countryNode.id,
            lastProcessedContinentName: continentNode.name,
            completedCountries,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          stats.errors++
          console.error(`   ❌ Error processing ${countryNode.name}:`, error)
          console.log('   Continuing to next country...\n')
        }
      }

      const continentDuration = formatDuration(Date.now() - continentStart)
      console.log(`\n✅ ${continentNode.name} completed in ${continentDuration}`)
      console.log(
        `📊 Continent totals: ${countryNodes.length} countries processed\n`,
      )
    } catch (error) {
      stats.errors++
      console.error(`❌ Error processing continent ${continentNode.name}:`, error)
    }
  }

  // Final report
  const totalDuration = formatDuration(Date.now() - stats.startTime)

  console.log('\n' + '='.repeat(80))
  console.log('🎉 WORLD SCRAPING COMPLETED')
  console.log('='.repeat(80))
  console.log(`Continents: ${stats.continents}`)
  console.log(`Countries: ${stats.countries}`)
  console.log(`Regions: ${stats.regions}`)
  console.log(`Crags: ${stats.crags}`)
  console.log(`Areas: ${stats.areas}`)
  console.log(`Sectors: ${stats.sectors}`)
  console.log(`Routes: ${stats.routes}`)
  console.log(`Errors: ${stats.errors}`)
  console.log(`Total Duration: ${totalDuration}`)
  console.log('='.repeat(80))

  // Clean up checkpoint file on success
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE)
    console.log('\n✅ Checkpoint file cleaned up')
  }

  process.exit(0)
}

/**
 * Process a single country and all its regions/crags
 */
async function processCountry(
  countryExternalId: number,
  countryName: string,
  continentId: string,
  geometryData: any,
  scraper: TheCragApiScraper,
  mapper: ScrapedDataMapperService,
  countryRepo: CountryPrismaRepository,
  regionRepo: RegionPrismaRepository,
  cragRepo: CragPrismaRepository,
  areaRepo: AreaPrismaRepository,
  sectorRepo: SectorPrismaRepository,
  routeRepo: RoutePrismaRepository,
): Promise<CountryStats> {
  const countryStats: CountryStats = {
    regions: 0,
    crags: 0,
    areas: 0,
    sectors: 0,
    routes: 0,
    errors: 0,
  }

  // Save or get country
  const countryInfo = await scraper.getNodeInfo(countryExternalId)
  const geometry = geometryData ?? countryInfo?.geometry
  const countryEntity = CountryEntity.create(
    ExternalId.create(countryExternalId),
    continentId,
    countryName,
    geometry ? Geometry.fromJSON(geometry) : null,
  )
  const savedCountry = await countryRepo.save(countryEntity)
  const countryId = savedCountry.id

  console.log(`   💾 Country saved: ${savedCountry.name}`)

  // Get all regions in this country
  const regionNodes = await scraper.getChildren(countryExternalId)

  if (regionNodes.length === 0) {
    console.log('   ℹ️  No regions found')
    return countryStats
  }

  console.log(`   📍 Found ${regionNodes.length} regions`)

  // Process each region
  for (const regionNode of regionNodes) {
    try {
      // Save or get region
      const regionInfo = await scraper.getNodeInfo(regionNode.id)
      const regionGeometry = regionNode.geometry ?? regionInfo?.geometry
      const regionEntity = new RegionEntity(
        RegionId.generate(),
        ExternalId.create(regionNode.id),
        countryId,
        Name.create(regionNode.name),
        regionGeometry ? Geometry.fromJSON(regionGeometry) : null,
      )
      const savedRegion = await regionRepo.saveByExternalId(regionEntity)
      countryStats.regions++

      // Get all children of this region (crags and sub-areas)
      await processRegionChildren(
        regionNode.id,
        savedRegion.id,
        countryId,
        scraper,
        mapper,
        cragRepo,
        areaRepo,
        sectorRepo,
        routeRepo,
        countryStats,
      )
    } catch (error) {
      countryStats.errors++
      console.error(`      ❌ Error processing region ${regionNode.name}:`, error)
    }
  }

  return countryStats
}

/**
 * Process all children of a region recursively
 */
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
  stats: CountryStats,
): Promise<void> {
  const children = await scraper.getChildren(nodeId)

  for (const child of children) {
    try {
      const [info, hasRoutes] = await Promise.all([
        scraper.getNodeInfo(child.id),
        scraper.getRoutes(child.id).then((r) => r.length > 0),
      ])

      const geometry = info?.geometry ?? child.geometry
      const isCragLevel = child.type === 'Crag'

      if (isCragLevel || hasRoutes) {
        // This is a Crag - save it
        const cragData = mapper.mapToCrag(
          child.id,
          child.name,
          countryId,
          geometry,
          info,
          regionId,
        )
        const crag = await cragRepo.saveByExternalId(
          mapper.createCragEntity(cragData),
        )
        stats.crags++

        // Process crag children (areas/sectors)
        await processCragChildren(
          child.id,
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
      console.error(`      ❌ Error processing ${child.name}:`, error)
    }
  }
}

/**
 * Process children of a crag (areas, sectors, routes)
 */
async function processCragChildren(
  nodeId: number,
  cragId: CragId,
  scraper: TheCragApiScraper,
  mapper: ScrapedDataMapperService,
  areaRepo: AreaPrismaRepository,
  sectorRepo: SectorPrismaRepository,
  routeRepo: RoutePrismaRepository,
  stats: CountryStats,
  parentAreaId: AreaId | null = null,
): Promise<void> {
  const [info, children, routes] = await Promise.all([
    scraper.getNodeInfo(nodeId),
    scraper.getChildren(nodeId),
    scraper.getRoutes(nodeId),
  ])

  // If has routes, this is a sector
  if (routes.length > 0) {
    // Create area if needed
    let areaId = parentAreaId
    if (!areaId) {
      const areaData = mapper.mapToArea(
        nodeId,
        'Default Area',
        cragId,
        null,
        info?.geometry,
        info,
        'Area',
      )
      const area = await areaRepo.saveByExternalId(
        mapper.createAreaEntity(areaData),
      )
      areaId = area.id
      stats.areas++
    }

    // Create sector
    const sectorData = mapper.mapToSector(
      nodeId,
      info?.name || 'Sector',
      areaId,
      info?.geometry,
      info,
      'Sector',
    )
    const sector = await sectorRepo.saveByExternalId(
      mapper.createSectorEntity(sectorData),
    )
    stats.sectors++

    // Save routes
    for (const route of routes) {
      const routeData = mapper.mapToRoute(route, sector.id)
      await routeRepo.saveByExternalId(mapper.createRouteEntity(routeData))
      stats.routes++
    }
  }

  // Process children recursively
  for (const child of children) {
    await processCragChildren(
      child.id,
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

main().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

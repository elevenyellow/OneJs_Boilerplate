#!/usr/bin/env bun
/**
 * Script to scrape ALL climbing zones in Spain and save to database
 * Strategy: World → Europe → Spain → Regions → Save to DB directly
 */

import { AreaId, AreaPrismaRepository } from '@climb-zone/area'
import { CountryId, CountryPrismaRepository } from '@climb-zone/country'
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

const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

interface Stats {
  regions: number
  crags: number
  areas: number
  sectors: number
  routes: number
  errors: number
}

async function main() {
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
  const countryRepo = container.get(CountryPrismaRepository)
  const regionRepo = container.get(RegionPrismaRepository)
  const cragRepo = container.get(CragPrismaRepository)
  const areaRepo = container.get(AreaPrismaRepository)
  const sectorRepo = container.get(SectorPrismaRepository)
  const routeRepo = container.get(RoutePrismaRepository)

  // Configure scraper
  scraper.setCookie(COOKIE)
  scraper.setDelay(100)

  const stats: Stats = {
    regions: 0,
    crags: 0,
    areas: 0,
    sectors: 0,
    routes: 0,
    errors: 0,
  }

  console.log('🌍 Step 1: Navigating World → Europe → Spain...\n')

  // Find Spain by navigating from World
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
  const spainCountry = await countryRepo.findByExternalId(
    ExternalId.create(spainNode.id),
  )

  if (!spainCountry) {
    console.log('⚠️  Spain not in database, it needs to be seeded first')
    console.log('   Run: bun run scripts/seed-countries.ts')
    process.exit(1)
  }

  const spainCountryId = spainCountry.id
  console.log(`✅ Spain found in DB (ID: ${spainCountryId.toString()})`)

  // Get all regions of Spain
  console.log('\n🗺️  Step 2: Getting Spain regions...\n')
  const spainRegions = await scraper.getChildren(spainNode.id)
  console.log(`✅ Found ${spainRegions.length} regions in Spain\n`)

  // Process each region
  console.log('📦 Step 3: Scraping and saving regions...\n')

  for (let i = 0; i < spainRegions.length; i++) {
    const regionNode = spainRegions[i]
    const regionStart = Date.now()

    console.log(
      `[${i + 1}/${spainRegions.length}] 🏔️  ${regionNode.name} (ID: ${regionNode.id})`,
    )

    try {
      // Save or get region
      const regionInfo = await scraper.getNodeInfo(regionNode.id)
      const geometryData = regionNode.geometry ?? regionInfo?.geometry
      const regionEntity = new RegionEntity(
        RegionId.generate(),
        ExternalId.create(regionNode.id),
        spainCountryId,
        Name.create(regionNode.name),
        geometryData ? Geometry.fromJSON(geometryData) : null,
      )
      const savedRegion = await regionRepo.saveByExternalId(regionEntity)
      stats.regions++

      console.log(`   💾 Region saved: ${savedRegion.name}`)

      // Get all children of this region (crags and sub-areas)
      await processRegionChildren(
        regionNode.id,
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
      console.log(`   ✅ ${regionNode.name} completed in ${duration}s`)
      console.log(
        `   📊 Running totals: ${stats.crags}C ${stats.areas}A ${stats.sectors}S ${stats.routes}R\n`,
      )
    } catch (error) {
      stats.errors++
      console.error(`   ❌ Error processing ${regionNode.name}:`, error)
    }
  }

  // Final report
  console.log('\n' + '='.repeat(80))
  console.log('🎉 SPAIN SCRAPING COMPLETED')
  console.log('='.repeat(80))
  console.log(`Regions: ${stats.regions}`)
  console.log(`Crags: ${stats.crags}`)
  console.log(`Areas: ${stats.areas}`)
  console.log(`Sectors: ${stats.sectors}`)
  console.log(`Routes: ${stats.routes}`)
  console.log(`Errors: ${stats.errors}`)
  console.log('='.repeat(80))

  process.exit(0)
}

/**
 * Process all children of a region recursively
 * This is similar to scrape-country.job.ts logic but adapted for direct execution
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
  stats: Stats,
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

        console.log(`      ⛰️  Crag: ${child.name}`)

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
  stats: Stats,
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

    console.log(`         📍 Sector: ${routes.length} routes`)
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

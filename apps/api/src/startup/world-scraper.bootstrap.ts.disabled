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
import { ConfigService, Inject, Injectable, logger } from '@OneJs/core'
import { BootstrapBase } from '@OneJs/core/bootstrap'
import { TheCragApiScraper } from '@scraper-thecrag'
import { ScrapedDataMapperService } from '@scraper-thecrag/application/services/scraped-data-mapper.service'
import * as fs from 'fs'
import * as path from 'path'

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

/**
 * Bootstrap that automatically scrapes all climbing zones in the world
 * when the API server starts.
 *
 * This replaces the old job queue system with a simpler direct approach.
 *
 * Configuration via environment variables:
 * - ENABLE_SCRAPER_BOOTSTRAP: Set to 'true' to enable automatic scraping on startup
 * - SCRAPER_CONTINENT_FILTER: Optional continent name to limit scraping (e.g., 'Europe')
 * - SCRAPER_AUTO_RESUME: Set to 'true' to automatically resume from checkpoint
 * - THECRAG_COOKIE: Required cookie for TheCrag API
 * - THECRAG_DELAY_MS: Delay between requests in milliseconds (default: 100)
 */
@Injectable()
export class WorldScraperBootstrap extends BootstrapBase {
  constructor(
    @Inject(TheCragApiScraper)
    private readonly scraper: TheCragApiScraper,
    @Inject(ScrapedDataMapperService)
    private readonly mapper: ScrapedDataMapperService,
    @Inject(ContinentPrismaRepository)
    private readonly continentRepo: ContinentPrismaRepository,
    @Inject(CountryPrismaRepository)
    private readonly countryRepo: CountryPrismaRepository,
    @Inject(RegionPrismaRepository)
    private readonly regionRepo: RegionPrismaRepository,
    @Inject(CragPrismaRepository)
    private readonly cragRepo: CragPrismaRepository,
    @Inject(AreaPrismaRepository)
    private readonly areaRepo: AreaPrismaRepository,
    @Inject(SectorPrismaRepository)
    private readonly sectorRepo: SectorPrismaRepository,
    @Inject(RoutePrismaRepository)
    private readonly routeRepo: RoutePrismaRepository,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {
    super()
  }

  async bootstrap(): Promise<void> {
    this.exec()
      .then(() => {
        logger.info(
          'scraper:bootstrap',
          '✅ World scraper bootstrap completed!',
        )
      })
      .catch((error) => {
        logger.error(
          'scraper:bootstrap',
          `❌ World scraper bootstrap failed: ${error}`,
        )
      })
  }

  private async exec() {
    // Check if scraper bootstrap is enabled
    const isEnabled = this.config.get('ENABLE_SCRAPER_BOOTSTRAP') === 'true'

    if (!isEnabled) {
      logger.info(
        'scraper:bootstrap',
        '⏸️  World scraper bootstrap disabled (set ENABLE_SCRAPER_BOOTSTRAP=true to enable)',
      )
      return
    }

    logger.info('scraper:bootstrap', '🌍 Starting world scraper bootstrap...')

    // Configure scraper
    const cookie = this.config.get('THECRAG_COOKIE')
    if (cookie) {
      this.scraper.setCookie(cookie)
      logger.debug('scraper:bootstrap', '🔑 Cookie configured from env')
    } else {
      logger.error(
        'scraper:bootstrap',
        '❌ No THECRAG_COOKIE found in env. Cannot proceed.',
      )
      return
    }

    const delay = this.config.get('THECRAG_DELAY_MS')
    if (delay) {
      this.scraper.setDelay(parseInt(delay, 10))
    }

    // Get configuration options
    const continentFilter = this.config.get('SCRAPER_CONTINENT_FILTER')
    const autoResume = this.config.get('SCRAPER_AUTO_RESUME') === 'true'

    // Load checkpoint if auto-resume is enabled
    let checkpoint: Checkpoint | null = null
    if (autoResume) {
      checkpoint = this.loadCheckpoint()
      if (checkpoint) {
        logger.info(
          'scraper:bootstrap',
          `📍 Resuming from checkpoint: ${checkpoint.lastProcessedContinentName}, ${checkpoint.completedCountries.length} countries completed`,
        )
      }
    }

    try {
      await this.scrapeWorld(continentFilter, checkpoint)
      logger.info('scraper:bootstrap', '✅ World scraper bootstrap completed!')

      // Clean up checkpoint file on success
      if (fs.existsSync(CHECKPOINT_FILE)) {
        fs.unlinkSync(CHECKPOINT_FILE)
        logger.debug('scraper:bootstrap', '✅ Checkpoint file cleaned up')
      }
    } catch (error) {
      logger.error(
        'scraper:bootstrap',
        `❌ World scraper bootstrap failed: ${error}`,
      )
    }
  }

  private async scrapeWorld(
    continentFilter: string | undefined,
    checkpoint: Checkpoint | null,
  ): Promise<void> {
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

    logger.info('scraper:bootstrap', '🌍 Getting continents from World...')

    // Get all continents
    const continentNodes = await this.scraper.getChildren(WORLD_NODE_ID)
    const filteredContinents = continentNodes.filter(
      (c) => !IGNORED_CONTINENTS.includes(c.name),
    )

    logger.info(
      'scraper:bootstrap',
      `✅ Found ${filteredContinents.length} continents (filtered out ${IGNORED_CONTINENTS.join(', ')})`,
    )

    // Filter by continent if specified
    const continentsToProcess = continentFilter
      ? filteredContinents.filter((c) => c.name === continentFilter)
      : filteredContinents

    if (continentsToProcess.length === 0) {
      logger.error(
        'scraper:bootstrap',
        `❌ No continents found matching: ${continentFilter}`,
      )
      return
    }

    logger.info(
      'scraper:bootstrap',
      `📦 Processing ${continentsToProcess.length} continent(s)${continentFilter ? ` (filtered: ${continentFilter})` : ''}...`,
    )

    // Process each continent
    for (let i = 0; i < continentsToProcess.length; i++) {
      const continentNode = continentsToProcess[i]
      const continentStart = Date.now()

      logger.info(
        'scraper:bootstrap',
        `[${i + 1}/${continentsToProcess.length}] 🌍 ${continentNode.name} (ID: ${continentNode.id})`,
      )

      stats.currentContinent = continentNode.name

      try {
        // Save or get continent
        const continentInfo = await this.scraper.getNodeInfo(continentNode.id)
        const geometryData = continentNode.geometry ?? continentInfo?.geometry
        const continentEntity = ContinentEntity.create(
          ExternalId.create(continentNode.id),
          continentNode.name,
          geometryData ? Geometry.fromJSON(geometryData) : null,
        )
        const savedContinent = await this.continentRepo.save(continentEntity)
        stats.continents++

        logger.info(
          'scraper:bootstrap',
          `💾 Continent saved: ${savedContinent.name}`,
        )

        // Get all countries in this continent
        const countryNodes = await this.scraper.getChildren(continentNode.id)
        logger.info(
          'scraper:bootstrap',
          `📍 Found ${countryNodes.length} countries in ${continentNode.name}`,
        )

        // Process each country
        for (let j = 0; j < countryNodes.length; j++) {
          const countryNode = countryNodes[j]

          // Skip if already processed (resume mode)
          if (checkpoint?.completedCountries.includes(countryNode.id)) {
            logger.info(
              'scraper:bootstrap',
              `[${j + 1}/${countryNodes.length}] ⏭️  ${countryNode.name} - Skipped (already processed)`,
            )
            continue
          }

          const countryStart = Date.now()

          logger.info(
            'scraper:bootstrap',
            `[${j + 1}/${countryNodes.length}] 🏳️  ${countryNode.name} (ID: ${countryNode.id})`,
          )

          stats.currentCountry = countryNode.name

          try {
            // Process this country
            const countryStats = await this.processCountry(
              countryNode.id,
              countryNode.name,
              savedContinent.id,
              countryNode.geometry,
            )

            // Update global stats
            stats.countries++
            stats.regions += countryStats.regions
            stats.crags += countryStats.crags
            stats.areas += countryStats.areas
            stats.sectors += countryStats.sectors
            stats.routes += countryStats.routes
            stats.errors += countryStats.errors

            const duration = this.formatDuration(Date.now() - countryStart)
            logger.info(
              'scraper:bootstrap',
              `✅ ${countryNode.name} completed in ${duration} - Country: ${countryStats.regions}R ${countryStats.crags}C ${countryStats.areas}A ${countryStats.sectors}S ${countryStats.routes}Rt`,
            )
            logger.info(
              'scraper:bootstrap',
              `📊 Total: ${stats.countries}Co ${stats.regions}R ${stats.crags}C ${stats.areas}A ${stats.sectors}S ${stats.routes}Rt`,
            )

            // Save checkpoint
            const completedCountries = checkpoint?.completedCountries || []
            completedCountries.push(countryNode.id)
            this.saveCheckpoint({
              lastProcessedCountryId: countryNode.id,
              lastProcessedContinentName: continentNode.name,
              completedCountries,
              timestamp: new Date().toISOString(),
            })
          } catch (error) {
            stats.errors++
            logger.error(
              'scraper:bootstrap',
              `❌ Error processing ${countryNode.name}: ${error}`,
            )
          }
        }

        const continentDuration = this.formatDuration(
          Date.now() - continentStart,
        )
        logger.info(
          'scraper:bootstrap',
          `✅ ${continentNode.name} completed in ${continentDuration} - ${countryNodes.length} countries processed`,
        )
      } catch (error) {
        stats.errors++
        logger.error(
          'scraper:bootstrap',
          `❌ Error processing continent ${continentNode.name}: ${error}`,
        )
      }
    }

    // Final report
    const totalDuration = this.formatDuration(Date.now() - stats.startTime)

    logger.info('scraper:bootstrap', '🎉 WORLD SCRAPING COMPLETED')
    logger.info('scraper:bootstrap', `Continents: ${stats.continents}`)
    logger.info('scraper:bootstrap', `Countries: ${stats.countries}`)
    logger.info('scraper:bootstrap', `Regions: ${stats.regions}`)
    logger.info('scraper:bootstrap', `Crags: ${stats.crags}`)
    logger.info('scraper:bootstrap', `Areas: ${stats.areas}`)
    logger.info('scraper:bootstrap', `Sectors: ${stats.sectors}`)
    logger.info('scraper:bootstrap', `Routes: ${stats.routes}`)
    logger.info('scraper:bootstrap', `Errors: ${stats.errors}`)
    logger.info('scraper:bootstrap', `Total Duration: ${totalDuration}`)
  }

  private async processCountry(
    countryExternalId: number,
    countryName: string,
    continentId: string,
    geometryData: any,
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
    const countryInfo = await this.scraper.getNodeInfo(countryExternalId)
    const geometry = geometryData ?? countryInfo?.geometry
    const countryEntity = CountryEntity.create(
      ExternalId.create(countryExternalId),
      continentId,
      countryName,
      geometry ? Geometry.fromJSON(geometry) : null,
    )
    const savedCountry = await this.countryRepo.save(countryEntity)
    const countryId = savedCountry.id

    logger.debug('scraper:bootstrap', `💾 Country saved: ${savedCountry.name}`)

    // Get all regions in this country
    const regionNodes = await this.scraper.getChildren(countryExternalId)

    if (regionNodes.length === 0) {
      logger.debug('scraper:bootstrap', 'ℹ️  No regions found')
      return countryStats
    }

    logger.debug('scraper:bootstrap', `📍 Found ${regionNodes.length} regions`)

    // Process each region
    for (const regionNode of regionNodes) {
      try {
        // Save or get region
        const regionInfo = await this.scraper.getNodeInfo(regionNode.id)
        const regionGeometry = regionNode.geometry ?? regionInfo?.geometry
        const regionEntity = new RegionEntity(
          RegionId.generate(),
          ExternalId.create(regionNode.id),
          countryId,
          Name.create(regionNode.name),
          regionGeometry ? Geometry.fromJSON(regionGeometry) : null,
        )
        const savedRegion = await this.regionRepo.saveByExternalId(regionEntity)
        countryStats.regions++

        // Get all children of this region (crags and sub-areas)
        await this.processRegionChildren(
          regionNode.id,
          savedRegion.id,
          countryId,
          countryStats,
        )
      } catch (error) {
        countryStats.errors++
        logger.error(
          'scraper:bootstrap',
          `❌ Error processing region ${regionNode.name}: ${error}`,
        )
      }
    }

    return countryStats
  }

  private async processRegionChildren(
    nodeId: number,
    regionId: RegionId,
    countryId: CountryId,
    stats: CountryStats,
  ): Promise<void> {
    const children = await this.scraper.getChildren(nodeId)

    for (const child of children) {
      try {
        const [info, hasRoutes] = await Promise.all([
          this.scraper.getNodeInfo(child.id),
          this.scraper.getRoutes(child.id).then((r) => r.length > 0),
        ])

        const geometry = info?.geometry ?? child.geometry
        const isCragLevel = child.type === 'Crag'

        if (isCragLevel || hasRoutes) {
          // This is a Crag - save it
          const cragData = this.mapper.mapToCrag(
            child.id,
            child.name,
            countryId,
            geometry,
            info,
            regionId,
          )
          const crag = await this.cragRepo.saveByExternalId(
            this.mapper.createCragEntity(cragData),
          )
          stats.crags++

          // Process crag children (areas/sectors)
          await this.processCragChildren(child.id, crag.id, stats)
        } else {
          // This is a sub-region or area, recurse
          await this.processRegionChildren(child.id, regionId, countryId, stats)
        }
      } catch (error) {
        stats.errors++
        logger.error(
          'scraper:bootstrap',
          `❌ Error processing ${child.name}: ${error}`,
        )
      }
    }
  }

  private async processCragChildren(
    nodeId: number,
    cragId: CragId,
    stats: CountryStats,
    parentAreaId: AreaId | null = null,
  ): Promise<void> {
    const [info, children, routes] = await Promise.all([
      this.scraper.getNodeInfo(nodeId),
      this.scraper.getChildren(nodeId),
      this.scraper.getRoutes(nodeId),
    ])

    // If has routes, this is a sector
    if (routes.length > 0) {
      // Create area if needed
      let areaId = parentAreaId
      if (!areaId) {
        const areaData = this.mapper.mapToArea(
          nodeId,
          'Default Area',
          cragId,
          null,
          info?.geometry,
          info,
          'Area',
        )
        const area = await this.areaRepo.saveByExternalId(
          this.mapper.createAreaEntity(areaData),
        )
        areaId = area.id
        stats.areas++
      }

      // Create sector
      const sectorData = this.mapper.mapToSector(
        nodeId,
        info?.name || 'Sector',
        areaId,
        info?.geometry,
        info,
        'Sector',
      )
      const sector = await this.sectorRepo.saveByExternalId(
        this.mapper.createSectorEntity(sectorData),
      )
      stats.sectors++

      // Save routes
      for (const route of routes) {
        const routeData = this.mapper.mapToRoute(route, sector.id)
        await this.routeRepo.saveByExternalId(
          this.mapper.createRouteEntity(routeData),
        )
        stats.routes++
      }
    }

    // Process children recursively
    for (const child of children) {
      await this.processCragChildren(child.id, cragId, stats, parentAreaId)
    }
  }

  private loadCheckpoint(): Checkpoint | null {
    if (!fs.existsSync(CHECKPOINT_FILE)) {
      return null
    }
    try {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      logger.error(
        'scraper:bootstrap',
        `⚠️  Failed to load checkpoint: ${error}`,
      )
      return null
    }
  }

  private saveCheckpoint(checkpoint: Checkpoint): void {
    try {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2))
    } catch (error) {
      logger.error(
        'scraper:bootstrap',
        `⚠️  Failed to save checkpoint: ${error}`,
      )
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }
}

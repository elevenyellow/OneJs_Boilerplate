// Domain - Entities
export { ClimbingZoneEntity, type ClimbType } from './domain/entities/climbing-zone.entity'
export { ClimbingRouteEntity, type RouteType } from './domain/entities/climbing-route.entity'

// Domain - DTOs
export { ScrapedZoneDto, type ScrapedZoneData } from './domain/dtos/scraped-zone.dto'
export { ScrapeOptions, type ScrapeOptionsDto } from './domain/dtos/scrape-options.dto'
export { CragAreaDto, type CragAreaData } from './domain/dtos/crag-area.dto'

// Domain - Events
export { ZonesScrapedEvent } from './domain/events/zones-scraped.event'
export { ZoneSyncedEvent } from './domain/events/zone-synced.event'

// Application - Use Cases
export { ScrapeZonesUseCase, type ScrapeZonesResult } from './application/use-cases/scrape-zones.use-case'
export { SyncZonesUseCase, type SyncResult, type SyncError } from './application/use-cases/sync-zones.use-case'

// Application - Services
export { TheCragParserService, type ParsedAreaLink } from './application/services/thecrag-parser.service'
export { ScrapeOnDemandService } from './application/services/scrape-on-demand.service'

// Infrastructure - Scrapers
export {
  TheCragScraper,
  type ScrapeResult,
  type ScrapeError,
  type ScrapeStats,
} from './infrastructure/scrapers/thecrag.scraper'

// Infrastructure - Persistence
export { ZonePrismaRepository } from './infrastructure/persistence/prisma/zone.repository'
export { CragAreaRepository } from './infrastructure/persistence/prisma/crag-area.repository'

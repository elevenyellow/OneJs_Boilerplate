// Domain - DTOs
export {
  parseHeight,
  type ScrapedCragNode,
  type ScrapedNodeInfo,
  type ScrapedRouteData,
} from './domain/dtos/scraped-node.dto'

// Application - Services
export {
  CragImporterService,
  type ImportError,
  type ImportOptions,
  type ImportResult,
} from './application/services/crag-importer.service'

export { ScraperQueueService } from './application/services/scraper-queue.service'

export {
  ScrapedDataMapperService,
  type ValidatedAreaData,
  type ValidatedCragData,
  type ValidatedRouteData,
  type ValidatedSectorData,
} from './application/services/scraped-data-mapper.service'

// Application - Use Cases
export {
  ImportCragUseCase,
  type ImportCragInput,
  type ImportFromJsonInput,
} from './application/use-cases/import-crag.use-case'

// Infrastructure - Scrapers
export { TheCragApiScraper } from './infrastructure/scrapers/thecrag-api.scraper'

// Infrastructure - Jobs
export {
  SCRAPE_QUEUE,
  ScrapeCountryJob,
  type ScrapeCountryJobData,
} from './infrastructure/jobs/scrape-country.job'

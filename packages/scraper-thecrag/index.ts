// Domain - DTOs
export {
  parseHeight,
  type ScrapedCragNode,
  type ScrapedNodeInfo,
  type ScrapedRouteData,
} from './domain/dtos/scraped-node.dto'

export {
  parseTopoPoints,
  topoPointsToSvgPath,
  generateTopoSvg,
  type TopoRouteAnnotation,
  type TopoPoint,
  type TopoImageData,
  type HeaderImageData,
} from './domain/dtos/topo-image.dto'

// Application - Services
export {
  CragImporterService,
  type ImportError,
  type ImportOptions,
  type ImportResult,
} from './application/services/crag-importer.service'

export {
  ScrapedDataMapperService,
  type ValidatedAreaData,
  type ValidatedCragData,
  type ValidatedRouteData,
  type ValidatedSectorData,
} from './application/services/scraped-data-mapper.service'

export {
  TopoRendererService,
  type TopoRenderOptions,
} from './application/services/topo-renderer.service'

// Application - Use Cases
export {
  ImportCragUseCase,
  type ImportCragInput,
  type ImportFromJsonInput,
} from './application/use-cases/import-crag.use-case'

// Infrastructure - Scrapers
export {
  TheCragApiScraper,
  type ScraperOptions,
} from './infrastructure/scrapers/thecrag-api.scraper'
export {
  TheCragWebScraper,
  type WebScrapedData,
  type ScrapedAreaInfo,
} from './infrastructure/scrapers/thecrag-web.scraper'

import { Inject, Injectable } from '@OneJs/core'
import { CountryId } from '@climb-zone/crag'
import { RegionId } from '@climb-zone/region'
import {
  CragImporterService,
  type ImportOptions,
  type ImportResult,
} from '@scraper-thecrag/application/services/crag-importer.service'
import type { ScrapedCragNode } from '@scraper-thecrag/domain/dtos/scraped-node.dto'
import { TheCragApiScraper } from '@scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'

export interface ImportCragInput {
  cragId: number
  cragName: string
  countryId: CountryId
  regionId?: RegionId | null
  cookie?: string
  delayMs?: number
}

export interface ImportFromJsonInput {
  data: ScrapedCragNode
  countryId: CountryId
  regionId?: RegionId | null
}

/**
 * Use case for importing a crag from TheCrag
 * Can scrape live or import from pre-scraped JSON data
 */
@Injectable()
export class ImportCragUseCase {
  constructor(
    @Inject(TheCragApiScraper)
    private readonly scraper: TheCragApiScraper,
    @Inject(CragImporterService)
    private readonly importer: CragImporterService,
  ) {}

  /**
   * Scrape a crag from TheCrag and import it into the database
   */
  async execute(input: ImportCragInput): Promise<ImportResult> {
    console.log(`\n🧗 Starting scrape and import for ${input.cragName}...`)

    // Configure scraper
    if (input.cookie) {
      this.scraper.setCookie(input.cookie)
    }
    if (input.delayMs) {
      this.scraper.setDelay(input.delayMs)
    }

    // Scrape the crag
    const scrapedData = await this.scraper.scrapeCrag(
      input.cragId,
      input.cragName,
    )

    // Import into database
    const options: ImportOptions = {
      countryId: input.countryId,
      regionId: input.regionId,
    }

    return this.importer.importCrag(scrapedData, options)
  }

  /**
   * Import from pre-scraped JSON data (e.g., from chulilla_data.json)
   */
  async executeFromJson(input: ImportFromJsonInput): Promise<ImportResult> {
    console.log(`\n🔄 Importing ${input.data.name} from JSON...`)

    const options: ImportOptions = {
      countryId: input.countryId,
      regionId: input.regionId,
    }

    return this.importer.importCrag(input.data, options)
  }
}

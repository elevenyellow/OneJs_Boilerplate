import { Inject, Injectable } from '@OneJs/core'
import { TheCragScraper } from '../../infrastructure/scrapers/thecrag.scraper'

@Injectable()
export class ScrapeOnDemandService {
  constructor(
    @Inject(TheCragScraper)
    private readonly scraper: TheCragScraper,
  ) {}

  async search(query: string) {
    return this.scraper.search(query)
  }

  async getAreaChildren(externalId: string) {
    return this.scraper.getAreaChildren(externalId)
  }
}

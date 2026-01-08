import { Inject } from '@OneJs/core'
import { Controller, Get, type Context } from '@OneJs/server'
import { ScrapeOnDemandService } from '@scraper-thecrag/application/services/scrape-on-demand.service'

@Controller('/scrape')
export class ScrapeController {
  constructor(
    @Inject(ScrapeOnDemandService)
    private readonly service: ScrapeOnDemandService,
  ) {}

  @Get('/search')
  async search(context: Context) {
    const { q } = context.query as { q: string }
    if (!q) {
      throw new Error('Query parameter "q" is required')
    }
    return this.service.search(q)
  }

  @Get('/countries')
  async getCountries() {
    // Países principales de escalada
    const countries = [
      { id: '7546063', name: 'Spain', slug: 'spain' },
      { id: '11882473', name: 'France', slug: 'france' },
      { id: '81852390', name: 'Italy', slug: 'italy' },
      { id: '11871253', name: 'New Zealand', slug: 'new-zealand' },
      { id: '12476041', name: 'Australia', slug: 'australia' },
    ]
    return countries
  }

  @Get('/area/:externalId/children')
  async getAreaChildren(context: Context) {
    const { externalId } = context.params as { externalId: string }
    return this.service.getAreaChildren(externalId)
  }
}

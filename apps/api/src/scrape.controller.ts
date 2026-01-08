import { ContinentPrismaRepository } from '@climb-zone/continent'
import { CountryPrismaRepository } from '@climb-zone/country'
import { Inject } from '@OneJs/core'
import { Controller, Get, type Context } from '@OneJs/server'
import { TheCragApiScraper } from '@scraper-thecrag'

@Controller('/scrape')
export class ScrapeController {
  constructor(
    @Inject(TheCragApiScraper)
    private readonly scraper: TheCragApiScraper,
    @Inject(ContinentPrismaRepository)
    private readonly continentRepo: ContinentPrismaRepository,
    @Inject(CountryPrismaRepository)
    private readonly countryRepo: CountryPrismaRepository,
  ) {}

  @Get('/continents')
  async getContinents() {
    const continents = await this.continentRepo.findAll()
    return continents.map((c) => ({
      id: c.id.toString(),
      externalId: c.externalId.toNumber(),
      name: c.name,
    }))
  }

  @Get('/countries')
  async getCountries() {
    const countries = await this.countryRepo.findAll()
    return countries.map((c) => ({
      id: c.id.toString(),
      externalId: c.externalId.toNumber(),
      continentId: c.continentId.toString(),
      name: c.name,
    }))
  }

  @Get('/continent/:continentId/countries')
  async getCountriesByContinent(context: Context) {
    const { continentId } = context.params as { continentId: string }
    const { ContinentId } = await import('@climb-zone/continent')
    const countries = await this.countryRepo.findByContinent(
      ContinentId.fromString(continentId),
    )
    return countries.map((c) => ({
      id: c.id.toString(),
      externalId: c.externalId.toNumber(),
      name: c.name,
    }))
  }

  @Get('/area/:externalId/children')
  async getAreaChildren(context: Context) {
    const { externalId } = context.params as { externalId: string }
    const children = await this.scraper.getChildren(parseInt(externalId, 10))
    return children.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    }))
  }
}

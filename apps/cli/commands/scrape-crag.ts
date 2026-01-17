import { Inject, Injectable, logger } from '@OneJs/core'
import { ScrapeCragUseCase } from '@the-crag/application/use-cases/scrape-crag.use-case'

@Injectable()
export class ScrapeCragCommand {
  constructor(
    @Inject(ScrapeCragUseCase)
    private readonly scrapeCragUseCase: ScrapeCragUseCase,
  ) {}

  async execute(args: string[]): Promise<void> {
    const cragUrl = args[0]

    if (!cragUrl) {
      logger.error('Usage: scrape-crag <crag-url>')
      logger.info('Example: scrape-crag climbing/spain/valencia/jerica')
      process.exit(1)
    }

    // logger.info(`Starting scrape for: ${cragUrl}`)

    const result = await this.scrapeCragUseCase.execute(cragUrl)

    logger.info('Scraping completed!')
    logger.info(`  Crag: ${result.cragName} (${result.cragId})`)
    logger.info(`  Zones: ${result.zonesCount}`)
    logger.info(`  Sectors: ${result.sectorsCount}`)
    logger.info(`  Routes: ${result.routesCount}`)
    logger.info(`  Topos: ${result.toposCount}`)
  }
}

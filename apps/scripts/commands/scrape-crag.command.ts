import { TheCragApiScraper } from '@scraper-thecrag'
import { NodeId } from '@scraper-thecrag/domain/value-objects/node-id.vo'

export async function scrapeCrag(container: unknown, cookie: string) {
  const cragId = process.argv[3]

  const dic = container as { get: <T>(token: unknown) => T }

  // const importer = dic.get<CragImporterService>(CragImporterService)

  const apiScraper = dic.get<TheCragApiScraper>(TheCragApiScraper)

  // Configure scrapers
  apiScraper.setCookie(cookie)
  apiScraper.setDelay(200)

  console.log('🏔️  SCRAPE CRAG - Full crag import by name')
  console.log('='.repeat(80))
  console.log('')
  console.log(`📍 Searching for: "${cragId}"`)
  console.log('')

  // await apiScraper.getRouteIds(NodeId.create(cragId))

  // Scrapear un área completa (devuelve ScrapedArea entity)
  const area = await apiScraper.scrapeArea(NodeId.create(cragId))
  console.log(area.toDto())

  // Scrapear una ruta completa (devuelve ScrapedRoute entity)
  // await apiScraper.scrapeRoute(NodeId.create(cragId))
}

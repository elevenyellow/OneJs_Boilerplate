import { NodeId } from '@scraper-thecrag/domain/value-objects/node-id.vo'
import { NodeType } from '@scraper-thecrag/domain/value-objects/node-type.vo'
import { TheCragApiScraper } from '@scraper-thecrag/infrastructure/scrapers/scraper'

export async function scrapeCrag(container: unknown, cookie: string) {
  const areaIdArg = process.argv[3]

  const scraper = new TheCragApiScraper()
  scraper.setCookie(cookie)
  scraper.setDelay(200)

  // Scraper now returns proper domain entities (ScrapedArea or ScrapedSector)
  const cragData = await scraper.scrapeCrag(
    NodeId.createFrom(Number.parseInt(areaIdArg)),
    NodeType.crag(),
  )

  // Output the DTO for readability
  console.log(JSON.stringify(cragData.toDto(), null, 2))
}

import { TheCragApiScraper } from './packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'
import { ProxyManager } from './packages/scraper-thecrag/infrastructure/utils/proxy-manager'
import { NodeId } from './packages/scraper-thecrag/domain/value-objects/node-id.vo'

async function testParseRoutesFromHtml() {
  console.log('🧪 Testing parseRoutesFromHtml method...\n')

  const proxyManager = new ProxyManager()
  const scraper = new TheCragApiScraper(proxyManager)

  // Scrape the sector we tested before
  const sectorId = NodeId.create(164277735) // L'Horta vertical
  console.log(`Scraping sector: ${sectorId.toString()}\n`)

  const area = await scraper.scrapeArea(sectorId)

  console.log('✅ Area scraped successfully')
  console.log(`   Name: ${area.getName()}`)
  console.log(`   Slug: ${area.getSlug()}`)

  // Use reflection to access private method
  const scraperAny = scraper as any
  const html = area.getRawHtmlResponse()?.getRawHtml() || ''
  
  console.log(`\n📄 HTML size: ${html.length} bytes`)
  
  const parsedRoutes = scraperAny.parseRoutesFromHtml(html)
  
  console.log(`\n📊 Parsed ${parsedRoutes.length} routes from HTML\n`)

  // Show first 3 routes in detail
  parsedRoutes.slice(0, 3).forEach((route: any, i: number) => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Route ${i + 1}: ${route.name}`)
    console.log('='.repeat(60))
    console.log(`ID: ${route.id}`)
    console.log(`Grade: ${route.grade} (${route.gradeContext})`)
    console.log(`Stars: ${route.stars}`)
    console.log(`Style: ${route.styleStub}`)
    console.log(`Height: ${route.displayHeight}m`)
    console.log(`Bolts: ${route.bolts || 'N/A'}`)
    console.log(`Equipper: ${route.equipperName || 'N/A'}`)
    console.log(`Date: ${route.dateEquipped || 'N/A'}`)
    if (route.alternativeNames.length > 0) {
      console.log(`AKA: ${route.alternativeNames.join(', ')}`)
    }
    if (route.popularity) {
      console.log(`Popularity: ${route.popularity.score} (${route.popularity.ascents} ascents)`)
    }
    if (route.description) {
      console.log(`Description: ${route.description.slice(0, 100)}${route.description.length > 100 ? '...' : ''}`)
    }
  })

  console.log(`\n\n${'='.repeat(60)}`)
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`\n✅ Successfully parsed ${parsedRoutes.length} routes`)
  console.log('\nData availability:')
  
  const hasGrade = parsedRoutes.filter((r: any) => r.grade).length
  const hasStars = parsedRoutes.filter((r: any) => r.stars).length
  const hasHeight = parsedRoutes.filter((r: any) => r.displayHeight).length
  const hasBolts = parsedRoutes.filter((r: any) => r.bolts).length
  const hasDescription = parsedRoutes.filter((r: any) => r.description).length
  const hasEquipper = parsedRoutes.filter((r: any) => r.equipperName).length
  const hasPopularity = parsedRoutes.filter((r: any) => r.popularity).length

  console.log(`   Grade: ${hasGrade}/${parsedRoutes.length} (${Math.round(hasGrade / parsedRoutes.length * 100)}%)`)
  console.log(`   Stars: ${hasStars}/${parsedRoutes.length} (${Math.round(hasStars / parsedRoutes.length * 100)}%)`)
  console.log(`   Height: ${hasHeight}/${parsedRoutes.length} (${Math.round(hasHeight / parsedRoutes.length * 100)}%)`)
  console.log(`   Bolts: ${hasBolts}/${parsedRoutes.length} (${Math.round(hasBolts / parsedRoutes.length * 100)}%)`)
  console.log(`   Description: ${hasDescription}/${parsedRoutes.length} (${Math.round(hasDescription / parsedRoutes.length * 100)}%)`)
  console.log(`   Equipper: ${hasEquipper}/${parsedRoutes.length} (${Math.round(hasEquipper / parsedRoutes.length * 100)}%)`)
  console.log(`   Popularity: ${hasPopularity}/${parsedRoutes.length} (${Math.round(hasPopularity / parsedRoutes.length * 100)}%)`)
}

testParseRoutesFromHtml()

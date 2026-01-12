/**
 * Test script to save and inspect actual HTML from scraper
 */

import { TheCragApiScraper } from './packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'
import { ProxyManager } from './packages/scraper-thecrag/infrastructure/utils/proxy-manager'
import { NodeId } from './packages/scraper-thecrag/domain/value-objects/node-id.vo'
import { writeFileSync } from 'node:fs'

async function saveHtmlForInspection() {
  console.log('📥 Saving HTML from scraper for inspection...\n')

  const proxyManager = new ProxyManager()
  const scraper = new TheCragApiScraper(proxyManager)

  // Scrape a route
  const routeId = NodeId.create(787145850)
  console.log(`Scraping route: ${routeId.toString()}`)
  
  const route = await scraper.scrapeRoute(routeId)
  const html = route.getRawHtmlResponse()?.getRawHtml() || ''
  
  writeFileSync('/tmp/route-scraped.html', html)
  console.log(`✅ Route HTML saved to /tmp/route-scraped.html (${html.length} bytes)`)

  // Scrape an area
  const areaId = NodeId.create(787116453)
  console.log(`\nScraping area: ${areaId.toString()}`)
  
  const area = await scraper.scrapeArea(areaId)
  const areaHtml = area.getRawHtmlResponse()?.getRawHtml() || ''
  
  writeFileSync('/tmp/area-scraped.html', areaHtml)
  console.log(`✅ Area HTML saved to /tmp/area-scraped.html (${areaHtml.length} bytes)`)

  console.log('\n📊 Summary:')
  console.log(`Route HTML: ${html.length} bytes`)
  console.log(`Area HTML: ${areaHtml.length} bytes`)

  // Show first 500 chars of route HTML
  console.log('\n📄 First 500 chars of route HTML:')
  console.log(html.slice(0, 500))
}

saveHtmlForInspection()

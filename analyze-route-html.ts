/**
 * Test script to check HTML of individual route page
 */

import { TheCragApiScraper } from './packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'
import { ProxyManager } from './packages/scraper-thecrag/infrastructure/utils/proxy-manager'
import { NodeId } from './packages/scraper-thecrag/domain/value-objects/node-id.vo'
import * as cheerio from 'cheerio'

async function analyzeRouteHtml() {
  console.log('🔍 Analyzing HTML of individual route page...\n')

  const proxyManager = new ProxyManager()
  const scraper = new TheCragApiScraper(proxyManager)

  // Test with a specific route: "Usain Parabolt" from Raconet
  const routeId = NodeId.create(787145850)

  console.log(`📍 Scraping route: ${routeId.toString()}\n`)

  // Scrape the route
  const route = await scraper.scrapeRoute(routeId)
  const html = route.getRawHtmlResponse()?.getRawHtml() || ''

  if (!html) {
    console.error('❌ No HTML available')
    return
  }

  console.log(`✅ HTML received (${html.length} bytes)\n`)

  // Parse HTML with cheerio
  const $ = cheerio.load(html)

  console.log('='
.repeat(80))

  // Look for data-route-tick attribute (contains route JSON)
  console.log('\n1️⃣ Checking for data-route-tick attribute...')
  const routeTickElements = $('[data-route-tick]')
  console.log(`   Found ${routeTickElements.length} elements with data-route-tick`)

  if (routeTickElements.length > 0) {
    const routeTickData = routeTickElements.first().attr('data-route-tick')
    
    if (routeTickData) {
      console.log('\n   📦 Route data from data-route-tick:')
      try {
        const parsed = JSON.parse(routeTickData)
        console.log('   Available fields:', Object.keys(parsed))
        console.log('\n   Full data:')
        console.log(JSON.stringify(parsed, null, 4))
      } catch (e) {
        console.log('   Raw data:', routeTickData.slice(0, 500))
      }
    }
  }

  // Look for specific route info
  console.log('\n\n2️⃣ Looking for specific route info...')
  
  const patterns = [
    { selector: '.grade, [class*="grade"]', name: 'Grade' },
    { selector: '.rating, .stars, [class*="star"]', name: 'Rating/Stars' },
    { selector: '.height, .length, [class*="height"], [class*="length"]', name: 'Height/Length' },
    { selector: '.bolts, .protection, [class*="bolt"], [class*="protection"]', name: 'Bolts/Protection' },
    { selector: '.style, .type, [class*="style"], [class*="type"]', name: 'Style/Type' },
    { selector: '.fa, .first-ascent, [class*="first-ascent"]', name: 'First Ascent' },
    { selector: '.description, .beta, [class*="description"]', name: 'Description' },
  ]

  patterns.forEach(({ selector, name }) => {
    const elements = $(selector)
    if (elements.length > 0) {
      console.log(`\n   ✅ ${name} (${elements.length} elements):`)
      elements.slice(0, 3).each((i, el) => {
        const text = $(el).text().trim()
        const classes = $(el).attr('class') || ''
        console.log(`      [${classes}]: ${text.slice(0, 100)}`)
      })
    }
  })

  // Look for metadata tables
  console.log('\n\n3️⃣ Looking for metadata tables...')
  const tables = $('table')
  console.log(`   Found ${tables.length} tables`)

  tables.each((i, table) => {
    const caption = $(table).find('caption').text().trim()
    const rows = $(table).find('tr').length
    console.log(`\n   Table ${i + 1}: ${caption || '(no caption)'} - ${rows} rows`)
    
    // Show first few rows
    $(table).find('tr').slice(0, 3).each((j, row) => {
      const cells = $(row).find('th, td').map((k, cell) => $(cell).text().trim()).get()
      console.log(`      Row ${j + 1}: ${cells.join(' | ')}`)
    })
  })

  // Look for dl/dt/dd (definition lists often used for metadata)
  console.log('\n\n4️⃣ Looking for definition lists (dl/dt/dd)...')
  const dls = $('dl')
  console.log(`   Found ${dls.length} definition lists`)

  dls.slice(0, 2).each((i, dl) => {
    console.log(`\n   List ${i + 1}:`)
    $(dl).find('dt').each((j, dt) => {
      const term = $(dt).text().trim()
      const definition = $(dt).next('dd').text().trim()
      console.log(`      ${term}: ${definition}`)
    })
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Analysis complete')
}

analyzeRouteHtml()

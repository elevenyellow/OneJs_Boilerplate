/**
 * Test script to analyze what route data is available in the sector's HTML
 */

import { TheCragApiScraper } from './packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'
import { ProxyManager } from './packages/scraper-thecrag/infrastructure/utils/proxy-manager'
import { NodeId } from './packages/scraper-thecrag/domain/value-objects/node-id.vo'
import * as cheerio from 'cheerio'

async function analyzeHtmlRouteData() {
  console.log('🔍 Analyzing HTML route data from sector page...\n')

  const proxyManager = new ProxyManager()
  const scraper = new TheCragApiScraper(proxyManager)

  // Test with Altura area (782524281) - parent area with multiple sectors
  const sectorId = NodeId.create(782524281)

  console.log(`📍 Scraping area: ${sectorId.toString()}\n`)

  // Scrape area to get HTML
  const area = await scraper.scrapeArea(sectorId)
  const html = area.getRawHtmlResponse()?.getRawHtml() || ''

  if (!html) {
    console.error('❌ No HTML available')
    return
  }

  console.log(`✅ HTML received (${html.length} bytes)\n`)

  // Parse HTML with cheerio
  const $ = cheerio.load(html)

  console.log('🔍 Looking for route data in HTML...\n')
  console.log('='


.repeat(80))

  // Look for route tables/lists
  console.log('\n1️⃣ Checking for route tables...')
  const routeTables = $('table.routelist, table.routes, .route-table')
  console.log(`   Found ${routeTables.length} route tables`)

  // Look for route rows
  console.log('\n2️⃣ Checking for route rows...')
  const routeRows = $('tr.route, tr[data-route], .route-row, tr[data-route-tick]')
  console.log(`   Found ${routeRows.length} route rows`)

  if (routeRows.length > 0) {
    console.log('\n📋 First route row analysis:')
    const firstRow = routeRows.first()
    
    // Check for data attributes
    console.log('\n   📦 Data attributes:')
    const attrs = firstRow[0]?.attribs || {}
    Object.keys(attrs).forEach(key => {
      if (key.startsWith('data-')) {
        const value = attrs[key]
        console.log(`   - ${key}: ${value.slice(0, 200)}${value.length > 200 ? '...' : ''}`)
      }
    })

    // Check for cells
    console.log('\n   📊 Table cells:')
    firstRow.find('td').each((i, el) => {
      const text = $(el).text().trim()
      const classes = $(el).attr('class') || ''
      console.log(`   - Cell ${i} [${classes}]: ${text.slice(0, 100)}`)
    })
  }

  // Look for data-route-tick attribute (contains route JSON)
  console.log('\n\n3️⃣ Checking for data-route-tick attributes...')
  const routeTickElements = $('[data-route-tick]')
  console.log(`   Found ${routeTickElements.length} elements with data-route-tick`)

  if (routeTickElements.length > 0) {
    const firstElement = routeTickElements.first()
    const routeTickData = firstElement.attr('data-route-tick')
    
    if (routeTickData) {
      console.log('\n   📦 First route-tick data:')
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

  // Look for route info in specific classes
  console.log('\n\n4️⃣ Checking for common route info patterns...')
  const patterns = [
    { selector: '.grade', name: 'Grade' },
    { selector: '.rating, .stars', name: 'Rating/Stars' },
    { selector: '.height, .length', name: 'Height/Length' },
    { selector: '.bolts, .protection', name: 'Bolts/Protection' },
    { selector: '.style, .type', name: 'Style/Type' },
    { selector: '.fa, .first-ascent', name: 'First Ascent' },
  ]

  patterns.forEach(({ selector, name }) => {
    const elements = $(selector)
    if (elements.length > 0) {
      console.log(`   ✅ ${name}: ${elements.length} elements`)
      console.log(`      Example: ${elements.first().text().trim().slice(0, 100)}`)
    }
  })

  // Look for route descriptions
  console.log('\n\n5️⃣ Checking for route descriptions...')
  const descriptions = $('.description, .route-description, .beta')
  console.log(`   Found ${descriptions.length} description elements`)

  if (descriptions.length > 0) {
    console.log(`   First description: ${descriptions.first().text().trim().slice(0, 200)}`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Analysis complete')
}

analyzeHtmlRouteData()

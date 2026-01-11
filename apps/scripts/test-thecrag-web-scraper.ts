/**
 * Test script for TheCrag Web Scraper
 * 
 * Usage:
 *   bun run apps/scripts/test-thecrag-web-scraper.ts
 *   bun run apps/scripts/test-thecrag-web-scraper.ts "/en/climbing/europe"
 *   bun run apps/scripts/test-thecrag-web-scraper.ts "/en/climbing/europe/spain"
 * 
 * Note: Use paths starting with /en/climbing/ for public access
 */

import { TheCragWebScraper } from '@scraper-thecrag'

async function main() {
  const scraper = new TheCragWebScraper()
  
  // Optional: Set a cookie if you have one (for logged-in access)
  // scraper.setCookie('your_cookie_here')
  
  // Optional: Adjust delay between requests
  scraper.setDelay(200)

  // Get the path from command line args or use default (public world page)
  const path = process.argv[2] || '/en/climbing/world'

  console.log('🕷️  TheCrag Web Scraper Test\n')
  console.log(`📍 Path: ${path}\n`)
  console.log('─'.repeat(50))

  try {
    // Test 1: Scrape a zone page
    console.log('\n📄 Testing scrapeZonePage...')
    const zoneData = await scraper.scrapeZonePage(path)
    
    console.log('\n✅ Zone Data:')
    console.log(`   Title: ${zoneData.title || 'N/A'}`)
    console.log(`   Description: ${(zoneData.description || 'N/A').substring(0, 100)}...`)
    console.log(`   Breadcrumbs: ${zoneData.breadcrumbs?.join(' > ') || 'N/A'}`)
    console.log(`   Coordinates: ${zoneData.coordinates ? `${zoneData.coordinates.lat}, ${zoneData.coordinates.lng}` : 'N/A'}`)
    console.log(`   Stats:`, zoneData.stats || {})
    console.log(`   Images found: ${zoneData.imageUrls?.length || 0}`)
    console.log(`   Areas found: ${zoneData.areas?.length || 0}`)
    
    if (zoneData.areas && zoneData.areas.length > 0) {
      console.log('\n   🌍 Areas/Regions:')
      zoneData.areas.slice(0, 10).forEach((area, i) => {
        const typeLabel = area.type ? ` (${area.type})` : ''
        const locatedLabel = area.located ? ' ✓' : ''
        console.log(`      ${i + 1}. [${area.nodeId}] ${area.name}${typeLabel}${locatedLabel}`)
        console.log(`         ${area.url}`)
      })
    }

    // Test 2: Scrape area list
    console.log('\n' + '─'.repeat(50))
    console.log('\n📋 Testing scrapeAreaList...')
    const areas = await scraper.scrapeAreaList(path)
    
    console.log(`\n✅ Found ${areas.length} areas`)
    if (areas.length > 0) {
      console.log('\n   First 5 areas:')
      areas.slice(0, 5).forEach((area, i) => {
        const typeLabel = area.type ? ` (${area.type})` : ''
        console.log(`      ${i + 1}. [nodeId: ${area.nodeId}] ${area.name}${typeLabel}`)
      })
    }

    // Test 3: Drill down into Europe
    console.log('\n' + '─'.repeat(50))
    console.log('\n🇪🇺 Testing drill-down into Europe...')
    const europeData = await scraper.scrapeZonePage('/en/climbing/europe')
    
    console.log(`\n✅ Europe - Found ${europeData.areas?.length || 0} countries/regions`)
    if (europeData.areas && europeData.areas.length > 0) {
      console.log('\n   First 10 countries in Europe:')
      europeData.areas.slice(0, 10).forEach((area, i) => {
        const typeLabel = area.type ? ` (${area.type})` : ''
        console.log(`      ${i + 1}. ${area.name}${typeLabel}`)
      })
    }

    // Test 4: Raw page fetch
    console.log('\n' + '─'.repeat(50))
    console.log('\n📥 Testing fetchPage (raw HTML)...')
    const rawHtml = await scraper.fetchPage(path)
    console.log(`\n✅ Fetched ${rawHtml.length} bytes of HTML`)

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }

  console.log('\n' + '─'.repeat(50))
  console.log('\n✨ All tests completed!\n')
}

if (import.meta.main) { main() }

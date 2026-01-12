import { load } from 'cheerio'
import { readFileSync } from 'node:fs'

async function analyzeRouteDataInHtml() {
  console.log('📊 Analyzing route data in HTML...\n')

  const html = readFileSync('/tmp/test-real-html.html', 'utf-8')
  const $ = load(html)

  console.log(`HTML size: ${html.length} bytes\n`)

  // Find all route divs
  const routes = $('.route[data-nid][data-route-tick]')
  console.log(`Found ${routes.length} routes with data-route-tick attribute\n`)

  // Analyze first 3 routes in detail
  routes.slice(0, 3).each((i, el) => {
    const $route = $(el)
    const nid = $route.attr('data-nid')
    const routeTickJson = $route.attr('data-route-tick') || ''
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Route ${i + 1}: NID ${nid}`)
    console.log('='.repeat(60))

    // Parse data-route-tick JSON
    try {
      const routeTick = JSON.parse(routeTickJson.replace(/&quot;/g, '"'))
      console.log('\n📋 data-route-tick JSON:')
      console.log(JSON.stringify(routeTick, null, 2))
    } catch (e) {
      console.log('❌ Failed to parse data-route-tick:', e)
    }

    // Extract route name from HTML structure
    const name = $route.find('.name .primary-node-name').text().trim()
    const aka = $route.find('.name .aka').next().text().trim()
    console.log(`\n📝 Name: ${name}`)
    if (aka) console.log(`   AKA: ${aka}`)

    // Extract description
    const description = $route.find('.markdown.desc').text().trim()
    if (description) {
      console.log(`\n📄 Description:\n${description.slice(0, 200)}${description.length > 200 ? '...' : ''}`)
    }

    // Extract route history
    const histWhat = $route.find('.route-history .fa__what').text().trim()
    const histWho = $route.find('.route-history .fa__who').text().trim()
    const histWhen = $route.find('.route-history .fa__when').text().trim()
    
    if (histWhat || histWho || histWhen) {
      console.log(`\n🏔️ Route History:`)
      console.log(`   What: ${histWhat}`)
      console.log(`   Who: ${histWho}`)
      console.log(`   When: ${histWhen}`)
    }

    // Extract number of bolts from bolts span
    const boltsText = $route.find('.bolts').attr('title')
    if (boltsText) {
      console.log(`\n🔩 Bolts: ${boltsText}`)
    }

    // Extract popularity
    const popTitle = $route.find('.r-pop a').attr('title')
    if (popTitle) {
      console.log(`\n📈 Popularity: ${popTitle}`)
    }
  })

  console.log(`\n\n${'='.repeat(60)}`)
  console.log('SUMMARY: Available route data in HTML')
  console.log('='.repeat(60))
  console.log('\n✅ From data-route-tick JSON:')
  console.log('   - id, name, grade, stars, style')
  console.log('   - displayHeight (meters)')
  console.log('   - bolts (when available)')
  console.log('   - context (grade system)')
  console.log('   - systems (grade conversions)')
  
  console.log('\n✅ From HTML structure:')
  console.log('   - Route name + aka/alternative names')
  console.log('   - Description (markdown text)')
  console.log('   - Route history (Set/FA info)')
  console.log('   - Equipper/setter name(s)')
  console.log('   - Date equipped')
  console.log('   - Popularity (ascent count)')
  console.log('   - Number of bolts (from title attribute)')

  console.log('\n✅ Available but NOT in our current SVG extraction:')
  console.log('   - Description text')
  console.log('   - Equipper/setter names')
  console.log('   - Date equipped')
  console.log('   - Alternative names (aka)')
  console.log('   - Height in meters (more precise than SVG)')
  console.log('   - Number of bolts')
  console.log('   - Ascent count / popularity')
}

analyzeRouteDataInHtml()

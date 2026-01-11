/**
 * Scrape a sector with topos and generate composite images
 *
 * Usage:
 *   bun run apps/scripts/scrape-sector-with-topos.ts "/en/climbing/spain/siurana/can-melafots"
 *
 * With authentication (required for some features):
 *   THECRAG_COOKIE="your_cookie" bun run apps/scripts/scrape-sector-with-topos.ts "/en/climbing/spain/siurana/can-melafots"
 *
 * To get the cookie:
 *   1. Open TheCrag in your browser and log in
 *   2. Open DevTools (F12) → Network tab
 *   3. Reload the page and click on any request
 *   4. Copy the Cookie header value
 */

import { TheCragApiScraper, TopoRendererService } from '@scraper-thecrag'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const OUTPUT_DIR = './output/sector-topos'

async function main() {
  const scraper = new TheCragApiScraper()
  const renderer = new TopoRendererService()

  // Get sector path from command line
  const sectorPath = process.argv[2]
  if (!sectorPath) {
    console.log('Usage: bun run apps/scripts/scrape-sector-with-topos.ts "/en/climbing/spain/siurana/can-melafots"')
    console.log('\nWith cookie:')
    console.log('  THECRAG_COOKIE="..." bun run apps/scripts/scrape-sector-with-topos.ts "..."')
    process.exit(1)
  }

  // Set cookie if provided
  const cookie = process.env.THECRAG_COOKIE
  if (cookie) {
    scraper.setCookie(cookie)
    console.log('🔐 Using authentication cookie')
  } else {
    console.log('⚠️  No cookie provided - some features may not work')
    console.log('   Set THECRAG_COOKIE env var for full access\n')
  }

  console.log('🧗 Sector Scraper with Topos\n')
  console.log('─'.repeat(60))
  console.log(`\n📍 Path: ${sectorPath}`)

  scraper.setDelay(300)

  try {
    await mkdir(OUTPUT_DIR, { recursive: true })

    // Step 1: Get topos from the sector page
    console.log('\n🗺️  Fetching topos...')
    const topos = await scraper.getToposFromSectorPage(sectorPath)
    
    if (topos.length === 0) {
      console.log('\n⚠️  No topos found. Possible reasons:')
      console.log('   - The sector has no photo topos')
      console.log('   - Authentication required (set THECRAG_COOKIE)')
      console.log('   - Rate limiting (wait and try again)')
      return
    }

    console.log(`   ✅ Found ${topos.length} topos\n`)

    // Step 2: Process each topo
    console.log('─'.repeat(60))
    console.log('\n🎨 Generating composite images...\n')

    const sectorName = sectorPath.split('/').pop() || 'sector'

    for (let i = 0; i < topos.length; i++) {
      const topo = topos[i]
      console.log(`\n📷 Topo ${i + 1}/${topos.length}: ${topo.topoId}`)
      console.log(`   Size: ${topo.originalWidth}x${topo.originalHeight}`)
      console.log(`   Routes: ${topo.routes.length}`)

      // Show routes
      for (const route of topo.routes.slice(0, 5)) {
        console.log(`     ${route.num}. ${route.name} (${route.grade}) ${route.stars}`)
      }
      if (topo.routes.length > 5) {
        console.log(`     ... and ${topo.routes.length - 5} more`)
      }

      // Generate composite
      try {
        const filename = `${sectorName}_topo_${topo.topoId}.png`
        const outputPath = join(OUTPUT_DIR, filename)

        console.log(`\n   Generating composite...`)
        await renderer.generateCompositeImage(
          topo,
          {
            showNumbers: true,
            showGrades: true,
            lineWidth: 2,
            fontSize: 8,
            theCragStyle: true,
          },
          outputPath,
        )
        console.log(`   ✅ Saved: ${filename}`)

        // Also save the SVG
        const svgPath = join(OUTPUT_DIR, `${sectorName}_topo_${topo.topoId}.svg`)
        await renderer.saveSvgOverlay(topo, svgPath, {
          showNumbers: true,
          showGrades: true,
          theCragStyle: true,
        })
        console.log(`   ✅ Saved SVG: ${sectorName}_topo_${topo.topoId}.svg`)

      } catch (err) {
        console.log(`   ❌ Error: ${err}`)
      }
    }

    // Save topos data as JSON
    const jsonPath = join(OUTPUT_DIR, `${sectorName}_topos.json`)
    await Bun.write(jsonPath, JSON.stringify(topos, null, 2))
    console.log(`\n📄 Saved JSON: ${jsonPath}`)

    console.log('\n' + '─'.repeat(60))
    console.log(`\n✨ Done! ${topos.length} composite images saved to: ${OUTPUT_DIR}\n`)

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

if (import.meta.main) { main() }

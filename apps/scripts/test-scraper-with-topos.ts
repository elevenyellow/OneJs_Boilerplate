/**
 * Test the TheCrag API Scraper with topo extraction
 *
 * Usage:
 *   bun run apps/scripts/test-scraper-with-topos.ts
 *   bun run apps/scripts/test-scraper-with-topos.ts <nodeId> <name>
 *
 * Example:
 *   bun run apps/scripts/test-scraper-with-topos.ts 16222921 "Can Melafots"
 */

import {
  TheCragApiScraper,
  TopoRendererService,
  type ScrapedCragNode,
} from '@scraper-thecrag'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const OUTPUT_DIR = './output/scraper-test'

async function main() {
  const scraper = new TheCragApiScraper()
  const renderer = new TopoRendererService()

  // Can Melafots sector ID (Siurana)
  const nodeId = parseInt(process.argv[2] || '16222921', 10)
  const nodeName = process.argv[3] || 'Can Melafots'

  console.log('🧗 TheCrag API Scraper - Topo Extraction Test\n')
  console.log('─'.repeat(60))
  console.log(`\n📍 Node: ${nodeName} (ID: ${nodeId})`)

  // Set scraper options
  scraper.setDelay(200)
  scraper.setOptions({
    includeTopos: true, // Enable topo extraction
  })

  // Set cookie for authenticated access (required by TheCrag API)
  const cookie = process.env.THECRAG_COOKIE
  if (cookie) {
    scraper.setCookie(cookie)
    console.log('🔐 Using authentication cookie')
  } else {
    console.log('⚠️  No THECRAG_COOKIE set - API may reject requests')
    console.log('   Set it with: THECRAG_COOKIE="your_cookie" bun run ...')
  }

  try {
    await mkdir(OUTPUT_DIR, { recursive: true })

    console.log('\n🔄 Scraping sector with topos...\n')

    // Scrape the sector
    const result = await scraper.scrapeCrag(nodeId, nodeName, 'Sector')

    // Display results
    console.log('─'.repeat(60))
    console.log('\n✅ Scraping complete!\n')
    displayNode(result, 0)

    // Generate topo composites if any topos found
    if (result.topos && result.topos.length > 0) {
      console.log('\n' + '─'.repeat(60))
      console.log('\n🎨 Generating topo composites...\n')

      for (const topo of result.topos) {
        console.log(`   Processing topo ${topo.topoId}...`)

        try {
          const outputPath = join(
            OUTPUT_DIR,
            `${nodeName.replace(/\s+/g, '_')}_topo_${topo.topoId}.png`,
          )

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

          console.log(`   ✅ Saved: ${outputPath}`)
        } catch (err) {
          console.log(`   ❌ Error: ${err}`)
        }
      }
    }

    // Save raw JSON data
    const jsonPath = join(OUTPUT_DIR, `${nodeName.replace(/\s+/g, '_')}.json`)
    await Bun.write(jsonPath, JSON.stringify(result, null, 2))
    console.log(`\n📄 Saved JSON: ${jsonPath}`)

    console.log('\n' + '─'.repeat(60))
    console.log(`\n✨ Done! Files saved to: ${OUTPUT_DIR}\n`)
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

function displayNode(node: ScrapedCragNode, depth: number): void {
  const indent = '  '.repeat(depth)

  console.log(`${indent}📁 ${node.name} (${node.type}) [ID: ${node.id}]`)

  if (node.info) {
    if (node.info.numberRoutes) {
      console.log(`${indent}   Routes: ${node.info.numberRoutes}`)
    }
    if (node.info.numberTopos) {
      console.log(`${indent}   Topos in DB: ${node.info.numberTopos}`)
    }
    // Show header image URL
    if (node.info.headerImageUrl) {
      console.log(`${indent}   🖼️  Header Image: ${node.info.headerImageUrl.substring(0, 70)}...`)
    }
    // Show overview topo URL
    if (node.info.overviewTopoImageUrl) {
      console.log(`${indent}   🗺️  Overview Topo: ${node.info.overviewTopoImageUrl.substring(0, 70)}...`)
    }
  }

  // Show crag overview topos (panoramic views showing sectors)
  if (node.cragTopos && node.cragTopos.length > 0) {
    console.log(`${indent}   🗺️  ${node.cragTopos.length} crag overview topos:`)
    for (const topo of node.cragTopos) {
      const areaCount = topo.routes.filter(r => r.type === 'area').length
      console.log(
        `${indent}      - Topo ${topo.topoId}: ${areaCount} areas, ${topo.originalWidth}x${topo.originalHeight}`,
      )
      console.log(`${indent}        Full URL: ${topo.fullImageUrl?.substring(0, 60)}...`)
      for (const area of topo.routes.filter(r => r.type === 'area').slice(0, 3)) {
        console.log(
          `${indent}         ${area.num}. ${area.name}`,
        )
      }
      if (areaCount > 3) {
        console.log(`${indent}         ... and ${areaCount - 3} more areas`)
      }
    }
  }

  if (node.routes && node.routes.length > 0) {
    console.log(`${indent}   🧗 ${node.routes.length} routes:`)
    for (const route of node.routes.slice(0, 5)) {
      const stars = route.stars ? '★'.repeat(route.stars) : ''
      console.log(
        `${indent}      - ${route.name} (${route.grade || '?'}) ${stars}`,
      )
    }
    if (node.routes.length > 5) {
      console.log(`${indent}      ... and ${node.routes.length - 5} more`)
    }
  }

  if (node.topos && node.topos.length > 0) {
    console.log(`${indent}   🖼️  ${node.topos.length} photo topos:`)
    for (const topo of node.topos) {
      console.log(
        `${indent}      - Topo ${topo.topoId}: ${topo.routes.length} routes, ${topo.originalWidth}x${topo.originalHeight}`,
      )
      console.log(`${indent}        Full URL: ${topo.fullImageUrl?.substring(0, 60)}...`)
      for (const route of topo.routes.slice(0, 3)) {
        console.log(
          `${indent}         ${route.num}. ${route.name} (${route.grade})`,
        )
      }
      if (topo.routes.length > 3) {
        console.log(`${indent}         ... and ${topo.routes.length - 3} more`)
      }
    }
  }

  for (const child of node.children) {
    displayNode(child, depth + 1)
  }
}

if (import.meta.main) {
  main()
}

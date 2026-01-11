/**
 * Test script for extracting topo images with route overlays
 *
 * Usage:
 *   bun run apps/scripts/test-topo-extraction.ts
 *   bun run apps/scripts/test-topo-extraction.ts "/en/climbing/spain/siurana/can-melafots"
 *   bun run apps/scripts/test-topo-extraction.ts "/en/climbing/spain/siurana/can-melafots" "6a" "7a"
 *
 * This will:
 * 1. Scrape topo images from the sector page
 * 2. Generate SVG overlays with route lines (sorted by grade)
 * 3. Highlight routes within the specified grade range
 * 4. Save the results to ./output/topos/
 */

import { TheCragWebScraper, TopoRendererService } from '@scraper-thecrag'
import type { TopoImageData, TopoRouteAnnotation } from '@scraper-thecrag'
import { Grade } from '@shared'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const OUTPUT_DIR = './output/topos'

/**
 * Grade range filter configuration
 */
interface GradeRangeFilter {
  minGrade?: string
  maxGrade?: string
}

/**
 * Sort routes by grade (ascending difficulty)
 */
function sortRoutesByGrade(routes: TopoRouteAnnotation[]): TopoRouteAnnotation[] {
  return [...routes].sort((a, b) => {
    const indexA = Grade.calculateIndexFromString(a.grade) ?? 0
    const indexB = Grade.calculateIndexFromString(b.grade) ?? 0
    return indexA - indexB
  })
}

/**
 * Check if a route is within the specified grade range
 */
function isRouteInRange(route: TopoRouteAnnotation, range: GradeRangeFilter): boolean {
  if (!range.minGrade && !range.maxGrade) return false

  const routeIndex = Grade.calculateIndexFromString(route.grade) ?? 0
  const minIndex = range.minGrade ? Grade.calculateIndexFromString(range.minGrade) ?? 0 : 0
  const maxIndex = range.maxGrade ? Grade.calculateIndexFromString(range.maxGrade) ?? 999 : 999

  return routeIndex >= minIndex && routeIndex <= maxIndex
}

/**
 * Get highlighted route IDs for a topo based on grade range
 */
function getHighlightedRouteIds(routes: TopoRouteAnnotation[], range: GradeRangeFilter): number[] {
  return routes.filter(r => isRouteInRange(r, range)).map(r => r.id)
}

async function main() {
  const scraper = new TheCragWebScraper()
  const renderer = new TopoRendererService()

  scraper.setDelay(300)

  // Get the path and grade range from command line args
  const sectorPath = process.argv[2] || '/en/climbing/spain/siurana/can-melafots'
  const gradeRange: GradeRangeFilter = {
    minGrade: process.argv[3] || undefined,
    maxGrade: process.argv[4] || undefined,
  }

  console.log('🧗 Topo Image Extraction Test\n')
  console.log(`📍 Sector: ${sectorPath}`)
  if (gradeRange.minGrade || gradeRange.maxGrade) {
    console.log(`📊 Grade range: ${gradeRange.minGrade || 'any'} - ${gradeRange.maxGrade || 'any'}`)
  }
  console.log('\n' + '─'.repeat(60))

  try {
    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`\n📁 Output directory: ${OUTPUT_DIR}`)

    // 1. Scrape header images
    console.log('\n📷 Scraping header images...')
    const headerImages = await scraper.scrapeHeaderImages(sectorPath)
    console.log(`   Found ${headerImages.length} header images`)

    if (headerImages.length > 0) {
      console.log('\n   Header images:')
      for (const img of headerImages.slice(0, 3)) {
        console.log(`   - ${img.url.substring(0, 80)}...`)
        if (img.width && img.height) {
          console.log(`     Size: ${img.width}x${img.height}`)
        }
      }
    }

    // 2. Scrape topo images
    console.log('\n' + '─'.repeat(60))
    console.log('\n🗺️  Scraping topo images...')
    const topos = await scraper.scrapeTopoImages(sectorPath)
    console.log(`   Found ${topos.length} topo images`)

    if (topos.length === 0) {
      console.log('\n⚠️  No topos found. Try a different sector with topos.')
      return
    }

    // 3. Process each topo
    console.log('\n' + '─'.repeat(60))
    console.log('\n🎨 Processing topos...\n')

    for (let i = 0; i < Math.min(topos.length, 3); i++) {
      const topo = topos[i]
      
      // Sort routes by grade within this topo
      const sortedRoutes = sortRoutesByGrade(topo.routes)
      const topoWithSortedRoutes: TopoImageData = {
        ...topo,
        routes: sortedRoutes,
      }
      
      // Get highlighted route IDs based on grade range
      const highlightedRouteIds = getHighlightedRouteIds(sortedRoutes, gradeRange)
      const routesInRange = highlightedRouteIds.length
      
      console.log(`\n📍 Topo ${i + 1}: ID ${topo.topoId}`)
      console.log(`   Image: ${topo.thumbnailUrl}`)
      console.log(`   Full res: ${topo.fullImageUrl}`)
      console.log(
        `   Original size: ${topo.originalWidth}x${topo.originalHeight}`,
      )
      console.log(`   Routes: ${topo.routes.length}${routesInRange > 0 ? ` (${routesInRange} en rango)` : ''}`)

      // List routes (sorted by grade)
      if (sortedRoutes.length > 0) {
        console.log('\n   Routes on this topo (sorted by grade):')
        for (const route of sortedRoutes) {
          const stars = route.stars || ''
          const inRange = isRouteInRange(route, gradeRange)
          const marker = inRange ? '✅' : '  '
          console.log(
            `   ${marker} ${route.num}. ${route.name} (${route.grade}) ${stars} [${route.style}]`,
          )
        }
      }

      // Render options with highlighting
      const renderOptions = {
        showNumbers: true,
        showGrades: true,
        lineWidth: 2,
        fontSize: 8,
        theCragStyle: true,
        highlightedRouteIds,
        highlightColor: '#4CAF50',
        dimNonHighlighted: highlightedRouteIds.length > 0,
      }

      // Generate SVG overlay (TheCrag style)
      console.log('\n   Generating SVG overlay...')
      const svgContent = renderer.generateSvgOverlay(topoWithSortedRoutes, renderOptions)

      // Save SVG
      const svgPath = join(OUTPUT_DIR, `topo_${topo.topoId}.svg`)
      await Bun.write(svgPath, svgContent)
      console.log(`   ✅ Saved SVG: ${svgPath}`)

      // Generate HTML composite for preview
      const htmlContent = generatePreviewHtml(topoWithSortedRoutes, renderer, gradeRange)
      const htmlPath = join(OUTPUT_DIR, `topo_${topo.topoId}.html`)
      await Bun.write(htmlPath, htmlContent)
      console.log(`   ✅ Saved HTML preview: ${htmlPath}`)

      // Download original image
      console.log('   Downloading full-res image...')
      const imagePath = join(OUTPUT_DIR, `topo_${topo.topoId}_original.jpg`)
      await renderer.downloadImage(topo.fullImageUrl, imagePath)
      console.log(`   ✅ Saved image: ${imagePath}`)

      // Try to generate composite (requires Sharp)
      try {
        console.log('   Generating composite image...')
        const compositePath = join(
          OUTPUT_DIR,
          `topo_${topo.topoId}_composite.png`,
        )
        await renderer.generateCompositeImage(
          topoWithSortedRoutes,
          renderOptions,
          compositePath,
        )
        console.log(`   ✅ Saved composite: ${compositePath}`)
      } catch (err) {
        console.log(
          `   ⚠️  Could not generate composite (Sharp may not be installed)`,
        )
      }
    }

    // 4. Generate index HTML
    console.log('\n' + '─'.repeat(60))
    console.log('\n📄 Generating index page...')
    const indexHtml = generateIndexHtml(topos.slice(0, 5), sectorPath)
    const indexPath = join(OUTPUT_DIR, 'index.html')
    await Bun.write(indexPath, indexHtml)
    console.log(`   ✅ Saved index: ${indexPath}`)

    console.log('\n' + '─'.repeat(60))
    console.log(
      '\n✨ Done! Open the HTML files in a browser to see the results.',
    )
    console.log(`   Open: file://${process.cwd()}/${indexPath}\n`)
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

function generatePreviewHtml(
  topo: TopoImageData,
  renderer: InstanceType<typeof import('@scraper-thecrag').TopoRendererService>,
  gradeRange: GradeRangeFilter,
): string {
  // Get highlighted route IDs
  const highlightedRouteIds = getHighlightedRouteIds(topo.routes, gradeRange)
  const hasRange = gradeRange.minGrade || gradeRange.maxGrade
  
  const svgOverlay = renderer.generateSvgOverlay(topo, {
    showNumbers: true,
    showGrades: true,
    lineWidth: 2,
    fontSize: 8,
    theCragStyle: true,
    highlightedRouteIds,
    highlightColor: '#4CAF50',
    dimNonHighlighted: highlightedRouteIds.length > 0,
  })
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgOverlay).toString('base64')}`

  const rangeLabel = hasRange ? `${gradeRange.minGrade || 'any'} - ${gradeRange.maxGrade || 'any'}` : ''
  const routesInRange = highlightedRouteIds.length

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Topo ${topo.topoId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #00d9ff; }
    h2 { color: #e94560; margin-top: 20px; }
    .grade-filter {
      background: rgba(0, 217, 255, 0.1);
      border: 1px solid rgba(0, 217, 255, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .grade-filter-label { color: #00d9ff; font-weight: 600; }
    .grade-filter-range {
      background: rgba(0, 0, 0, 0.3);
      padding: 4px 12px;
      border-radius: 4px;
      font-family: monospace;
    }
    .grade-filter-count { color: #4CAF50; font-weight: 500; }
    .topo-container {
      position: relative;
      display: inline-block;
      max-width: 100%;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .topo-container img.base {
      display: block;
      max-width: 100%;
      height: auto;
    }
    .topo-container img.overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .routes {
      margin-top: 20px;
      background: #16213e;
      padding: 20px;
      border-radius: 8px;
    }
    .route {
      padding: 10px;
      border-bottom: 1px solid #0f3460;
      display: flex;
      align-items: center;
    }
    .route:last-child { border-bottom: none; }
    .route.in-range {
      background: rgba(76, 175, 80, 0.15);
      border-radius: 6px;
      margin: 4px 0;
    }
    .route-num {
      display: inline-block;
      width: 30px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      background: #007;
      border-radius: 4px;
      margin-right: 10px;
      font-weight: bold;
    }
    .route.in-range .route-num {
      background: #4CAF50;
    }
    .route-name { flex: 1; font-weight: 500; }
    .route-grade {
      background: #0f3460;
      padding: 3px 8px;
      border-radius: 4px;
      margin-left: 10px;
    }
    .route.in-range .route-grade {
      background: rgba(76, 175, 80, 0.3);
      color: #4CAF50;
      font-weight: bold;
    }
    .route-stars { color: #ffd700; margin-left: 10px; }
    .route-style { color: #888; margin-left: 10px; }
    .route-marker { margin-left: 10px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧗 Topo ${topo.topoId}</h1>
    <p>Original size: ${topo.originalWidth}x${topo.originalHeight} | Routes: ${topo.routes.length}</p>
    
    ${hasRange ? `
    <div class="grade-filter">
      <span class="grade-filter-label">📊 Rango de grados:</span>
      <span class="grade-filter-range">${rangeLabel}</span>
      <span class="grade-filter-count">${routesInRange} de ${topo.routes.length} rutas en rango</span>
    </div>
    ` : ''}
    
    <div class="topo-container">
      <img class="base" src="${topo.fullImageUrl}" alt="Topo base">
      <img class="overlay" src="${svgDataUrl}" alt="Route overlay">
    </div>

    <div class="routes">
      <h2>Routes (ordenadas por grado)</h2>
      ${topo.routes
        .map((r) => {
          const inRange = isRouteInRange(r, gradeRange)
          return `
        <div class="route${inRange ? ' in-range' : ''}">
          <span class="route-num">${r.num}</span>
          <span class="route-name">${r.name}</span>
          <span class="route-grade">${r.grade}</span>
          <span class="route-stars">${r.stars}</span>
          <span class="route-style">${r.style}</span>
          ${inRange ? '<span class="route-marker">✅</span>' : ''}
        </div>
      `
        })
        .join('')}
    </div>
  </div>
</body>
</html>`
}

function generateIndexHtml(
  topos: Parameters<typeof generatePreviewHtml>[0][],
  sectorPath: string,
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Topos - ${sectorPath}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #00d9ff; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .card {
      background: #16213e;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    .card img {
      width: 100%;
      height: 250px;
      object-fit: cover;
    }
    .card-body {
      padding: 15px;
    }
    .card h3 { margin: 0 0 10px 0; color: #00d9ff; }
    .card p { margin: 5px 0; color: #888; }
    .card a {
      display: inline-block;
      margin-top: 10px;
      padding: 8px 16px;
      background: #e94560;
      color: white;
      text-decoration: none;
      border-radius: 4px;
    }
    .card a:hover { background: #ff6b6b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧗 Topos from ${sectorPath}</h1>
    <p>Found ${topos.length} topos with route overlays</p>
    
    <div class="grid">
      ${topos
        .map(
          (topo) => `
        <div class="card">
          <img src="${topo.thumbnailUrl.replace(/\/\d+x\d+\//, '/600x400/')}" alt="Topo ${topo.topoId}">
          <div class="card-body">
            <h3>Topo ${topo.topoId}</h3>
            <p>${topo.routes.length} routes | ${topo.originalWidth}x${topo.originalHeight}</p>
            <p>Routes: ${topo.routes
              .slice(0, 3)
              .map((r) => r.name)
              .join(', ')}${topo.routes.length > 3 ? '...' : ''}</p>
            <a href="topo_${topo.topoId}.html">View with overlay →</a>
          </div>
        </div>
      `,
        )
        .join('')}
    </div>
  </div>
</body>
</html>`
}

if (import.meta.main) { main() }

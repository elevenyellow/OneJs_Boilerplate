/**
 * Demo: Generate a composite topo image
 * Uses hardcoded data from Can Melafots sector
 *
 * Features:
 * - Routes sorted by grade (easiest to hardest)
 * - Visual highlighting of routes within a grade range
 */

import { TopoRendererService } from '@scraper-thecrag'
import type { TopoImageData, TopoRouteAnnotation } from '@scraper-thecrag'
import { Grade } from '@shared'
import { mkdir } from 'node:fs/promises'

/**
 * Grade range filter configuration
 */
interface GradeRangeFilter {
  minGrade?: string // e.g., '6a'
  maxGrade?: string // e.g., '7a+'
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

const OUTPUT_DIR = './output/topos'

// Grade range to highlight (configurable)
const GRADE_RANGE: GradeRangeFilter = {
  minGrade: '6c',
  maxGrade: '7a',
}

// Hardcoded topo data from Can Melafots (extracted earlier)
const DEMO_TOPO: TopoImageData = {
  topoId: '10371874422',
  width: 213,
  height: 160,
  viewScale: 0.387272727272727,
  thumbnailUrl: 'https://image.thecrag.com/213x160/56/0e/560e73c30f92f520dceb1bc153570ffd80268bcd',
  fullImageUrl: 'https://image.thecrag.com/2656x2000/56/0e/560e73c30f92f520dceb1bc153570ffd80268bcd',
  originalWidth: 550,
  originalHeight: 413,
  routes: [
    {
      id: 18407737,
      type: 'route',
      num: '17',
      grade: '6c+',
      gradeClass: 'gb3',
      zindex: '3',
      name: 'Garbatx Despistax',
      stars: '★★★',
      style: 'Sport',
      order: 1,
      url: '/en/climbing/spain/siurana/can-melafots/route/18407737',
      points: '231.6 396.3,238.1 207.4,240.7 159.5,209.6 116.8,234.2 34 lower',
    },
    {
      id: 18407785,
      type: 'route',
      num: '18',
      grade: '7a+',
      gradeClass: 'gb3',
      zindex: '3',
      name: 'Remulo Y Romo',
      stars: '★★',
      style: 'Sport',
      order: 2,
      url: '/en/climbing/spain/siurana/can-melafots/route/18407785',
      points: '430.9 413.1,414.1 251.4,375.3 147.8,300.2 103.8,266.6 61.1,267.9 40.4 lower',
    },
    {
      id: 18407833,
      type: 'route',
      num: '19',
      grade: '6c+',
      gradeClass: 'gb3',
      zindex: '3',
      name: 'Cop De So',
      stars: '★★',
      style: 'Sport',
      order: 3,
      url: '/en/climbing/spain/siurana/can-melafots/route/18407833',
      points: '547.4 382.1,498.2 222.9,408.9 122,320.9 68.9,297.6 44.3 lower',
    },
  ],
}

async function main() {
  console.log('🖼️  Demo: Generating Composite Topo Image\n')
  console.log('─'.repeat(60))

  const renderer = new TopoRendererService()

  try {
    await mkdir(OUTPUT_DIR, { recursive: true })

    console.log('\n📍 Topo: Can Melafots - Siurana')
    console.log(`   ID: ${DEMO_TOPO.topoId}`)
    console.log(`   Routes: ${DEMO_TOPO.routes.length}`)

    // Sort routes by grade
    const sortedRoutes = sortRoutesByGrade(DEMO_TOPO.routes)
    const topoWithSortedRoutes: TopoImageData = {
      ...DEMO_TOPO,
      routes: sortedRoutes,
    }

    console.log(`\n📊 Grade range filter: ${GRADE_RANGE.minGrade || 'any'} - ${GRADE_RANGE.maxGrade || 'any'}`)
    console.log('\n   Routes (sorted by grade):')
    sortedRoutes.forEach(r => {
      const inRange = isRouteInRange(r, GRADE_RANGE)
      const marker = inRange ? '✅' : '  '
      console.log(`   ${marker} ${r.num}. ${r.name} (${r.grade}) ${r.stars}`)
    })

    // Get route IDs that are in the grade range
    const highlightedRouteIds = sortedRoutes
      .filter(r => isRouteInRange(r, GRADE_RANGE))
      .map(r => r.id)

    const renderOptions = {
      showNumbers: true,
      showGrades: true,
      lineWidth: 2,
      fontSize: 8,
      theCragStyle: true,
      highlightedRouteIds,
      highlightColor: '#4CAF50',
      dimNonHighlighted: true,
    }

    // 1. Generate SVG overlay
    console.log('\n🎨 Generating SVG overlay (TheCrag style)...')
    const svg = renderer.generateSvgOverlay(topoWithSortedRoutes, renderOptions)
    
    const svgPath = `${OUTPUT_DIR}/demo_topo.svg`
    await Bun.write(svgPath, svg)
    console.log(`   ✅ Saved: ${svgPath}`)

    // 2. Generate composite image
    console.log('\n🔄 Generating composite image...')
    const result = await renderer.generateCompositeImage(
      topoWithSortedRoutes,
      renderOptions,
      `${OUTPUT_DIR}/demo_composite.png`
    )
    
    if (result.imagePath) {
      console.log(`   ✅ Saved composite: ${result.imagePath}`)
    } else {
      console.log('   ⚠️  Could not generate composite (check logs)')
    }

    // 3. Download original for comparison
    console.log('\n📥 Downloading original image...')
    await renderer.downloadImage(DEMO_TOPO.fullImageUrl, `${OUTPUT_DIR}/demo_original.jpg`)
    console.log(`   ✅ Saved: ${OUTPUT_DIR}/demo_original.jpg`)

    // 4. Generate HTML preview
    console.log('\n📄 Generating HTML preview...')
    const html = generateHtml(topoWithSortedRoutes, renderer, GRADE_RANGE)
    await Bun.write(`${OUTPUT_DIR}/demo.html`, html)
    console.log(`   ✅ Saved: ${OUTPUT_DIR}/demo.html`)

    console.log('\n' + '─'.repeat(60))
    console.log('\n✨ Done! Files saved to:', OUTPUT_DIR)
    console.log('\n📂 Generated files:')
    console.log('   - demo_original.jpg  (base image)')
    console.log('   - demo_topo.svg      (route overlay)')
    console.log('   - demo_composite.png (combined image)')
    console.log('   - demo.html          (interactive preview)')
    console.log(`\n🌐 Open: file://${process.cwd()}/${OUTPUT_DIR}/demo.html\n`)

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

function generateHtml(
  topo: TopoImageData,
  renderer: TopoRendererService,
  gradeRange: GradeRangeFilter
): string {
  // Get highlighted route IDs
  const highlightedRouteIds = topo.routes
    .filter(r => isRouteInRange(r, gradeRange))
    .map(r => r.id)

  const svgOverlay = renderer.generateSvgOverlay(topo, {
    showNumbers: true,
    showGrades: true,
    lineWidth: 2,
    fontSize: 8,
    theCragStyle: true,
    highlightedRouteIds,
    highlightColor: '#4CAF50',
    dimNonHighlighted: true,
  })
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgOverlay).toString('base64')}`

  const rangeLabel = `${gradeRange.minGrade || 'any'} - ${gradeRange.maxGrade || 'any'}`
  const routesInRange = topo.routes.filter(r => isRouteInRange(r, gradeRange)).length

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Demo: Composite Topo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #eee;
      min-height: 100vh;
      padding: 40px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #00d9ff; margin-bottom: 10px; }
    h2 { color: #e94560; margin: 30px 0 15px; }
    .subtitle { color: #888; margin-bottom: 30px; }
    
    .grade-filter {
      background: rgba(0, 217, 255, 0.1);
      border: 1px solid rgba(0, 217, 255, 0.3);
      border-radius: 8px;
      padding: 15px 20px;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .grade-filter-label {
      color: #00d9ff;
      font-weight: 600;
    }
    .grade-filter-range {
      background: rgba(0, 0, 0, 0.3);
      padding: 6px 14px;
      border-radius: 4px;
      font-family: monospace;
    }
    .grade-filter-count {
      color: #4CAF50;
      font-weight: 500;
    }
    
    .comparison {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
      margin: 30px 0;
    }
    .panel {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    .panel-title {
      background: rgba(0,0,0,0.3);
      padding: 15px 20px;
      font-weight: 600;
      color: #00d9ff;
    }
    .panel img {
      width: 100%;
      display: block;
    }
    
    .topo-interactive {
      position: relative;
      display: inline-block;
      width: 100%;
    }
    .topo-interactive img.base {
      width: 100%;
      display: block;
    }
    .topo-interactive img.overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    .topo-interactive:hover img.overlay {
      opacity: 0.3;
    }
    .topo-interactive .hint {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
    }
    
    .routes {
      padding: 20px;
    }
    .route {
      display: flex;
      align-items: center;
      padding: 12px;
      background: rgba(0,0,0,0.2);
      border-radius: 8px;
      margin-bottom: 10px;
      transition: all 0.2s;
    }
    .route.in-range {
      background: rgba(76, 175, 80, 0.2);
      border: 2px solid rgba(76, 175, 80, 0.5);
    }
    .route.in-range .route-num {
      background: #4CAF50;
    }
    .route-num {
      width: 36px;
      height: 36px;
      line-height: 36px;
      text-align: center;
      background: #007;
      border-radius: 4px;
      margin-right: 15px;
      font-weight: bold;
    }
    .route-name { flex: 1; font-weight: 500; }
    .route-grade {
      background: rgba(0,217,255,0.2);
      padding: 4px 12px;
      border-radius: 4px;
      margin-left: 10px;
    }
    .route.in-range .route-grade {
      background: rgba(76, 175, 80, 0.3);
      color: #4CAF50;
      font-weight: bold;
    }
    .route-stars { color: #ffd700; margin-left: 10px; }
    .route-marker {
      margin-left: 10px;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧗 Composite Topo Demo</h1>
    <p class="subtitle">Can Melafots - Siurana, Spain</p>
    
    <div class="grade-filter">
      <span class="grade-filter-label">📊 Rango de grados:</span>
      <span class="grade-filter-range">${rangeLabel}</span>
      <span class="grade-filter-count">${routesInRange} de ${topo.routes.length} rutas en rango</span>
    </div>
    
    <div class="comparison">
      <div class="panel">
        <div class="panel-title">📷 Original Image</div>
        <img src="demo_original.jpg" alt="Original">
      </div>
      <div class="panel">
        <div class="panel-title">🎨 With Route Overlay (hover to fade)</div>
        <div class="topo-interactive">
          <img class="base" src="demo_original.jpg" alt="Base">
          <img class="overlay" src="${svgDataUrl}" alt="Overlay">
          <span class="hint">Hover to see original</span>
        </div>
      </div>
    </div>
    
    <div class="panel" style="margin-top: 30px;">
      <div class="panel-title">🖼️ Composite Image (PNG - SVG merged into image)</div>
      <img src="demo_composite.png" alt="Composite">
    </div>
    
    <h2>Routes on this Topo (ordenadas por grado)</h2>
    <div class="routes">
      ${topo.routes.map(r => {
        const inRange = isRouteInRange(r, gradeRange)
        return `
        <div class="route${inRange ? ' in-range' : ''}">
          <span class="route-num">${r.num}</span>
          <span class="route-name">${r.name}</span>
          <span class="route-grade">${r.grade}</span>
          <span class="route-stars">${r.stars}</span>
          ${inRange ? '<span class="route-marker">✅</span>' : ''}
        </div>
      `
      }).join('')}
    </div>
  </div>
</body>
</html>`
}

if (import.meta.main) { main() }

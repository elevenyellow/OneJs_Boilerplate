import { TheCragApiScraper } from '@scraper-thecrag'

// Cookie de TheCrag (actualízala si expira)
const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

// Nodos de ejemplo para probar
const NODES = {
  // Nodo raíz - continentes
  world: { id: 7546063, name: 'World', type: 'Region' },
  // Continentes
  europe: { id: 11737771, name: 'Europe', type: 'Region' },
  northamerica: { id: 11737675, name: 'North America', type: 'Region' },
  oceania: { id: 11737891, name: 'Oceania', type: 'Region' },
  asia: { id: 11737747, name: 'Asia', type: 'Region' },
  africa: { id: 11737843, name: 'Africa', type: 'Region' },
  southamerica: { id: 11737819, name: 'South America', type: 'Region' },
  // Crags específicos
  chulilla: { id: 102885222, name: 'Chulilla', type: 'Crag' },
  siurana: { id: 12030407, name: 'Siurana', type: 'Crag' },
  rodellar: { id: 12068945, name: 'Rodellar', type: 'Crag' },
}

async function main() {
  const nodeKey = (process.argv[2] as keyof typeof NODES) || 'chulilla'
  const node = NODES[nodeKey]

  if (!node) {
    console.log('❌ Nodo no encontrado. Opciones disponibles:')
    console.log(
      Object.keys(NODES)
        .map((k) => `  - ${k}`)
        .join('\n'),
    )
    process.exit(1)
  }

  console.log(`\n🧗 Scrapeando ${node.name} (ID: ${node.id})...\n`)

  const scraper = new TheCragApiScraper()
  scraper.setCookie(COOKIE)
  scraper.setDelay(100)

  const data = await scraper.scrapeCrag(node.id, node.name, node.type)

  const outputFile = `${node.name.toLowerCase()}_data.json`
  await Bun.write(outputFile, JSON.stringify(data, null, 2))

  // Resumen
  const countRoutes = (node: typeof data): number => {
    let count = node.routes?.length ?? 0
    for (const child of node.children ?? []) {
      count += countRoutes(child)
    }
    return count
  }

  const countSectors = (node: typeof data): number => {
    let count = node.children?.length ?? 0
    for (const child of node.children ?? []) {
      count += countSectors(child)
    }
    return count
  }

  console.log('\n✅ Scraping completado!')
  console.log(`   📁 Archivo: ${outputFile}`)
  console.log(`   📍 Sectores: ${countSectors(data)}`)
  console.log(`   🧗 Rutas: ${countRoutes(data)}`)
}

main().catch(console.error)

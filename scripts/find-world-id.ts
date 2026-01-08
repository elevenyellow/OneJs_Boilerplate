/**
 * Script para encontrar el ID correcto del nodo "World" en TheCrag
 */

import { TheCragApiScraper } from '@scraper-thecrag'

const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

// IDs encontrados en el HTML de la página world
const POSSIBLE_WORLD_IDS = [
  7546063, // Aparece muchas veces en la página /climbing/world
  11737771,
  11737675,
  11737891,
]

async function main() {
  console.log('🔍 Buscando el ID correcto de World...\n')

  const scraper = new TheCragApiScraper()
  scraper.setCookie(COOKIE)

  // Verificar que funciona con Chulilla
  console.log('📋 Verificando conectividad:')
  const chulilla = await scraper.getChildren(102885222)
  console.log(`   Chulilla: ${chulilla.length} hijos\n`)

  if (chulilla.length === 0) {
    console.log('❌ La cookie ha expirado. Necesitas una nueva.')
    return
  }

  console.log('🌍 Probando IDs encontrados en la página World:')
  for (const worldId of POSSIBLE_WORLD_IDS) {
    const children = await scraper.getChildren(worldId)
    console.log(`   ID ${worldId}: ${children.length} hijos`)

    if (children.length > 0) {
      console.log(
        `      → ${children
          .slice(0, 5)
          .map((c) => c.name)
          .join(', ')}...`,
      )

      // Si tiene muchos hijos, probablemente sea World o un continente
      if (children.length > 20) {
        console.log(`\n✅ ID ${worldId} parece ser un nodo grande!`)
        await Bun.write(
          `node_${worldId}.json`,
          JSON.stringify(children, null, 2),
        )
        console.log(`📁 Guardado en node_${worldId}.json`)
      }
    }
  }
}

main().catch(console.error)

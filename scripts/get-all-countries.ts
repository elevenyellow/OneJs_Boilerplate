import { TheCragApiScraper } from '@scraper-thecrag'

const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

// ID de World (contiene los continentes)
const WORLD_ID = 7546063

interface Country {
  id: number
  name: string
  type: string
  continent: string
  geometry?: unknown
}

async function main() {
  console.log('🌍 Obteniendo todos los países de TheCrag...\n')

  const scraper = new TheCragApiScraper()
  scraper.setCookie(COOKIE)

  // 1. Obtener continentes
  console.log('📍 Obteniendo continentes...')
  const continents = await scraper.getChildren(WORLD_ID)
  console.log(`   Encontrados ${continents.length} continentes\n`)

  if (continents.length === 0) {
    console.log('❌ No se pudieron obtener los continentes. Cookie expirada?')
    return
  }

  // 2. Obtener países de cada continente
  const allCountries: Country[] = []

  for (const continent of continents) {
    console.log(`📍 ${continent.name}...`)
    const countries = await scraper.getChildren(continent.id)
    console.log(`   → ${countries.length} países/regiones`)

    for (const country of countries) {
      allCountries.push({
        id: country.id,
        name: country.name,
        type: country.type,
        continent: continent.name,
        geometry: country.geometry,
      })
    }
  }

  // 3. Guardar resultado
  console.log(`\n✅ Total: ${allCountries.length} países/regiones`)

  await Bun.write('all_countries.json', JSON.stringify(allCountries, null, 2))
  console.log('📁 Guardado en all_countries.json')

  // Mostrar resumen por continente
  console.log('\n📊 Resumen por continente:')
  const byCont = allCountries.reduce(
    (acc, c) => {
      acc[c.continent] = (acc[c.continent] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  for (const [cont, count] of Object.entries(byCont)) {
    console.log(`   ${cont}: ${count}`)
  }
}

main().catch(console.error)

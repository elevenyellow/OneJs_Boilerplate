// import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
// import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
// import { PrismaPlugin } from '@OneJs/prisma'
// import { TheCragApiScraper } from '@scraper-thecrag'
// import { ContinentPrismaRepository, ContinentEntity } from '@climb-zone/continent'
// import { CountryPrismaRepository, CountryEntity } from '@climb-zone/country'
// import { ExternalId, Geometry } from '@climb-zone/shared'
// import { ContinentId } from '@continent/domain/entities/continent.entity'
// import { CountryId } from '@country/domain/entities/country.entity'

// const COOKIE =
//   'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

// // ID de World (contiene los continentes)
// const WORLD_ID = 7546063

// interface ScrapedContinent {
//   id: number
//   name: string
//   geometry?: unknown
// }

// interface ScrapedCountry {
//   id: number
//   name: string
//   geometry?: unknown
// }

// async function main() {
//   console.log('🌍 Iniciando seed de continentes y países...\n')

//   // Register plugins
//   PluginRegistry.register(new PrismaPlugin())
//   PluginRegistry.register(new BootstrapLoader())

//   const oneJs = new OneJs(import.meta.url)
//   await oneJs.start()

//   const container = ContainerProvider.getContainer()
//   const scraper = container.get(TheCragApiScraper)
//   const continentRepo = container.get(ContinentPrismaRepository)
//   const countryRepo = container.get(CountryPrismaRepository)

//   scraper.setCookie(COOKIE)

//   // 1. Obtener continentes de TheCrag
//   console.log('📍 Obteniendo continentes de TheCrag...')
//   const scrapedContinents = await scraper.getChildren(WORLD_ID)
//   console.log(`   ✅ Encontrados ${scrapedContinents.length} continentes\n`)

//   if (scrapedContinents.length === 0) {
//     console.log('❌ No se pudieron obtener los continentes. Cookie expirada?')
//     console.log('\nPara obtener una nueva cookie:')
//     console.log('1. Ve a https://www.thecrag.com en tu navegador')
//     console.log('2. Abre DevTools > Network')
//     console.log('3. Copia el header Cookie de cualquier petición')
//     console.log('4. Actualiza la constante COOKIE en este script')
//     await app.close()
//     return
//   }

//   let totalCountries = 0

//   // 2. Procesar cada continente
//   for (const scrapedContinent of scrapedContinents) {
//     console.log(`\n📍 Procesando continente: ${scrapedContinent.name}`)

//     // Crear entidad de continente
//     const continentEntity = new ContinentEntity(
//       ContinentId.generate(),
//       ExternalId.create(scrapedContinent.id),
//       scrapedContinent.name,
//       scrapedContinent.geometry
//         ? Geometry.fromJSON(scrapedContinent.geometry as Record<string, unknown>)
//         : null,
//     )

//     // Guardar continente (upsert por externalId)
//     const savedContinent = await continentRepo.save(continentEntity)
//     console.log(`   💾 Continente guardado: ${savedContinent.name}`)

//     // 3. Obtener países del continente
//     console.log(`   🔍 Obteniendo países de ${scrapedContinent.name}...`)
//     const scrapedCountries = await scraper.getChildren(scrapedContinent.id)
//     console.log(`   ✅ Encontrados ${scrapedCountries.length} países`)

//     // 4. Guardar cada país
//     for (const scrapedCountry of scrapedCountries) {
//       const countryEntity = new CountryEntity(
//         CountryId.generate(),
//         ExternalId.create(scrapedCountry.id),
//         savedContinent.id,
//         scrapedCountry.name,
//         scrapedCountry.geometry
//           ? Geometry.fromJSON(scrapedCountry.geometry as Record<string, unknown>)
//           : null,
//       )

//       await countryRepo.save(countryEntity)
//       totalCountries++
//       console.log(`      ✓ ${scrapedCountry.name} (ID: ${scrapedCountry.id})`)
//     }
//   }

//   console.log(`\n✅ Seed completado!`)
//   console.log(`   - Continentes: ${scrapedContinents.length}`)
//   console.log(`   - Países: ${totalCountries}`)

//   process.exit(0)
// }

// main().catch((err) => {
//   console.error('❌ Error:', err)
//   process.exit(1)
// })

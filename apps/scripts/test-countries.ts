// import { TheCragApiScraper } from '@scraper-thecrag'

// const COOKIE =
//   'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

// // IDs a probar
// const WORLD_ID = 11035714
// const CHULILLA_ID = 102885222

// async function main() {
//   const scraper = new TheCragApiScraper()
//   scraper.setCookie(COOKIE)

//   // Primero probamos con Chulilla para ver si funciona
//   console.log('🧪 Probando con Chulilla (ID: 102885222)...')
//   const chulillaChildren = await scraper.getChildren(CHULILLA_ID)
//   console.log(`   Hijos de Chulilla: ${chulillaChildren.length}`)

//   if (chulillaChildren.length > 0) {
//     console.log('   ✅ La API funciona!\n')
//   } else {
//     console.log(
//       '   ❌ No se obtuvieron datos. Probablemente la cookie expiró.\n',
//     )
//     console.log('   Para obtener una nueva cookie:')
//     console.log('   1. Ve a https://www.thecrag.com en tu navegador')
//     console.log('   2. Abre DevTools > Network')
//     console.log('   3. Copia el header Cookie de cualquier petición')
//     return
//   }

//   // Ahora probamos con World
//   console.log('🌍 Probando con World (ID: 11035714)...')
//   const countries = await scraper.getChildren(WORLD_ID)

//   if (countries.length > 0) {
//     console.log(`✅ Encontrados ${countries.length} países/regiones:\n`)
//     for (const country of countries) {
//       console.log(`  - ${country.name} (ID: ${country.id})`)
//     }
//     await Bun.write('countries.json', JSON.stringify(countries, null, 2))
//     console.log('\n📁 Guardado en countries.json')
//   } else {
//     console.log('   ❌ No se obtuvieron países.')
//     console.log('   El ID de World puede ser incorrecto. Probando otros IDs...')

//     // Probar otros posibles IDs
//     const possibleWorldIds = [11035714, 11035715, 1, 0]
//     for (const id of possibleWorldIds) {
//       const result = await scraper.getChildren(id)
//       if (result.length > 0) {
//         console.log(`   ✅ ID ${id} devuelve ${result.length} hijos`)
//       }
//     }
//   }
// }

// main().catch(console.error)

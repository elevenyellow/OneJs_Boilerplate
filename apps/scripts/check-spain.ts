// #!/usr/bin/env bun
// /**
//  * Script to check Spain in the database
//  */

// import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
// import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
// import { PrismaPlugin } from '@OneJs/prisma'
// import { CountryPrismaRepository } from '@climb-zone/country'

// async function main() {
//   console.log('🚀 Starting OneJs...')

//   // Register plugins
//   PluginRegistry.register(new PrismaPlugin())
//   PluginRegistry.register(new BootstrapLoader())

//   const oneJs = new OneJs(import.meta.url)
//   await oneJs.start()

//   const container = ContainerProvider.getContainer()
//   const countryRepo = container.get(CountryPrismaRepository)

//   console.log('\n📋 Checking countries in database...\n')

//   const countries = await countryRepo.findAll()
//   console.log(`Found ${countries.length} countries:\n`)

//   for (const country of countries) {
//     console.log(`✅ ${country.name}`)
//     console.log(`   ID: ${country.id.toString()}`)
//     console.log(`   External ID: ${country.externalId.toNumber()}`)
//     console.log(`   Continent ID: ${country.continentId.toString()}\n`)
//   }

//   process.exit(0)
// }

// main().catch((err) => {
//   console.error('❌ Error:', err)
//   process.exit(1)
// })

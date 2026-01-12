#!/usr/bin/env bun
/**
 * CLI Principal para scripts de scraping
 * Inicializa OneJs UNA SOLA VEZ y ejecuta diferentes comandos
 */

import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { PrismaPlugin } from '@OneJs/prisma'

// Tipos de comandos disponibles
type Command =
  | 'test-s3-upload'
  | 'scrape-crag'
  | 'scrape-world'
  | 'seed-countries'
  | 'verify-data'
  | 'fix-crag-coordinates'
  | 'migrate-sector-tags'
  | 'query-api'
  | 'list-areas'
  | 'list-sectors'
  | 'help'

interface CommandDefinition {
  name: string
  description: string
  execute: (container: any) => Promise<void>
}

// Cookie de TheCrag
const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

// Comandos disponibles
const COMMANDS: Record<string, CommandDefinition> = {
  'test-s3-upload': {
    name: 'test-s3-upload',
    description: 'Probar subida de imagen a S3',
    execute: async (container) => {
      const { testS3Upload } = await import('./commands/test-s3-upload.command')
      await testS3Upload(container)
    },
  },
  'scrape-crag': {
    name: 'scrape-crag',
    description: 'Scrape any crag by name. Usage: scrape-crag "Crag Name"',
    execute: async (container) => {
      const { scrapeCrag } = await import('./commands/scrape-crag.command')
      await scrapeCrag(container, COOKIE)
    },
  },
  'scrape-world': {
    name: 'scrape-world',
    description: 'Scrape el mundo completo (CUIDADO: muy largo)',
    execute: async (container) => {
      const { scrapeWorld } = await import('./commands/scrape-world.command')
      await scrapeWorld(container, COOKIE)
    },
  },
  'seed-countries': {
    name: 'seed-countries',
    description: 'Seed continentes y países en la base de datos',
    execute: async (container) => {
      const { seedCountries } = await import(
        './commands/seed-countries.command'
      )
      await seedCountries(container, COOKIE)
    },
  },
  'verify-data': {
    name: 'verify-data',
    description: 'Verificar que los datos se guardaron correctamente en la BD',
    execute: async (container) => {
      const { verifyData } = await import('./commands/verify-data.command')
      await verifyData(container)
    },
  },
  'fix-crag-coordinates': {
    name: 'fix-crag-coordinates',
    description:
      'Actualizar coordenadas de crags desde el texto de approach/beta',
    execute: async (container) => {
      const { fixCragCoordinates } = await import(
        './commands/fix-crag-coordinates.command'
      )
      await fixCragCoordinates(container)
    },
  },
  'migrate-sector-tags': {
    name: 'migrate-sector-tags',
    description:
      'Migrar tags de sectores existentes (procesar tagsRaw -> campos booleanos)',
    execute: async (container) => {
      const MigrateSectorTagsCommand = (
        await import('./commands/migrate-sector-tags.command')
      ).default
      const command = container.get(MigrateSectorTagsCommand)
      await command.execute()
    },
  },
  'query-api': {
    name: 'query-api',
    description:
      'Consultar API response guardada. Uso: query-api <type> <externalId>',
    execute: async () => {
      const entityType = process.argv[3] as 'crag' | 'area' | 'sector'
      const externalId = process.argv[4]
      if (!entityType || !externalId) {
        console.error('❌ Error: Debes especificar tipo y externalId')
        console.log(
          'Uso: bun run apps/scripts/cli.ts query-api <crag|area|sector> <externalId>',
        )
        console.log(
          'Ejemplo: bun run apps/scripts/cli.ts query-api crag 102885390',
        )
        process.exit(1)
      }
      const { queryApiResponse } = await import(
        './commands/query-api-response.command'
      )
      await queryApiResponse(entityType, Number(externalId))
    },
  },
  'list-areas': {
    name: 'list-areas',
    description: 'Listar áreas de un crag. Uso: list-areas <cragExternalId>',
    execute: async () => {
      const cragExternalId = process.argv[3]
      if (!cragExternalId) {
        console.error('❌ Error: Debes especificar el externalId del crag')
        console.log(
          'Uso: bun run apps/scripts/cli.ts list-areas <cragExternalId>',
        )
        console.log('Ejemplo: bun run apps/scripts/cli.ts list-areas 102885390')
        process.exit(1)
      }
      const { listCragAreas } = await import(
        './commands/query-api-response.command'
      )
      await listCragAreas(Number(cragExternalId))
    },
  },
  'list-sectors': {
    name: 'list-sectors',
    description:
      'Listar sectores de un área. Uso: list-sectors <areaExternalId>',
    execute: async () => {
      const areaExternalId = process.argv[3]
      if (!areaExternalId) {
        console.error('❌ Error: Debes especificar el externalId del área')
        console.log(
          'Uso: bun run apps/scripts/cli.ts list-sectors <areaExternalId>',
        )
        console.log(
          'Ejemplo: bun run apps/scripts/cli.ts list-sectors 102885391',
        )
        process.exit(1)
      }
      const { listAreaSectors } = await import(
        './commands/query-api-response.command'
      )
      await listAreaSectors(Number(areaExternalId))
    },
  },
  help: {
    name: 'help',
    description: 'Muestra esta ayuda',
    execute: async () => {
      printHelp()
    },
  },
}

function printHelp() {
  console.log('\n📚 Climb Zone CLI - Comandos Disponibles\n')
  console.log('Uso: bun run apps/scripts/cli.ts <comando>\n')
  console.log('Comandos:\n')

  Object.values(COMMANDS).forEach((cmd) => {
    console.log(`  ${cmd.name.padEnd(20)} ${cmd.description}`)
  })

  console.log('\nEjemplos:')
  console.log('  bun run apps/scripts/cli.ts scrape-crag "El Chorro"')
  console.log('  bun run apps/scripts/cli.ts seed-countries')
  console.log('')
}

async function main() {
  const command = (process.argv[2] as Command) || 'help'

  if (!COMMANDS[command]) {
    console.error(`❌ Comando desconocido: ${command}\n`)
    printHelp()
    process.exit(1)
  }

  if (command === 'help') {
    printHelp()
    process.exit(0)
  }

  console.log('🚀 Iniciando OneJs (una sola vez)...\n')

  // Initialize OneJs with all plugins ONCE
  PluginRegistry.register(new PrismaPlugin())
  PluginRegistry.register(new BootstrapLoader())

  const oneJs = new OneJs(import.meta.url)
  await oneJs.start()

  const container = ContainerProvider.getContainer()

  console.log(`✅ OneJs iniciado correctamente\n`)
  console.log('='.repeat(80))
  console.log(`🎯 Ejecutando comando: ${command}`)
  console.log('='.repeat(80))
  console.log('')

  try {
    await COMMANDS[command].execute(container)
    console.log('\n✅ Comando completado exitosamente')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error ejecutando comando:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})

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
  | 'test-altura'
  | 'test-valencia'
  | 'test-country'
  | 'scrape-spain'
  | 'scrape-world'
  | 'seed-countries'
  | 'verify-data'
  | 'fix-crag-coordinates'
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
  'test-altura': {
    name: 'test-altura',
    description: 'Test pequeño: Altura (Castellón) - verificar imágenes y topos',
    execute: async (container) => {
      const { testAltura } = await import('./commands/test-altura.command')
      await testAltura(container, COOKIE)
    },
  },
  'test-valencia': {
    name: 'test-valencia',
    description: 'Scrape solo la región de Valencia para testing',
    execute: async (container) => {
      const { testValencia } = await import('./commands/test-valencia.command')
      await testValencia(container, COOKIE)
    },
  },
  'test-country': {
    name: 'test-country',
    description:
      'Scrape un país completo (batch 100). Uso: test-country <país>',
    execute: async (container) => {
      const countryName = process.argv[3]
      if (!countryName) {
        console.error('❌ Error: Debes especificar un país')
        console.log('Uso: bun run apps/scripts/cli.ts test-country <país>')
        console.log('Ejemplo: bun run apps/scripts/cli.ts test-country Spain')
        process.exit(1)
      }
      const { testCountry } = await import('./commands/test-country.command')
      await testCountry(container, COOKIE, countryName)
    },
  },
  'scrape-spain': {
    name: 'scrape-spain',
    description: 'Scrape toda España (todas las regiones)',
    execute: async (container) => {
      const { scrapeSpain } = await import('./commands/scrape-spain.command')
      await scrapeSpain(container, COOKIE)
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
    description: 'Actualizar coordenadas de crags desde el texto de approach/beta',
    execute: async (container) => {
      const { fixCragCoordinates } = await import('./commands/fix-crag-coordinates.command')
      await fixCragCoordinates(container)
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
  console.log('  bun run apps/scripts/cli.ts test-altura    # Test pequeño para verificar imágenes')
  console.log('  bun run apps/scripts/cli.ts test-valencia')
  console.log('  bun run apps/scripts/cli.ts test-country Spain')
  console.log('  bun run apps/scripts/cli.ts test-country France')
  console.log('  bun run apps/scripts/cli.ts scrape-spain')
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

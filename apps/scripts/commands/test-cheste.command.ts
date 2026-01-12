/**
 * Comando: test-cheste
 * Scrape solo el crag de Cheste (Valencia) para testing
 *
 * Este test es para verificar:
 * - Extracción de topos de sectores
 * - Guardado de headerImageUrl en sectores
 * - Guardado de TopoImage y RouteTopoPosition
 *
 * NOTA: Usa el flujo estándar del scraper (CragImporterService)
 */

import {
  ContinentEntity,
  ContinentPrismaRepository,
} from '@climb-zone/continent'
import {
  CountryEntity,
  CountryId,
  CountryPrismaRepository,
} from '@climb-zone/country'
import {
  RegionEntity,
  RegionId,
  RegionPrismaRepository,
} from '@climb-zone/region'
import { ExternalId, Geometry, Name } from '@climb-zone/shared'
import { TheCragApiScraper } from '@scraper-thecrag'
import {
  CragImporterService,
  type ImportResult,
} from '@scraper-thecrag/application/services/crag-importer.service'

// Cheste IDs from TheCrag
const CHESTE_ID = 1447606131 // Cheste crag
const COMUNIDAD_VALENCIANA_ID = 22687829 // Valencia region
const SPAIN_ID = 16227917
const EUROPE_ID = 7546062

export async function testCheste(container: unknown, cookie: string) {
  // Get repositories and services from container
  const dic = container as { get: <T>(token: unknown) => T }
  const scraper = dic.get<TheCragApiScraper>(TheCragApiScraper)
  const importer = dic.get<CragImporterService>(CragImporterService)
  const countryRepo = dic.get<CountryPrismaRepository>(CountryPrismaRepository)
  const continentRepo = dic.get<ContinentPrismaRepository>(
    ContinentPrismaRepository,
  )
  const regionRepo = dic.get<RegionPrismaRepository>(RegionPrismaRepository)

  // Configure scraper with topos enabled
  scraper.setCookie(cookie)
  scraper.setDelay(200) // Slightly slower to allow topo fetching
  scraper.setOptions({ includeTopos: true })

  console.log('🏔️  TEST CHESTE - Verificación de imágenes de sectores y topos')
  console.log('='.repeat(80))
  console.log('')
  console.log(
    '📍 Objetivo: Verificar que las imágenes se guardan correctamente',
  )
  console.log('   - headerImageUrl en crags y sectores')
  console.log('   - TopoImage con fullImageUrl y thumbnailUrl')
  console.log('   - RouteTopoPosition con points (SVG data)')
  console.log('')

  const startTime = Date.now()

  try {
    // Step 1: Ensure Spain exists in DB
    console.log('📍 Step 1: Verificando España en la base de datos...')
    const spainCountryId = await ensureSpainExists(
      scraper,
      countryRepo,
      continentRepo,
    )
    console.log(`   ✅ España ID: ${spainCountryId.toString()}\n`)

    // Step 2: Ensure Comunidad Valenciana region exists
    console.log('📍 Step 2: Verificando Comunidad Valenciana...')
    const valenciaRegion = await ensureRegionExists(
      scraper,
      regionRepo,
      spainCountryId,
      COMUNIDAD_VALENCIANA_ID,
      'Comunidad Valenciana',
    )
    console.log(
      `   ✅ Comunidad Valenciana ID: ${valenciaRegion.id.toString()}\n`,
    )

    // Step 3: Use scraper.scrapeCrag() to get all data
    console.log('📍 Step 3: Ejecutando scraper para Cheste...')
    console.log('   (El scraper obtiene info, imágenes, topos y rutas)')
    console.log('')

    const scrapedData = await scraper.scrapeCrag(CHESTE_ID, 'Cheste', 'Crag')

    console.log(`   ✅ Scraping completado:`)
    console.log(`      - Nombre: ${scrapedData.name}`)
    console.log(`      - Tipo: ${scrapedData.type}`)
    console.log(`      - Hijos directos: ${scrapedData.children.length}`)
    console.log(
      `      - Header Image: ${scrapedData.info?.headerImageUrl ? '✅' : '❌'}`,
    )
    console.log(
      `      - Overview Topo: ${scrapedData.cragTopos?.length ?? 0} (panorámica de sectores)`,
    )
    console.log(`      - Rutas directas: ${scrapedData.routes?.length ?? 0}`)
    console.log(`      - Topos directos: ${scrapedData.topos?.length ?? 0}`)
    console.log('')

    // Step 4: Use CragImporterService to save to database
    console.log('📍 Step 4: Guardando datos en base de datos...')
    console.log('   (Usando CragImporterService)')
    console.log('')

    const result = await importer.importCrag(scrapedData, {
      countryId: spainCountryId,
      regionId: valenciaRegion.id,
    })

    // Final report
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    printFinalReport(result, duration)
  } catch (error: unknown) {
    const err = error as Error
    console.error(`\n❌ Error fatal: ${err.message}`)
    console.error(err.stack)
    throw error
  }
}

async function ensureSpainExists(
  scraper: TheCragApiScraper,
  countryRepo: CountryPrismaRepository,
  continentRepo: ContinentPrismaRepository,
): Promise<CountryId> {
  let spain = await countryRepo.findByExternalId(ExternalId.create(SPAIN_ID))
  if (spain) return spain.id

  // Create Europe if needed
  let europe = await continentRepo.findByExternalId(
    ExternalId.create(EUROPE_ID),
  )
  if (!europe) {
    const europeInfo = await scraper.getNodeInfo(EUROPE_ID)
    const newEurope = ContinentEntity.create(
      ExternalId.create(EUROPE_ID),
      'Europe',
      europeInfo?.geometry ? Geometry.fromJSON(europeInfo.geometry) : null,
    )
    europe = await continentRepo.save(newEurope)
    console.log('   ✅ Europa creada')
  }

  // Create Spain
  const spainInfo = await scraper.getNodeInfo(SPAIN_ID)
  const newSpain = CountryEntity.create(
    ExternalId.create(SPAIN_ID),
    europe.id,
    'Spain',
    spainInfo?.geometry ? Geometry.fromJSON(spainInfo.geometry) : null,
  )
  spain = await countryRepo.save(newSpain)
  console.log('   ✅ España creada')
  return spain.id
}

async function ensureRegionExists(
  scraper: TheCragApiScraper,
  regionRepo: RegionPrismaRepository,
  countryId: CountryId,
  regionExternalId: number,
  regionName: string,
): Promise<RegionEntity> {
  let region = await regionRepo.findByExternalId(
    ExternalId.create(regionExternalId),
  )
  if (region) return region

  const regionInfo = await scraper.getNodeInfo(regionExternalId)
  const newRegion = new RegionEntity(
    RegionId.generate(),
    ExternalId.create(regionExternalId),
    countryId,
    Name.create(regionName),
    regionInfo?.geometry ? Geometry.fromJSON(regionInfo.geometry) : null,
  )
  region = await regionRepo.saveByExternalId(newRegion)
  console.log(`   ✅ ${regionName} creada`)
  return region
}

function printFinalReport(result: ImportResult, duration: string) {
  console.log('')
  console.log('='.repeat(80))
  console.log('🎉 TEST CHESTE COMPLETADO')
  console.log('='.repeat(80))
  console.log('')
  console.log('📊 RESUMEN:')
  console.log(`   Crags: ${result.cragsCreated}`)
  console.log(`   Areas: ${result.areasCreated}`)
  console.log(`   Sectors: ${result.sectorsCreated}`)
  console.log(`   Routes: ${result.routesCreated}`)
  console.log(`   Topos de sectores: ${result.toposCreated}`)
  console.log(`   Topo Positions (SVG data): ${result.topoPositionsCreated}`)
  console.log(`   Crag Topos (panorámicas): ${result.cragToposCreated}`)
  console.log(
    `   Crag Topo Positions (sectores SVG): ${result.cragTopoPositionsCreated}`,
  )
  console.log(`   Tiempo: ${duration}s`)
  console.log('')

  if (result.errors.length > 0) {
    console.log('⚠️  ERRORES:')
    for (const error of result.errors) {
      console.log(`   - ${error.nodeName}: ${error.message}`)
    }
    console.log('')
  }

  console.log('='.repeat(80))
}

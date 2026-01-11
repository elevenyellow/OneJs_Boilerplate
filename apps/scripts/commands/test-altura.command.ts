/**
 * Comando: test-altura
 * Scrape solo el crag de Altura (Castellón, Valencia) para testing de imágenes
 *
 * Este test es pequeño y enfocado para verificar:
 * - Extracción de topos de sectores
 * - Guardado de headerImageUrl en sectores
 * - Guardado de TopoImage y RouteTopoPosition
 */

import { AreaId, AreaPrismaRepository } from '@climb-zone/area'
import {
  ContinentEntity,
  ContinentPrismaRepository,
} from '@climb-zone/continent'
import {
  CountryEntity,
  CountryId,
  CountryPrismaRepository,
} from '@climb-zone/country'
import { CragId, CragPrismaRepository } from '@climb-zone/crag'
import {
  RegionEntity,
  RegionId,
  RegionPrismaRepository,
} from '@climb-zone/region'
import { RoutePrismaRepository } from '@climb-zone/route'
import { SectorPrismaRepository, SectorStatsService } from '@climb-zone/sector'
import { ExternalId, Geometry, Name } from '@climb-zone/shared'
import {
  TopoImageEntity,
  TopoImageId,
  TopoPrismaRepository,
  CragTopoImageEntity,
  type CragTopoSectorPositionData,
} from '@climb-zone/topo'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import type { ScrapedCragNode, ScrapedRouteData } from '@scraper-thecrag'
import { TheCragApiScraper } from '@scraper-thecrag'
import { ScrapedDataMapperService } from '@scraper-thecrag/application/services/scraped-data-mapper.service'

// Altura IDs from TheCrag
const ALTURA_ID = 782524281 // Altura crag
const COMUNIDAD_VALENCIANA_ID = 22687829 // Valencia region

interface Stats {
  crags: number
  areas: number
  sectors: number
  routes: number
  topos: number
  topoPositions: number
  cragTopos: number
  cragTopoPositions: number
  headerImages: number
  cragHeaderImageUrl: string | null
  cragOverviewTopoUrl: string | null
  sectorImages: {
    name: string
    headerImageUrl: string | null
    topoCount: number
  }[]
  errors: string[]
}

export async function testAltura(container: unknown, cookie: string) {
  // Get repositories and services from container
  const dic = container as { get: <T>(token: unknown) => T }
  const scraper = dic.get<TheCragApiScraper>(TheCragApiScraper)
  const mapper = dic.get<ScrapedDataMapperService>(ScrapedDataMapperService)
  const countryRepo = dic.get<CountryPrismaRepository>(CountryPrismaRepository)
  const continentRepo = dic.get<ContinentPrismaRepository>(
    ContinentPrismaRepository,
  )
  const regionRepo = dic.get<RegionPrismaRepository>(RegionPrismaRepository)
  const cragRepo = dic.get<CragPrismaRepository>(CragPrismaRepository)
  const areaRepo = dic.get<AreaPrismaRepository>(AreaPrismaRepository)
  const sectorRepo = dic.get<SectorPrismaRepository>(SectorPrismaRepository)
  const routeRepo = dic.get<RoutePrismaRepository>(RoutePrismaRepository)
  const topoRepo = dic.get<TopoPrismaRepository>(TopoPrismaRepository)
  const statsService = dic.get<SectorStatsService>(SectorStatsService)

  // Configure scraper with topos enabled
  scraper.setCookie(cookie)
  scraper.setDelay(200) // Slightly slower to allow topo fetching
  scraper.setOptions({ includeTopos: true })

  const stats: Stats = {
    crags: 0,
    areas: 0,
    sectors: 0,
    routes: 0,
    topos: 0,
    topoPositions: 0,
    cragTopos: 0,
    cragTopoPositions: 0,
    headerImages: 0,
    cragHeaderImageUrl: null,
    cragOverviewTopoUrl: null,
    sectorImages: [],
    errors: [],
  }

  console.log('🏔️  TEST ALTURA - Verificación de imágenes de sectores y topos')
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
    console.log('📍 Step 3: Ejecutando scraper para Altura...')
    console.log('   (El scraper obtiene info, imágenes, topos y rutas)')
    console.log('')

    const scrapedData = await scraper.scrapeCrag(ALTURA_ID, 'Altura', 'Crag')

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

    // Step 4: Save scraped data to database
    console.log('📍 Step 4: Guardando datos en base de datos...')
    console.log('')

    await saveScrapedCrag(
      scrapedData,
      spainCountryId,
      valenciaRegion.id,
      mapper,
      cragRepo,
      areaRepo,
      sectorRepo,
      routeRepo,
      topoRepo,
      statsService,
      stats,
    )

    // Final report
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    printFinalReport(stats, duration)
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
  const SPAIN_ID = 16227917
  const EUROPE_ID = 7546062

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

/**
 * Save scraped crag data to database
 * Processes the tree structure returned by scraper.scrapeCrag()
 */
async function saveScrapedCrag(
  scrapedData: ScrapedCragNode,
  countryId: CountryId,
  regionId: RegionId,
  mapper: ScrapedDataMapperService,
  cragRepo: CragPrismaRepository,
  areaRepo: AreaPrismaRepository,
  sectorRepo: SectorPrismaRepository,
  routeRepo: RoutePrismaRepository,
  topoRepo: TopoPrismaRepository,
  statsService: SectorStatsService,
  stats: Stats,
): Promise<void> {
  // Save the crag
  console.log(`   💾 Guardando Crag: ${scrapedData.name}`)

  const cragData = mapper.mapToCrag(
    scrapedData.id,
    scrapedData.name,
    countryId,
    scrapedData.info?.geometry,
    scrapedData.info ?? null,
    regionId,
  )
  const crag = await cragRepo.saveByExternalId(
    mapper.createCragEntity(cragData),
    scrapedData.info?.apiResponseRaw,
  )
  stats.crags++
  stats.cragHeaderImageUrl = scrapedData.info?.headerImageUrl ?? null

  console.log(`      ✅ Crag guardado: ${crag.id.toString()}`)
  console.log(
    `      - Header Image: ${scrapedData.info?.headerImageUrl ? '✅' : '❌'}`,
  )
  console.log(
    `      - Overview Topo: ${scrapedData.cragTopos?.length ?? 0} (panorámica de sectores)`,
  )
  console.log('')

  // Save crag overview topos (panoramic view with sector positions)
  if (scrapedData.cragTopos && scrapedData.cragTopos.length > 0) {
    console.log(`   🗺️  Guardando topos panorámicos del crag...`)
    for (const topoData of scrapedData.cragTopos) {
      try {
        const topoEntity = new CragTopoImageEntity(
          TopoImageId.generate(),
          topoData.topoId,
          crag.id,
          topoData.thumbnailUrl,
          topoData.fullImageUrl,
          topoData.width,
          topoData.height,
          topoData.originalWidth,
          topoData.originalHeight,
          topoData.viewScale,
          null, // sourceUrl
        )

        // Build position data for each sector annotation
        const positions: CragTopoSectorPositionData[] = []
        for (const annotation of topoData.routes) {
          if (annotation.type === 'area') {
            positions.push({
              sectorId: null, // Will be linked later
              areaNumber: annotation.num,
              areaName: annotation.name,
              points: annotation.points,
              zindex: parseInt(annotation.zindex) || 0,
              order: annotation.order,
              externalAreaId: annotation.id ? BigInt(annotation.id) : null,
              areaUrl: annotation.url || null,
            })
          }
        }

        const { positionsCreated } =
          await topoRepo.saveCragTopoImageWithPositions(topoEntity, positions)
        stats.cragTopos++
        stats.cragTopoPositions += positionsCreated
        stats.cragOverviewTopoUrl = topoData.fullImageUrl

        console.log(
          `      ✅ Crag Topo ${topoData.topoId}: ${positionsCreated} sectores con SVG`,
        )
      } catch (error: unknown) {
        const err = error as Error
        console.warn(
          `      ⚠️  Error guardando crag topo ${topoData.topoId}: ${err.message}`,
        )
      }
    }
    console.log('')
  }

  // Process children (sectors/areas)
  for (const child of scrapedData.children) {
    try {
      await processScrapedNode(
        child,
        crag.id,
        null, // No parent area for direct children of crag
        mapper,
        areaRepo,
        sectorRepo,
        routeRepo,
        topoRepo,
        statsService,
        stats,
      )
    } catch (error: unknown) {
      const err = error as Error
      stats.errors.push(`${child.name}: ${err.message}`)
      console.error(`   ❌ Error en ${child.name}: ${err.message}`)
    }
  }
}

/**
 * Process a scraped node (Area, Sector, or Cliff)
 * Recursively processes children
 */
async function processScrapedNode(
  node: ScrapedCragNode,
  cragId: CragId,
  parentAreaId: AreaId | null,
  mapper: ScrapedDataMapperService,
  areaRepo: AreaPrismaRepository,
  sectorRepo: SectorPrismaRepository,
  routeRepo: RoutePrismaRepository,
  topoRepo: TopoPrismaRepository,
  statsService: SectorStatsService,
  stats: Stats,
): Promise<void> {
  console.log(`   🔍 Procesando: ${node.name} (${node.type})`)

  const hasRoutes = node.routes && node.routes.length > 0
  const hasTopos = node.topos && node.topos.length > 0

  console.log(`      📊 Info del scraper:`)
  console.log(`         - Routes: ${node.routes?.length ?? 0}`)
  console.log(`         - Topos: ${node.topos?.length ?? 0}`)
  console.log(
    `         - Header Image: ${node.info?.headerImageUrl ? '✅' : '❌'}`,
  )

  // If this node has routes, treat it as a sector (needs an area parent)
  if (hasRoutes) {
    // Create area first
    const areaData = mapper.mapToArea(
      node.id,
      node.name,
      cragId,
      parentAreaId,
      node.info?.geometry,
      node.info ?? null,
      node.type,
    )
    const area = await areaRepo.saveByExternalId(
      mapper.createAreaEntity(areaData),
      node.info?.apiResponseRaw,
    )
    stats.areas++

    // Create sector
    const sectorData = mapper.mapToSector(
      node.id,
      node.name,
      area.id,
      node.info?.geometry,
      node.info ?? null,
      node.type,
    )
    const sector = await sectorRepo.saveByExternalId(
      mapper.createSectorEntity(sectorData),
      node.info?.apiResponseRaw,
    )
    stats.sectors++

    // Track header image
    if (node.info?.headerImageUrl) {
      stats.headerImages++
    }

    // Build topo number map from topo data
    const topoNumberMap = new Map<number, string>()
    if (hasTopos) {
      for (const topo of node.topos!) {
        for (const topoRoute of topo.routes) {
          if (
            topoRoute.id &&
            topoRoute.num &&
            !topoNumberMap.has(topoRoute.id)
          ) {
            topoNumberMap.set(topoRoute.id, topoRoute.num)
          }
        }
      }
    }

    // Save routes
    const savedRouteIds = new Map<number, RouteId>()
    for (const route of node.routes!) {
      const topoNum = topoNumberMap.get(route.id)
      const routeData = mapper.mapToRoute(route, sector.id, topoNum)
      const savedRoute = await routeRepo.saveByExternalId(
        mapper.createRouteEntity(routeData),
      )
      savedRouteIds.set(route.id, savedRoute.id)
      stats.routes++
    }

    // Calculate and update sector stats (avgGrade, avgHeight, maxHeight, etc.)
    const sectorStats = calculateSectorStats(node.routes!, statsService)
    sector.updateStats(sectorStats)
    await sectorRepo.updateStats(sector)
    console.log(
      `      📊 Stats calculados: ${sectorStats.routeCount} rutas, avg: ${sectorStats.avgGrade}, maxH: ${sectorStats.maxHeight}m`,
    )

    // Save topos with positions (SVG data)
    let sectorTopoCount = 0
    if (hasTopos) {
      for (const topoData of node.topos!) {
        try {
          const topoEntity = new TopoImageEntity(
            TopoImageId.generate(),
            topoData.topoId,
            sector.id,
            topoData.thumbnailUrl,
            topoData.fullImageUrl,
            topoData.width,
            topoData.height,
            topoData.originalWidth,
            topoData.originalHeight,
            topoData.viewScale,
            null,
          )

          // Build positions for routes (contains SVG points data)
          const positions: Array<{
            routeId: RouteId
            topoNumber: string
            points: string
            zindex?: number
            order?: number
            gradeClass?: string | null
          }> = []

          for (const topoRoute of topoData.routes) {
            const internalRouteId = savedRouteIds.get(topoRoute.id)
            if (internalRouteId) {
              positions.push({
                routeId: internalRouteId,
                topoNumber: topoRoute.num,
                points: topoRoute.points, // SVG path data
                zindex: parseInt(topoRoute.zindex) || 0,
                order: topoRoute.order,
                gradeClass: topoRoute.gradeClass,
              })
            }
          }

          if (positions.length > 0) {
            const { positionsCreated } =
              await topoRepo.saveTopoImageWithPositions(topoEntity, positions)
            stats.topos++
            stats.topoPositions += positionsCreated
            sectorTopoCount++
            console.log(
              `      ✅ Topo ${topoData.topoId}: ${positions.length} rutas con SVG`,
            )
          }
        } catch (error: unknown) {
          const err = error as Error
          console.warn(
            `      ⚠️  Error guardando topo ${topoData.topoId}: ${err.message}`,
          )
        }
      }
    }

    // Track sector image info
    stats.sectorImages.push({
      name: node.name,
      headerImageUrl: node.info?.headerImageUrl ?? null,
      topoCount: sectorTopoCount,
    })

    console.log(`      ✅ Sector guardado: ${node.name}`)
    console.log('')
  }

  // Process children recursively
  for (const child of node.children) {
    await processScrapedNode(
      child,
      cragId,
      null, // For simplicity, not tracking nested areas
      mapper,
      areaRepo,
      sectorRepo,
      routeRepo,
      topoRepo,
      statsService,
      stats,
    )
  }
}

/**
 * Calculate sector statistics from scraped routes
 */
function calculateSectorStats(
  routes: ScrapedRouteData[],
  statsService: SectorStatsService,
) {
  const routeData = routes.map((r) => ({
    grade: r.grade,
    height: r.height,
    ascents: r.ascents,
  }))
  return statsService.calculateStats(routeData)
}

function printFinalReport(stats: Stats, duration: string) {
  console.log('')
  console.log('='.repeat(80))
  console.log('🎉 TEST ALTURA COMPLETADO')
  console.log('='.repeat(80))
  console.log('')
  console.log('📊 RESUMEN:')
  console.log(`   Crags: ${stats.crags}`)
  console.log(`   Areas: ${stats.areas}`)
  console.log(`   Sectors: ${stats.sectors}`)
  console.log(`   Routes: ${stats.routes}`)
  console.log(`   Topos de sectores: ${stats.topos}`)
  console.log(`   Topo Positions (SVG data): ${stats.topoPositions}`)
  console.log(`   Crag Topos (panorámicas): ${stats.cragTopos}`)
  console.log(`   Crag Topo Positions (sectores SVG): ${stats.cragTopoPositions}`)
  console.log(`   Header Images: ${stats.headerImages}`)
  console.log(`   Tiempo: ${duration}s`)
  console.log('')

  console.log('🖼️  IMAGEN DEL CRAG:')
  if (stats.cragHeaderImageUrl) {
    console.log(`   ✅ Header: ${stats.cragHeaderImageUrl.substring(0, 70)}...`)
  } else {
    console.log(`   ❌ No se encontró imagen de cabecera para el crag`)
  }
  if (stats.cragOverviewTopoUrl) {
    console.log(`   ✅ Overview Topo (panorámica): ${stats.cragOverviewTopoUrl.substring(0, 70)}...`)
  } else {
    console.log(`   ❌ No se encontró topo panorámico para el crag`)
  }
  console.log('')

  console.log('🖼️  IMÁGENES POR SECTOR:')
  for (const sector of stats.sectorImages) {
    const hasHeader = sector.headerImageUrl ? '✅' : '❌'
    const topoInfo =
      sector.topoCount > 0 ? `${sector.topoCount} topos` : 'sin topos'
    console.log(`   ${hasHeader} ${sector.name}: ${topoInfo}`)
    if (sector.headerImageUrl) {
      console.log(`      URL: ${sector.headerImageUrl.substring(0, 70)}...`)
    }
  }
  console.log('')

  if (stats.errors.length > 0) {
    console.log('⚠️  ERRORES:')
    for (const error of stats.errors) {
      console.log(`   - ${error}`)
    }
    console.log('')
  }

  // Summary
  const sectorsWithImages = stats.sectorImages.filter(
    (s) => s.headerImageUrl,
  ).length
  const sectorsWithTopos = stats.sectorImages.filter(
    (s) => s.topoCount > 0,
  ).length
  console.log('📈 ANÁLISIS:')
  console.log(
    `   Sectores con header image: ${sectorsWithImages}/${stats.sectorImages.length}`,
  )
  console.log(
    `   Sectores con topos: ${sectorsWithTopos}/${stats.sectorImages.length}`,
  )
  console.log('')

  if (sectorsWithImages === 0 && stats.sectors > 0) {
    console.log('⚠️  PROBLEMA DETECTADO: Ningún sector tiene header image!')
    console.log('   Posibles causas:')
    console.log('   1. Cookie expirada - necesitas una cookie nueva')
    console.log('   2. Los sectores no tienen topos en TheCrag')
    console.log('   3. Error en la extracción de topos desde HTML')
  }

  if (stats.topos === 0 && stats.sectors > 0) {
    console.log('⚠️  PROBLEMA DETECTADO: No se guardaron topos!')
    console.log('   Posibles causas:')
    console.log('   1. Los sectores no tienen topos fotográficos')
    console.log('   2. Error al parsear data-topodata del HTML')
    console.log('   3. Cookie expirada o sin permisos')
  }

  console.log('='.repeat(80))
}

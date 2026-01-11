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
import { SectorPrismaRepository } from '@climb-zone/sector'
import { ExternalId, Geometry, Name } from '@climb-zone/shared'
import {
  TopoImageEntity,
  TopoImageId,
  TopoPrismaRepository,
} from '@climb-zone/topo'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import type { TopoImageData } from '@scraper-thecrag'
import { TheCragApiScraper } from '@scraper-thecrag'
import { ScrapedDataMapperService } from '@scraper-thecrag/application/services/scraped-data-mapper.service'

// Altura IDs from TheCrag
const ALTURA_ID = 782524281 // Altura crag
const CASTELLON_ID = 782515039 // Castellón region (Altura está dentro de Castellón)
const COMUNIDAD_VALENCIANA_ID = 22687829 // Valencia region

interface Stats {
  crags: number
  areas: number
  sectors: number
  routes: number
  topos: number
  topoPositions: number
  headerImages: number
  sectorImages: {
    name: string
    headerImageUrl: string | null
    topoCount: number
  }[]
  errors: string[]
}

export async function testAltura(container: any, cookie: string) {
  // Get repositories and services from container
  const scraper = container.get(TheCragApiScraper)
  const mapper = container.get(ScrapedDataMapperService)
  const countryRepo = container.get(CountryPrismaRepository)
  const continentRepo = container.get(ContinentPrismaRepository)
  const regionRepo = container.get(RegionPrismaRepository)
  const cragRepo = container.get(CragPrismaRepository)
  const areaRepo = container.get(AreaPrismaRepository)
  const sectorRepo = container.get(SectorPrismaRepository)
  const routeRepo = container.get(RoutePrismaRepository)
  const topoRepo = container.get(TopoPrismaRepository)

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
    headerImages: 0,
    sectorImages: [],
    errors: [],
  }

  console.log('🏔️  TEST ALTURA - Verificación de imágenes de sectores y topos')
  console.log('='.repeat(80))
  console.log('')
  console.log('📍 Objetivo: Verificar que las imágenes se guardan correctamente')
  console.log('   - headerImageUrl en sectores')
  console.log('   - TopoImage con fullImageUrl y thumbnailUrl')
  console.log('   - RouteTopoPosition con points')
  console.log('')

  const startTime = Date.now()

  try {
    // Step 1: Ensure Spain exists in DB
    console.log('📍 Step 1: Verificando España en la base de datos...')
    let spainCountryId = await ensureSpainExists(
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
    console.log(`   ✅ Comunidad Valenciana ID: ${valenciaRegion.id.toString()}\n`)

    // Step 3: Get Altura crag info
    console.log('📍 Step 3: Obteniendo información de Altura...')
    const alturaInfo = await scraper.getNodeInfo(ALTURA_ID)
    console.log(`   📊 Altura info:`)
    console.log(`      - Name: ${alturaInfo?.name || 'Altura'}`)
    console.log(`      - numberRoutes: ${alturaInfo?.numberRoutes ?? 'N/A'}`)
    console.log(`      - numberTopos: ${alturaInfo?.numberTopos ?? 'N/A'}`)
    console.log(`      - hasTopo: ${alturaInfo?.hasTopo ?? 'N/A'}`)
    console.log(`      - urlStub: ${alturaInfo?.urlStub ?? 'N/A'}`)
    console.log(`      - geometry: ${alturaInfo?.geometry ? `lat: ${alturaInfo.geometry.lat}, lon: ${alturaInfo.geometry.long}` : 'N/A'}`)
    console.log('')

    // Step 4: Save Altura as a Crag
    console.log('📍 Step 4: Guardando Altura como Crag...')
    const alturaCrag = await saveCrag(
      scraper,
      mapper,
      cragRepo,
      ALTURA_ID,
      'Altura',
      spainCountryId,
      valenciaRegion.id,
      alturaInfo,
    )
    stats.crags++
    console.log(`   ✅ Crag guardado:`)
    console.log(`      - ID interno: ${alturaCrag.id.toString()}`)
    console.log(`      - External ID: ${alturaCrag.externalId.toNumber()}`)
    console.log(`      - Country ID: ${alturaCrag.countryId.toString()}`)
    console.log('')

    // Step 5: Get Altura children (sectors)
    console.log('📍 Step 5: Obteniendo sectores de Altura...')
    const alturaChildren = await scraper.getChildren(ALTURA_ID)
    console.log(`   📊 Encontrados ${alturaChildren.length} hijos\n`)

    // Step 6: Process each sector
    console.log('📍 Step 6: Procesando sectores...')
    console.log('')

    for (const child of alturaChildren) {
      try {
        await processSectorNode(
          child.id,
          child.name,
          alturaCrag.id,
          scraper,
          mapper,
          areaRepo,
          sectorRepo,
          routeRepo,
          topoRepo,
          stats,
        )
      } catch (error: any) {
        stats.errors.push(`${child.name}: ${error.message}`)
        console.error(`   ❌ Error en ${child.name}: ${error.message}`)
      }
    }

    // Final report
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    printFinalReport(stats, duration)

  } catch (error: any) {
    console.error(`\n❌ Error fatal: ${error.message}`)
    console.error(error.stack)
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
  let europe = await continentRepo.findByExternalId(ExternalId.create(EUROPE_ID))
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
    europe.id.toString(),
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
  let region = await regionRepo.findByExternalId(ExternalId.create(regionExternalId))
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

async function saveCrag(
  scraper: TheCragApiScraper,
  mapper: ScrapedDataMapperService,
  cragRepo: CragPrismaRepository,
  cragExternalId: number,
  cragName: string,
  countryId: CountryId,
  regionId: RegionId,
  info: any,
): Promise<any> {
  const cragData = mapper.mapToCrag(
    cragExternalId,
    cragName,
    countryId,
    info?.geometry,
    info,
    regionId,
  )
  return await cragRepo.saveByExternalId(
    mapper.createCragEntity(cragData),
    info?.apiResponseRaw,
  )
}

async function processSectorNode(
  nodeId: number,
  nodeName: string,
  cragId: CragId,
  scraper: TheCragApiScraper,
  mapper: ScrapedDataMapperService,
  areaRepo: AreaPrismaRepository,
  sectorRepo: SectorPrismaRepository,
  routeRepo: RoutePrismaRepository,
  topoRepo: TopoPrismaRepository,
  stats: Stats,
): Promise<void> {
  console.log(`   🔍 Procesando: ${nodeName} (ID: ${nodeId})`)

  // Fetch data from API
  const [info, children, routes] = await Promise.all([
    scraper.getNodeInfo(nodeId),
    scraper.getChildren(nodeId),
    scraper.getRoutes(nodeId),
  ])

  // Fetch topos from sector page
  let topos: TopoImageData[] = []
  // Build URL path - use urlStub if available, otherwise construct from urlAncestorStub + nodeId
  let sectorPath: string | null = null
  if (info?.urlStub) {
    sectorPath = `/en/climbing/${info.urlAncestorStub || ''}${info.urlStub}`
  } else if (info?.urlAncestorStub) {
    // Fallback: construct URL from ancestor + area/nodeId
    sectorPath = `/en/climbing/${info.urlAncestorStub}/area/${nodeId}`
  }
  
  if (sectorPath) {
    console.log(`      📸 Buscando topos en: ${sectorPath}`)
    topos = await scraper.getToposFromSectorPage(sectorPath).catch((e) => {
      console.log(`      ⚠️  Error obteniendo topos: ${e.message}`)
      return [] as TopoImageData[]
    })
  } else {
    console.log(`      ⚠️  No se puede construir URL del sector`)
  }

  // Fetch header image (use same sectorPath we built above)
  let headerImageUrl: string | null = null
  if (sectorPath) {
    headerImageUrl = await scraper.getHeaderImage(nodeId, sectorPath)
  }

  console.log(`      📊 Info:`)
  console.log(`         - Routes: ${routes.length}`)
  console.log(`         - Topos: ${topos.length}`)
  console.log(`         - Header Image: ${headerImageUrl ? '✅' : '❌'}`)

  // If has routes, this is a sector
  if (routes.length > 0) {
    // Create area first
    console.log(`      🔧 Creando Area con cragId: ${cragId.toString()}`)
    
    const areaData = mapper.mapToArea(
      nodeId,
      info?.name || nodeName,
      cragId,
      null,
      info?.geometry,
      info,
      'Area',
    )
    console.log(`      🔧 AreaData.cragId: ${areaData.cragId.toString()}`)
    
    const areaEntity = mapper.createAreaEntity(areaData)
    console.log(`      🔧 AreaEntity.cragId: ${areaEntity.cragId.toString()}`)
    
    const area = await areaRepo.saveByExternalId(areaEntity, info?.apiResponseRaw)
    stats.areas++

    // Create sector
    const sectorData = mapper.mapToSector(
      nodeId,
      info?.name || nodeName,
      area.id,
      info?.geometry,
      info,
      'Sector',
    )
    const sector = await sectorRepo.saveByExternalId(
      mapper.createSectorEntity(sectorData),
      info?.apiResponseRaw,
    )
    stats.sectors++

    // Build topo number map from topo data
    const topoNumberMap = new Map<number, string>()
    for (const topo of topos) {
      for (const topoRoute of topo.routes) {
        if (topoRoute.id && topoRoute.num && !topoNumberMap.has(topoRoute.id)) {
          topoNumberMap.set(topoRoute.id, topoRoute.num)
        }
      }
    }

    // Save routes
    const savedRouteIds = new Map<number, RouteId>()
    for (const route of routes) {
      const topoNum = topoNumberMap.get(route.id)
      const routeData = mapper.mapToRoute(route, sector.id, topoNum)
      const savedRoute = await routeRepo.saveByExternalId(
        mapper.createRouteEntity(routeData),
      )
      savedRouteIds.set(route.id, savedRoute.id)
      stats.routes++
    }

    // Save topos with positions
    let sectorTopoCount = 0
    if (topos.length > 0) {
      for (const topoData of topos) {
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

          // Build positions for routes that we saved
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
                points: topoRoute.points,
                zindex: parseInt(topoRoute.zindex) || 0,
                order: topoRoute.order,
                gradeClass: topoRoute.gradeClass,
              })
            }
          }

          if (positions.length > 0) {
            const { positionsCreated } = await topoRepo.saveTopoImageWithPositions(
              topoEntity,
              positions,
            )
            stats.topos++
            stats.topoPositions += positionsCreated
            sectorTopoCount++
            console.log(`      ✅ Topo ${topoData.topoId}: ${positions.length} posiciones guardadas`)
            console.log(`         - thumbnailUrl: ${topoData.thumbnailUrl.substring(0, 50)}...`)
            console.log(`         - fullImageUrl: ${topoData.fullImageUrl.substring(0, 50)}...`)
          }
        } catch (error: any) {
          console.warn(`      ⚠️  Error guardando topo ${topoData.topoId}: ${error.message}`)
        }
      }
    }

    // Update header image if we have one
    if (topos.length > 0 && topos[0].fullImageUrl) {
      await sectorRepo.updateHeaderImage(
        sector.id,
        topos[0].fullImageUrl,
        topos[0].originalWidth,
        topos[0].originalHeight,
      )
      stats.headerImages++
      headerImageUrl = topos[0].fullImageUrl
      console.log(`      🖼️  Header image actualizada desde topo`)
    } else if (headerImageUrl) {
      await sectorRepo.updateHeaderImage(sector.id, headerImageUrl)
      stats.headerImages++
      console.log(`      🖼️  Header image actualizada desde scraping`)
    }

    // Track sector image info
    stats.sectorImages.push({
      name: nodeName,
      headerImageUrl: headerImageUrl,
      topoCount: sectorTopoCount,
    })

    console.log(`      ✅ Sector guardado: ${nodeName}`)
    console.log('')
  }

  // Process children recursively
  for (const child of children) {
    await processSectorNode(
      child.id,
      child.name,
      cragId,
      scraper,
      mapper,
      areaRepo,
      sectorRepo,
      routeRepo,
      topoRepo,
      stats,
    )
  }
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
  console.log(`   Topos: ${stats.topos}`)
  console.log(`   Topo Positions: ${stats.topoPositions}`)
  console.log(`   Header Images: ${stats.headerImages}`)
  console.log(`   Tiempo: ${duration}s`)
  console.log('')

  console.log('🖼️  IMÁGENES POR SECTOR:')
  for (const sector of stats.sectorImages) {
    const hasHeader = sector.headerImageUrl ? '✅' : '❌'
    const topoInfo = sector.topoCount > 0 ? `${sector.topoCount} topos` : 'sin topos'
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
  const sectorsWithImages = stats.sectorImages.filter((s) => s.headerImageUrl).length
  const sectorsWithTopos = stats.sectorImages.filter((s) => s.topoCount > 0).length
  console.log('📈 ANÁLISIS:')
  console.log(`   Sectores con header image: ${sectorsWithImages}/${stats.sectorImages.length}`)
  console.log(`   Sectores con topos: ${sectorsWithTopos}/${stats.sectorImages.length}`)
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

import { PrismaClient } from '@prisma/client'

/**
 * Query API responses stored in the database
 * This allows us to inspect scraped data without calling the API again
 */
export async function queryApiResponse(
  entityType: 'crag' | 'area' | 'sector',
  externalId: number,
): Promise<void> {
  console.log(
    `\n🔍 Consultando ${entityType} con externalId: ${externalId}...\n`,
  )

  const prisma = new PrismaClient()

  try {
    let result: any = null

    switch (entityType) {
      case 'crag':
        result = await prisma.crag.findUnique({
          where: { externalId: BigInt(externalId) },
          select: {
            id: true,
            name: true,
            externalId: true,
            apiResponseRaw: true,
          },
        })
        break

      case 'area':
        result = await prisma.area.findUnique({
          where: { externalId: BigInt(externalId) },
          select: {
            id: true,
            name: true,
            externalId: true,
            type: true,
            cragId: true,
            parentAreaId: true,
            apiResponseRaw: true,
          },
        })
        break

      case 'sector':
        result = await prisma.sector.findUnique({
          where: { externalId: BigInt(externalId) },
          select: {
            id: true,
            name: true,
            externalId: true,
            type: true,
            areaId: true,
            apiResponseRaw: true,
          },
        })
        break
    }

    if (!result) {
      console.log(`❌ No se encontró ${entityType} con externalId: ${externalId}`)
      return
    }

    console.log(`✅ ${entityType.toUpperCase()} encontrado:`)
    console.log(`   - ID: ${result.id}`)
    console.log(`   - Name: ${result.name}`)
    console.log(`   - External ID: ${result.externalId}`)
    if ('type' in result) {
      console.log(`   - Type: ${result.type}`)
    }
    if ('cragId' in result) {
      console.log(`   - Crag ID: ${result.cragId}`)
    }
    if ('parentAreaId' in result) {
      console.log(`   - Parent Area ID: ${result.parentAreaId ?? 'null'}`)
    }
    if ('areaId' in result) {
      console.log(`   - Area ID: ${result.areaId}`)
    }

    console.log('\n📦 API Response Raw:')
    if (result.apiResponseRaw) {
      console.log(JSON.stringify(result.apiResponseRaw, null, 2))
    } else {
      console.log('   (no data)')
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error(`\n❌ Error: ${err.message}`)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * List all areas for a crag
 */
export async function listCragAreas(cragExternalId: number): Promise<void> {
  console.log(
    `\n🔍 Listando áreas del crag con externalId: ${cragExternalId}...\n`,
  )

  const prisma = new PrismaClient()

  try {
    // First find the crag
    const crag = await prisma.crag.findUnique({
      where: { externalId: BigInt(cragExternalId) },
      select: {
        id: true,
        name: true,
        externalId: true,
      },
    })

    if (!crag) {
      console.log(`❌ No se encontró crag con externalId: ${cragExternalId}`)
      return
    }

    console.log(`✅ CRAG: ${crag.name} (${crag.externalId})`)
    console.log(`   ID: ${crag.id}\n`)

    // Find all areas for this crag
    const areas = await prisma.area.findMany({
      where: { cragId: crag.id },
      select: {
        id: true,
        name: true,
        externalId: true,
        type: true,
        parentAreaId: true,
        _count: {
          select: {
            sectors: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    console.log(`📍 AREAS (${areas.length} total):`)
    for (const area of areas) {
      const parentInfo = area.parentAreaId ? `parent: ${area.parentAreaId}` : 'root'
      console.log(
        `   - ${area.name} (${area.type}) [${parentInfo}] - ${area._count.sectors} sectores`,
      )
      console.log(`     ExternalId: ${area.externalId}`)
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error(`\n❌ Error: ${err.message}`)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * List all sectors for an area
 */
export async function listAreaSectors(areaExternalId: number): Promise<void> {
  console.log(
    `\n🔍 Listando sectores del área con externalId: ${areaExternalId}...\n`,
  )

  const prisma = new PrismaClient()

  try {
    // First find the area
    const area = await prisma.area.findUnique({
      where: { externalId: BigInt(areaExternalId) },
      select: {
        id: true,
        name: true,
        externalId: true,
        type: true,
      },
    })

    if (!area) {
      console.log(`❌ No se encontró área con externalId: ${areaExternalId}`)
      return
    }

    console.log(`✅ AREA: ${area.name} (${area.type})`)
    console.log(`   ExternalId: ${area.externalId}`)
    console.log(`   ID: ${area.id}\n`)

    // Find all sectors for this area
    const sectors = await prisma.sector.findMany({
      where: { areaId: area.id },
      select: {
        id: true,
        name: true,
        externalId: true,
        type: true,
        routeCount: true,
      },
      orderBy: { name: 'asc' },
    })

    console.log(`📍 SECTORES (${sectors.length} total):`)
    for (const sector of sectors) {
      console.log(
        `   - ${sector.name} (${sector.type}) - ${sector.routeCount} rutas`,
      )
      console.log(`     ExternalId: ${sector.externalId}`)
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error(`\n❌ Error: ${err.message}`)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

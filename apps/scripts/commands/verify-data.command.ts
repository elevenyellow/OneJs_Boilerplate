/**
 * Comando: verify-data
 * Verifica que todos los datos se guardaron correctamente en la BD
 */

import { PrismaClientOneJs } from '@OneJs/prisma'

export async function verifyData(container: any) {
  const prisma = container.get(PrismaClientOneJs)

  console.log('🔍 Verificando datos guardados en la base de datos...\n')

  // Consultar algunos sectores de Valencia
  console.log('📍 Consultando sectores de Valencia...\n')
  
  const sectors = await prisma.sector.findMany({
    take: 5,
    orderBy: { totalFavorites: 'desc' },
    select: {
      name: true,
      altNames: true,
      locatedness: true,
      orientation: true,
      rockType: true,
      climbingStyle: true,
      sunExposure: true,
      sheltered: true,
      numberPhotos: true,
      numberTopos: true,
      totalFavorites: true,
      isTLC: true,
      ascentCount: true,
      maxPop: true,
      priceCategory: true,
      kudos: true,
      siblingLabel: true,
      tagsRaw: true,
      urlStub: true,
      urlAncestorStub: true,
      lastPDFSize: true,
      lastPDFStaticDate: true,
      routeCount: true,
    },
  })

  console.log(`✅ Encontrados ${sectors.length} sectores\n`)
  console.log('='.repeat(80))

  sectors.forEach((sector, idx) => {
    console.log(`\n${idx + 1}. 🧗 ${sector.name}`)
    console.log('   ' + '-'.repeat(75))
    
    // Campos básicos
    console.log(`   📊 Rutas: ${sector.routeCount}`)
    
    // Campos nuevos de alta prioridad
    if (sector.altNames?.length) {
      console.log(`   🏷️  Nombres alternativos: ${sector.altNames.join(', ')}`)
    }
    if (sector.locatedness !== null) {
      console.log(`   📍 Locatedness (precisión GPS): ${sector.locatedness}`)
    }
    if (sector.numberPhotos) {
      console.log(`   📷 Fotos: ${sector.numberPhotos}`)
    }
    if (sector.numberTopos) {
      console.log(`   📄 Topos: ${sector.numberTopos}`)
    }
    if (sector.totalFavorites) {
      console.log(`   ⭐ Favoritos: ${sector.totalFavorites}`)
    }
    if (sector.isTLC) {
      console.log(`   🏆 Top Level Crag: ${sector.isTLC}`)
    }
    if (sector.ascentCount) {
      console.log(`   🧗 Ascensos: ${sector.ascentCount}`)
    }
    if (sector.maxPop) {
      console.log(`   📈 Popularidad máxima: ${sector.maxPop}`)
    }
    
    // Campos de características físicas
    if (sector.orientation) {
      console.log(`   🧭 Orientación: ${sector.orientation}`)
    }
    if (sector.rockType) {
      console.log(`   🪨 Tipo de roca: ${sector.rockType}`)
    }
    if (sector.climbingStyle?.length) {
      console.log(`   🧗 Estilo: ${sector.climbingStyle.join(', ')}`)
    }
    if (sector.sunExposure) {
      console.log(`   ☀️  Exposición solar: ${sector.sunExposure}`)
    }
    if (sector.sheltered !== null) {
      console.log(`   🛡️  Protegido: ${sector.sheltered ? 'Sí' : 'No'}`)
    }
    
    // Campos de metadata
    if (sector.priceCategory) {
      console.log(`   💰 Precio: ${sector.priceCategory}`)
    }
    if (sector.kudos) {
      console.log(`   👍 Kudos: ${sector.kudos}`)
    }
    if (sector.siblingLabel) {
      console.log(`   🏷️  Sibling Label: ${sector.siblingLabel}`)
    }
    
    // URLs
    if (sector.urlStub) {
      console.log(`   🔗 URL Stub: ${sector.urlStub}`)
    }
    if (sector.urlAncestorStub) {
      console.log(`   🔗 Ancestor Stub: ${sector.urlAncestorStub}`)
    }
    
    // Tags raw
    if (sector.tagsRaw) {
      console.log(`   🏷️  Tags originales: ${JSON.stringify(sector.tagsRaw).substring(0, 100)}...`)
    }
  })

  console.log('\n' + '='.repeat(80))

  // Consultar algunos crags
  console.log('\n⛰️  Consultando crags de Valencia...\n')
  
  const crags = await prisma.crag.findMany({
    take: 3,
    orderBy: { totalFavorites: 'desc' },
    select: {
      name: true,
      altNames: true,
      locatedness: true,
      numberPhotos: true,
      numberTopos: true,
      hasTopo: true,
      totalFavorites: true,
      kudos: true,
      ascentCount: true,
      maxPop: true,
      priceCategory: true,
      tagsRaw: true,
      urlStub: true,
      urlAncestorStub: true,
    },
  })

  console.log(`✅ Encontrados ${crags.length} crags\n`)
  console.log('='.repeat(80))

  crags.forEach((crag, idx) => {
    console.log(`\n${idx + 1}. ⛰️  ${crag.name}`)
    console.log('   ' + '-'.repeat(75))
    
    if (crag.altNames?.length) {
      console.log(`   🏷️  Nombres alternativos: ${crag.altNames.join(', ')}`)
    }
    if (crag.locatedness !== null) {
      console.log(`   📍 Locatedness: ${crag.locatedness}`)
    }
    if (crag.numberPhotos) {
      console.log(`   📷 Fotos: ${crag.numberPhotos}`)
    }
    if (crag.numberTopos) {
      console.log(`   📄 Topos: ${crag.numberTopos}`)
    }
    if (crag.hasTopo) {
      console.log(`   📝 Tiene topo: ${crag.hasTopo}`)
    }
    if (crag.totalFavorites) {
      console.log(`   ⭐ Favoritos: ${crag.totalFavorites}`)
    }
    if (crag.kudos) {
      console.log(`   👍 Kudos: ${crag.kudos}`)
    }
    if (crag.ascentCount) {
      console.log(`   🧗 Ascensos: ${crag.ascentCount}`)
    }
    if (crag.maxPop) {
      console.log(`   📈 Popularidad: ${crag.maxPop}`)
    }
    if (crag.priceCategory) {
      console.log(`   💰 Precio: ${crag.priceCategory}`)
    }
    if (crag.urlStub) {
      console.log(`   🔗 URL: thecrag.com/climbing/${crag.urlStub}`)
    }
    if (crag.tagsRaw) {
      console.log(`   🏷️  Tags: ${JSON.stringify(crag.tagsRaw).substring(0, 80)}...`)
    }
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Verificación completada!\n')
  
  // Estadísticas generales
  const stats = await prisma.sector.aggregate({
    _count: { id: true },
    _sum: {
      numberPhotos: true,
      numberTopos: true,
      totalFavorites: true,
      ascentCount: true,
    },
    _avg: {
      locatedness: true,
      kudos: true,
    },
  })

  console.log('📊 Estadísticas Generales:')
  console.log(`   Total sectores: ${stats._count.id}`)
  console.log(`   Total fotos: ${stats._sum.numberPhotos ?? 0}`)
  console.log(`   Total topos: ${stats._sum.numberTopos ?? 0}`)
  console.log(`   Total favoritos: ${stats._sum.totalFavorites ?? 0}`)
  console.log(`   Total ascensos: ${stats._sum.ascentCount ?? 0}`)
  console.log(`   Locatedness promedio: ${stats._avg.locatedness?.toFixed(2) ?? 'N/A'}`)
  console.log(`   Kudos promedio: ${stats._avg.kudos?.toFixed(2) ?? 'N/A'}`)

  // Verificar campos específicos
  const sectorsWithNewFields = await prisma.sector.count({
    where: {
      OR: [
        { altNames: { isEmpty: false } },
        { locatedness: { not: null } },
        { numberPhotos: { not: null } },
        { numberTopos: { not: null } },
        { totalFavorites: { not: null } },
        { orientation: { not: null } },
        { rockType: { not: null } },
        { tagsRaw: { not: null } },
      ],
    },
  })

  console.log(`\n✅ Sectores con campos nuevos: ${sectorsWithNewFields} de ${stats._count.id}`)
  console.log(`   Porcentaje: ${((sectorsWithNewFields / stats._count.id) * 100).toFixed(1)}%\n`)
}

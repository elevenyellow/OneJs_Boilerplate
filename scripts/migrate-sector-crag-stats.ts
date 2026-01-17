import { PrismaClientOneJs } from '@OneJs/prisma'
import { SectorStatsMapper } from '@sectors/application/mappers/sector-stats.mapper'
import {
  CragStatsMapper,
  type RouteDataForCragStats,
  type SectorSummary,
} from '@crags/application/mappers/crag-stats.mapper'

/**
 * Migration script to calculate and populate statistics for existing sectors and crags
 *
 * This script:
 * 1. Iterates through all sectors, calculates stats from routes, and updates the sector
 * 2. Iterates through all crags, calculates aggregated stats from routes, and updates the crag
 *
 * NOTE: This script uses Prisma directly because it's a one-time migration.
 * For regular operations, always use repositories.
 */

const prisma = new PrismaClientOneJs()

/**
 * Migrate a single sector's statistics
 */
async function migrateSectorStats(sectorId: string): Promise<number> {
  // Get all routes for this sector
  const routes = await prisma.route.findMany({
    where: { sectorId },
    select: {
      gradeBand: true,
      stars: true,
      qualityScore: true,
      ascents: true,
      ascentCount: true,
      popularity: true,
      height: true,
      pitches: true,
      bolts: true,
      hasTopo: true,
      isSport: true,
      isTrad: true,
      isBoulder: true,
      isAid: true,
      isAlpine: true,
      isMixed: true,
      isIce: true,
      isTopRope: true,
      name: true,
    },
  })

  if (routes.length === 0) {
    return 0
  }

  // Calculate stats using SectorStatsMapper
  const statsFields = SectorStatsMapper.calculateFromRoutes(
    routes.map((r) => ({
      gradeBand: r.gradeBand,
      stars: r.stars,
      qualityScore: r.qualityScore,
      ascents: r.ascents ?? r.ascentCount,
      popularity: r.popularity,
      height: r.height,
      pitches: r.pitches,
      bolts: r.bolts,
      hasTopo: r.hasTopo,
      isSport: r.isSport,
      isTrad: r.isTrad,
      isBoulder: r.isBoulder,
      isAid: r.isAid,
      isAlpine: r.isAlpine,
      isMixed: r.isMixed,
      isIce: r.isIce,
      isTopRope: r.isTopRope,
      name: r.name,
    })),
  )

  // Update sector with calculated stats
  await prisma.sector.update({
    where: { id: sectorId },
    data: {
      minGradeIndex: statsFields.minGradeIndex,
      maxGradeIndex: statsFields.maxGradeIndex,
      modeGradeIndex: statsFields.modeGradeIndex,
      beginnerRoutesCount: statsFields.beginnerRoutesCount,
      intermediateRoutesCount: statsFields.intermediateRoutesCount,
      advancedRoutesCount: statsFields.advancedRoutesCount,
      eliteRoutesCount: statsFields.eliteRoutesCount,
      difficultySpread: statsFields.difficultySpread,
      concentrationScore: statsFields.concentrationScore,
      sportCount: statsFields.sportCount,
      tradCount: statsFields.tradCount,
      boulderCount: statsFields.boulderCount,
      aidCount: statsFields.aidCount,
      alpineCount: statsFields.alpineCount,
      primaryStyle: statsFields.primaryStyle,
      isMultiStyle: statsFields.isMultiStyle,
      classicRoutesCount: statsFields.classicRoutesCount,
      recommendedRoutesCount: statsFields.recommendedRoutesCount,
      highQualityRoutesCount: statsFields.highQualityRoutesCount,
      averageQualityScore: statsFields.averageQualityScore,
      averageStars: statsFields.averageStars,
      qualityRating: statsFields.qualityRating,
      isHighQualitySector: statsFields.isHighQualitySector,
      totalAscents: statsFields.totalAscents,
      popularRoutesCount: statsFields.popularRoutesCount,
      veryPopularRoutesCount: statsFields.veryPopularRoutesCount,
      averageAscentsPerRoute: statsFields.averageAscentsPerRoute,
      popularityScore: statsFields.popularityScore,
      isPopularSector: statsFields.isPopularSector,
      maxHeight: statsFields.maxHeight,
      totalClimbableMeters: statsFields.totalClimbableMeters,
      multiPitchCount: statsFields.multiPitchCount,
      singlePitchCount: statsFields.singlePitchCount,
      averagePitches: statsFields.averagePitches,
      isMultiPitchFocused: statsFields.isMultiPitchFocused,
      hasTallRoutes: statsFields.hasTallRoutes,
      averageBolts: statsFields.averageBolts,
      maxBolts: statsFields.maxBolts,
      routesWithTopoCount: statsFields.routesWithTopoCount,
      isWellDocumented: statsFields.isWellDocumented,
      isWellEquipped: statsFields.isWellEquipped,
      beginnerPercentage: statsFields.beginnerPercentage,
      intermediatePercentage: statsFields.intermediatePercentage,
      advancedPercentage: statsFields.advancedPercentage,
      elitePercentage: statsFields.elitePercentage,
      primaryAudience: statsFields.primaryAudience,
      isBeginnerFriendly: statsFields.isBeginnerFriendly,
      isFamilyFriendly: statsFields.isFamilyFriendly,
      overallScore: statsFields.overallScore,
      sectorRating: statsFields.sectorRating,
    },
  })

  return routes.length
}

/**
 * Migrate a single crag's statistics
 */
async function migrateCragStats(cragId: string): Promise<number> {
  // Get all routes for this crag
  const routes = await prisma.route.findMany({
    where: { cragId },
    select: {
      gradeBand: true,
      stars: true,
      qualityScore: true,
      ascents: true,
      popularity: true,
      height: true,
      pitches: true,
      bolts: true,
      hasTopo: true,
      isSport: true,
      isTrad: true,
      isBoulder: true,
      isAid: true,
      isAlpine: true,
      isMixed: true,
      isIce: true,
      isTopRope: true,
      name: true,
      sectorId: true,
    },
  })

  if (routes.length === 0) {
    return 0
  }

  // Get sector summaries for best sector calculation
  const sectors = await prisma.sector.findMany({
    where: { cragId },
    select: {
      id: true,
      name: true,
      overallScore: true,
    },
  })

  const sectorSummaries: SectorSummary[] = sectors.map((s) => ({
    id: s.id,
    name: s.name,
    overallScore: s.overallScore,
  }))

  // Convert routes to CragStatsMapper format
  const routesData: RouteDataForCragStats[] = routes.map((r) => ({
    gradeBand: r.gradeBand,
    stars: r.stars,
    qualityScore: r.qualityScore,
    ascents: r.ascents,
    popularity: r.popularity,
    height: r.height,
    pitches: r.pitches,
    bolts: r.bolts,
    hasTopo: r.hasTopo,
    isSport: r.isSport,
    isTrad: r.isTrad,
    isBoulder: r.isBoulder,
    isAid: r.isAid,
    isAlpine: r.isAlpine,
    isMixed: r.isMixed,
    isIce: r.isIce,
    isTopRope: r.isTopRope,
    name: r.name,
    sectorId: r.sectorId,
  }))

  // Calculate stats using CragStatsMapper
  const statsFields = CragStatsMapper.calculateFromRoutes(
    routesData,
    sectorSummaries,
  )

  // Update crag with calculated stats
  await prisma.crag.update({
    where: { id: cragId },
    data: {
      minGradeIndex: statsFields.minGradeIndex,
      maxGradeIndex: statsFields.maxGradeIndex,
      modeGradeIndex: statsFields.modeGradeIndex,
      beginnerRoutesCount: statsFields.beginnerRoutesCount,
      intermediateRoutesCount: statsFields.intermediateRoutesCount,
      advancedRoutesCount: statsFields.advancedRoutesCount,
      eliteRoutesCount: statsFields.eliteRoutesCount,
      difficultySpread: statsFields.difficultySpread,
      concentrationScore: statsFields.concentrationScore,
      sportCount: statsFields.sportCount,
      tradCount: statsFields.tradCount,
      boulderCount: statsFields.boulderCount,
      aidCount: statsFields.aidCount,
      alpineCount: statsFields.alpineCount,
      primaryStyle: statsFields.primaryStyle,
      isMultiStyle: statsFields.isMultiStyle,
      classicRoutesCount: statsFields.classicRoutesCount,
      recommendedRoutesCount: statsFields.recommendedRoutesCount,
      highQualityRoutesCount: statsFields.highQualityRoutesCount,
      averageQualityScore: statsFields.averageQualityScore,
      averageStars: statsFields.averageStars,
      qualityRating: statsFields.qualityRating,
      isHighQualitySector: statsFields.isHighQualitySector,
      totalAscents: statsFields.totalAscents,
      popularRoutesCount: statsFields.popularRoutesCount,
      veryPopularRoutesCount: statsFields.veryPopularRoutesCount,
      averageAscentsPerRoute: statsFields.averageAscentsPerRoute,
      popularityScore: statsFields.popularityScore,
      isPopularCrag: statsFields.isPopularCrag,
      maxHeight: statsFields.maxHeight,
      totalClimbableMeters: statsFields.totalClimbableMeters,
      multiPitchCount: statsFields.multiPitchCount,
      singlePitchCount: statsFields.singlePitchCount,
      averagePitches: statsFields.averagePitches,
      isMultiPitchFocused: statsFields.isMultiPitchFocused,
      hasTallRoutes: statsFields.hasTallRoutes,
      averageBolts: statsFields.averageBolts,
      maxBolts: statsFields.maxBolts,
      routesWithTopoCount: statsFields.routesWithTopoCount,
      isWellDocumented: statsFields.isWellDocumented,
      isWellEquipped: statsFields.isWellEquipped,
      beginnerPercentage: statsFields.beginnerPercentage,
      intermediatePercentage: statsFields.intermediatePercentage,
      advancedPercentage: statsFields.advancedPercentage,
      elitePercentage: statsFields.elitePercentage,
      primaryAudience: statsFields.primaryAudience,
      isBeginnerFriendly: statsFields.isBeginnerFriendly,
      isFamilyFriendly: statsFields.isFamilyFriendly,
      sectorCount: statsFields.sectorCount,
      bestSectorId: statsFields.bestSectorId,
      bestSectorName: statsFields.bestSectorName,
      bestSectorScore: statsFields.bestSectorScore,
      overallScore: statsFields.overallScore,
      cragRating: statsFields.cragRating,
    },
  })

  return routes.length
}

/**
 * Migrate all sectors in the database
 */
async function migrateAllSectors(): Promise<void> {
  const sectors = await prisma.sector.findMany({
    select: { id: true, name: true },
  })

  console.log(`\n📊 Migrating stats for ${sectors.length} sectors...\n`)

  let processed = 0
  let totalRoutes = 0
  let skipped = 0

  for (const sector of sectors) {
    try {
      const routeCount = await migrateSectorStats(sector.id)
      if (routeCount > 0) {
        totalRoutes += routeCount
        console.log(`✓ Sector "${sector.name}": ${routeCount} routes processed`)
      } else {
        skipped++
      }
      processed++

      if (processed % 50 === 0) {
        console.log(
          `Progress: ${processed}/${sectors.length} sectors processed`,
        )
      }
    } catch (error) {
      console.error(
        `✗ Error migrating sector ${sector.id} (${sector.name}):`,
        error,
      )
    }
  }

  console.log(
    `\n✅ Sectors migration complete: ${processed - skipped}/${sectors.length} sectors updated (${totalRoutes} total routes)\n`,
  )
  console.log(`   Skipped ${skipped} sectors with no routes\n`)
}

/**
 * Migrate all crags in the database
 */
async function migrateAllCrags(): Promise<void> {
  const crags = await prisma.crag.findMany({
    select: { id: true, name: true },
  })

  console.log(`\n📊 Migrating stats for ${crags.length} crags...\n`)

  let processed = 0
  let totalRoutes = 0
  let skipped = 0

  for (const crag of crags) {
    try {
      const routeCount = await migrateCragStats(crag.id)
      if (routeCount > 0) {
        totalRoutes += routeCount
        console.log(`✓ Crag "${crag.name}": ${routeCount} routes processed`)
      } else {
        skipped++
      }
      processed++

      if (processed % 10 === 0) {
        console.log(`Progress: ${processed}/${crags.length} crags processed`)
      }
    } catch (error) {
      console.error(`✗ Error migrating crag ${crag.id} (${crag.name}):`, error)
    }
  }

  console.log(
    `\n✅ Crags migration complete: ${processed - skipped}/${crags.length} crags updated (${totalRoutes} total routes)\n`,
  )
  console.log(`   Skipped ${skipped} crags with no routes\n`)
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting sector and crag statistics migration...')
  console.log('This will calculate and populate all computed statistics fields')
  console.log('Fields include: grade ranges, style distribution, quality,')
  console.log(
    'popularity, height stats, equipment, audience profile, and scores\n',
  )

  try {
    // Migrate sectors first (so crag can use sector scores)
    await migrateAllSectors()

    // Then migrate crags
    await migrateAllCrags()

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

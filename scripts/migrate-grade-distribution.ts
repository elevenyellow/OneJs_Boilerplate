import { PrismaClientOneJs } from '@OneJs/prisma'
import { calculateGradeIndex } from '@grades/domain/services/grade-index-calculator'

/**
 * Migration script to rebuild gbRoutes and gbAscents for existing crags
 * Uses the new universal grading system instead of TheCrag's GB system
 *
 * NOTE: This script uses Prisma directly because it's a one-time migration.
 * For regular operations, always use repositories.
 *
 * @see docs/features/grades/README.md for grading system documentation
 */

const prisma = new PrismaClientOneJs()

interface RouteForMigration {
  grade: string | null
  gradeStyle: string | null
  ascentCount: number | null
}

/**
 * Get universal grade index from a grade string
 * Uses centralized calculateGradeIndex from @grades package
 */
function getUniversalGradeIndex(grade: string): number | null {
  return calculateGradeIndex(grade)
}

/**
 * Build gbRoutes from routes
 */
function buildGbRoutesFromRoutes(routes: RouteForMigration[]): number[] {
  const gbRoutes = new Array(100).fill(0)

  for (const route of routes) {
    if (!route.grade) continue

    const index = getUniversalGradeIndex(route.grade)

    if (index !== null && index >= 0 && index < 100) {
      gbRoutes[index]++
    }
  }

  return gbRoutes
}

/**
 * Build gbAscents from routes
 */
function buildGbAscentsFromRoutes(routes: RouteForMigration[]): number[] {
  const gbAscents = new Array(100).fill(0)

  for (const route of routes) {
    if (!route.grade) continue

    const index = getUniversalGradeIndex(route.grade)
    const ascents = route.ascentCount || 0

    if (index !== null && index >= 0 && index < 100) {
      gbAscents[index] += ascents
    }
  }

  return gbAscents
}

/**
 * Migrate a single crag
 */
async function migrateCrag(cragId: string): Promise<void> {
  // Get all routes for this crag
  const routes = await prisma.route.findMany({
    where: { cragId },
    select: {
      grade: true,
      gradeStyle: true,
      ascentCount: true,
    },
  })

  // Build new gbRoutes and gbAscents
  const gbRoutes = buildGbRoutesFromRoutes(routes)
  const gbAscents = buildGbAscentsFromRoutes(routes)

  // Update crag
  await prisma.crag.update({
    where: { id: cragId },
    data: {
      gbRoutes,
      gbAscents,
    },
  })

  console.log(`✓ Migrated crag ${cragId}: ${routes.length} routes processed`)
}

/**
 * Migrate a single sector
 */
async function migrateSector(sectorId: string): Promise<void> {
  // Get all routes for this sector
  const routes = await prisma.route.findMany({
    where: { sectorId },
    select: {
      grade: true,
      gradeStyle: true,
      ascentCount: true,
    },
  })

  // Build new gbRoutes and gbAscents
  const gbRoutes = buildGbRoutesFromRoutes(routes)
  const gbAscents = buildGbAscentsFromRoutes(routes)

  // Update sector
  await prisma.sector.update({
    where: { id: sectorId },
    data: {
      gbRoutes,
      gbAscents,
    },
  })

  console.log(
    `✓ Migrated sector ${sectorId}: ${routes.length} routes processed`,
  )
}

/**
 * Migrate all crags in the database
 */
async function migrateAllCrags(): Promise<void> {
  const crags = await prisma.crag.findMany({
    select: { id: true, name: true },
  })

  console.log(`\n📊 Migrating ${crags.length} crags...\n`)

  let processed = 0
  for (const crag of crags) {
    try {
      await migrateCrag(crag.id)
      processed++

      if (processed % 10 === 0) {
        console.log(`Progress: ${processed}/${crags.length} crags processed`)
      }
    } catch (error) {
      console.error(`✗ Error migrating crag ${crag.id} (${crag.name}):`, error)
    }
  }

  console.log(
    `\n✅ Migration complete: ${processed}/${crags.length} crags migrated\n`,
  )
}

/**
 * Migrate all sectors in the database
 */
async function migrateAllSectors(): Promise<void> {
  const sectors = await prisma.sector.findMany({
    select: { id: true, name: true },
  })

  console.log(`\n📊 Migrating ${sectors.length} sectors...\n`)

  let processed = 0
  for (const sector of sectors) {
    try {
      await migrateSector(sector.id)
      processed++

      if (processed % 10 === 0) {
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
    `\n✅ Migration complete: ${processed}/${sectors.length} sectors migrated\n`,
  )
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting grade distribution migration...')
  console.log(
    'This will rebuild gbRoutes and gbAscents using universal grading system',
  )

  try {
    // Migrate sectors first (leaf nodes)
    await migrateAllSectors()

    // Then migrate crags (may aggregate from sectors)
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

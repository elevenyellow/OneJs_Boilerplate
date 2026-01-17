/**
 * Migration Script: Update Route gradeBand to Universal Index
 *
 * This script updates all routes in the database to use the universal grade index
 * instead of TheCrag's gradeBand system (1-5).
 *
 * Before:
 *   gradeBand: 3 (TheCrag's "intermediate" band)
 *
 * After:
 *   gradeBand: 28 (Universal index for 6c French grade)
 *
 * NOTE: This script uses Prisma directly because it's a one-time migration.
 * For regular operations, always use repositories.
 *
 * @see docs/features/grades/README.md for grading system documentation
 *
 * Run with: bun run scripts/migrate-route-grade-bands.ts
 */

import { PrismaClientOneJs } from '@OneJs/prisma'
import { calculateGradeIndex } from '@grades/domain/services/grade-index-calculator'

const prisma = new PrismaClientOneJs()

interface MigrationStats {
  total: number
  updated: number
  skipped: number
  noGrade: number
  alreadyMigrated: number
  errors: number
}

async function migrateRouteGradeBands(): Promise<void> {
  console.log('=== Route GradeBand Migration ===\n')

  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    noGrade: 0,
    alreadyMigrated: 0,
    errors: 0,
  }

  // Get all routes
  const routes = await prisma.route.findMany({
    select: {
      id: true,
      name: true,
      grade: true,
      gradeBand: true,
      gradeStyle: true,
    },
  })

  stats.total = routes.length
  console.log(`Found ${routes.length} routes to process\n`)

  // Process in batches of 100
  const BATCH_SIZE = 100
  const batches = Math.ceil(routes.length / BATCH_SIZE)

  for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE
    const end = Math.min(start + BATCH_SIZE, routes.length)
    const batch = routes.slice(start, end)

    console.log(
      `Processing batch ${batchIndex + 1}/${batches} (routes ${start + 1}-${end})`,
    )

    const updates: Array<{ id: string; newGradeBand: number }> = []

    for (const route of batch) {
      // Skip routes without grade
      if (!route.grade) {
        stats.noGrade++
        continue
      }

      // Check if already migrated (gradeBand >= 10 is universal index range)
      if (route.gradeBand >= 10) {
        stats.alreadyMigrated++
        continue
      }

      try {
        // Use centralized grade index calculation
        const universalIndex = calculateGradeIndex(route.grade)

        if (universalIndex === null) {
          stats.noGrade++
          continue
        }

        updates.push({ id: route.id, newGradeBand: universalIndex })
      } catch (error) {
        stats.errors++
        console.error(
          `  Error processing route ${route.id} (${route.name}): ${error}`,
        )
      }
    }

    // Apply batch updates
    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((update) =>
          prisma.route.update({
            where: { id: update.id },
            data: { gradeBand: update.newGradeBand },
          }),
        ),
      )
      stats.updated += updates.length
    }
  }

  // Print summary
  console.log('\n=== Migration Summary ===')
  console.log(`Total routes: ${stats.total}`)
  console.log(`Updated: ${stats.updated}`)
  console.log(`Already migrated: ${stats.alreadyMigrated}`)
  console.log(`No grade: ${stats.noGrade}`)
  console.log(`Skipped (conversion failed): ${stats.skipped}`)
  console.log(`Errors: ${stats.errors}`)

  await prisma.$disconnect()
}

// Run migration
migrateRouteGradeBands()
  .then(() => {
    console.log('\nMigration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nMigration failed:', error)
    process.exit(1)
  })

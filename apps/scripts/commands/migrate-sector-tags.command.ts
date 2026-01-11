#!/usr/bin/env bun
/**
 * Script to migrate existing sectors to populate processed tag fields
 * from their tagsRaw JSON data.
 *
 * This is needed because sectors scraped before this update only have
 * tagsRaw but not the processed boolean fields (kidFriendly, beginner, etc.)
 *
 * Run with: bun apps/scripts/cli.ts migrate-sector-tags
 */

import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import { SectorTags } from '@sector'

@Injectable()
export class MigrateSectorTagsCommand {
  constructor(
    @Inject(PrismaClientOneJs)
    private readonly prisma: PrismaClientOneJs,
  ) {}

  async execute(): Promise<void> {
    console.log('🏷️  Migrating sector tags...\n')

    // Get all sectors with tagsRaw
    const sectors = await this.prisma.sector.findMany({
      where: {
        tagsRaw: { not: null },
      },
      select: {
        id: true,
        name: true,
        tagsRaw: true,
      },
    })

    console.log(`Found ${sectors.length} sectors with tagsRaw to process\n`)

    let updated = 0
    let withKidFriendly = 0
    let withBeginner = 0
    let errors = 0

    for (const sector of sectors) {
      try {
        // Parse tags using SectorTags value object
        const tags = SectorTags.create(sector.tagsRaw as Record<string, unknown> | string | null)

        // Only update if there's at least one tag detected
        if (tags.hasAnyTags()) {
          await this.prisma.sector.update({
            where: { id: sector.id },
            data: {
              kidFriendly: tags.kidFriendly,
              beginner: tags.beginner,
              dogFriendly: tags.dogFriendly,
              accessible: tags.accessible,
              camping: tags.camping,
              swimming: tags.swimming,
              scenic: tags.scenic,
              popular: tags.popular,
              quiet: tags.quiet,
              multipitch: tags.multipitch,
              trad: tags.trad,
              sport: tags.sport,
              bouldering: tags.bouldering,
            },
          })

          updated++

          if (tags.kidFriendly === true) {
            withKidFriendly++
            console.log(`  ✅ ${sector.name} - Kid Friendly`)
          }
          if (tags.beginner === true) {
            withBeginner++
            console.log(`  ✅ ${sector.name} - Beginner`)
          }
        }
      } catch (error) {
        errors++
        console.error(`  ❌ Error processing sector ${sector.name}:`, error)
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   Total sectors processed: ${sectors.length}`)
    console.log(`   Sectors updated: ${updated}`)
    console.log(`   Kid Friendly sectors: ${withKidFriendly}`)
    console.log(`   Beginner sectors: ${withBeginner}`)
    console.log(`   Errors: ${errors}`)
    console.log('\n✅ Migration complete!')
  }
}

// Export for CLI
export default MigrateSectorTagsCommand

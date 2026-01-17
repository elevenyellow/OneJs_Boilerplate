# Sector and Crag Statistics Migration

This document describes the migration script that calculates and populates comprehensive statistics for existing sectors and crags in the database.

## Overview

The `migrate-sector-crag-stats.ts` script calculates ~40 computed statistics fields for each sector and crag based on their routes. These fields enable efficient filtering and provide rich metadata for the frontend.

## Fields Computed

### Grade Distribution Stats
- `gradeRangeFrench` - Human readable range (e.g., "5a - 7b")
- `gradeRangeYds` - Human readable range in YDS (e.g., "5.7 - 5.12a")
- `minGradeIndex`, `maxGradeIndex`, `modeGradeIndex` - Universal grade indices
- `beginnerRoutesCount`, `intermediateRoutesCount`, `advancedRoutesCount`, `eliteRoutesCount`
- `difficultySpread` - "narrow", "moderate", or "wide"
- `concentrationScore` - How concentrated the grades are

### Style Distribution Stats
- `sportCount`, `tradCount`, `boulderCount`, `aidCount`, `alpineCount`
- `primaryStyle` - Most common style
- `isMultiStyle` - Has multiple prominent styles

### Quality Stats
- `classicRoutesCount`, `recommendedRoutesCount`, `highQualityRoutesCount`
- `averageQualityScore`, `averageStars`, `qualityRating`
- `isHighQualitySector`

### Popularity Stats
- `totalAscents`, `popularRoutesCount`, `veryPopularRoutesCount`
- `averageAscentsPerRoute`, `popularityScore`
- `isPopularSector` / `isPopularCrag`

### Height Stats
- `maxHeight`, `totalClimbableMeters`
- `multiPitchCount`, `singlePitchCount`, `averagePitches`
- `isMultiPitchFocused`, `hasTallRoutes`

### Equipment Stats
- `averageBolts`, `maxBolts`
- `routesWithTopoCount`
- `isWellDocumented`, `isWellEquipped`

### Audience Profile
- `beginnerPercentage`, `intermediatePercentage`, `advancedPercentage`, `elitePercentage`
- `primaryAudience` - "beginner", "intermediate", "advanced", or "elite"
- `isBeginnerFriendly`, `isFamilyFriendly`

### Overall Scores (Sector only)
- `overallScore` - Composite score 0-100
- `sectorRating` - Rating 0-5

### Crag-Specific Fields
- `sectorCount`
- `bestSectorId`, `bestSectorName`, `bestSectorScore`
- `overallScore`, `cragRating`

## Prerequisites

1. Database must be up and running
2. Routes must have `gradeBand` populated (run `migrate-route-grade-bands.ts` first if needed)
3. Prisma client must be generated

## Running the Migration

```bash
# From project root
cd scripts
bun run migrate-sector-crag-stats.ts

# Or using bunx
bunx tsx scripts/migrate-sector-crag-stats.ts
```

## What It Does

1. **Migrates all sectors first**:
   - For each sector, fetches all its routes
   - Calculates comprehensive stats using `SectorStatsMapper`
   - Updates the sector record with all computed fields
   - Sectors without routes are skipped

2. **Then migrates all crags**:
   - For each crag, fetches all its routes
   - Fetches sector summaries (for best sector calculation)
   - Calculates comprehensive stats using `CragStatsMapper`
   - Updates the crag record with all computed fields
   - Crags without routes are skipped

## Progress Output

The script provides detailed progress output:

```
🚀 Starting sector and crag statistics migration...
This will calculate and populate all computed statistics fields
Fields include: grade ranges, style distribution, quality,
popularity, height stats, equipment, audience profile, and scores

📊 Migrating stats for 1234 sectors...

✓ Sector "Sector Name": 25 routes processed
...
Progress: 50/1234 sectors processed
...

✅ Sectors migration complete: 1000/1234 sectors updated (25000 total routes)
   Skipped 234 sectors with no routes

📊 Migrating stats for 50 crags...

✓ Crag "Crag Name": 500 routes processed
...

✅ Crags migration complete: 45/50 crags updated (45000 total routes)
   Skipped 5 crags with no routes

✅ Migration completed successfully!
```

## Runtime Integration

After running this migration, new scrapes will automatically calculate and update stats through the integration in `ScrapeCragUseCase`:

1. After all routes for a sector are saved, stats are calculated and updated
2. After all sectors for a crag are processed, crag stats are calculated and updated

This ensures that:
- New crags get stats immediately upon scraping
- Re-scraping existing crags updates their stats
- No manual migration is needed for newly scraped data

## Troubleshooting

### "Route does not have gradeBand"
Run the route grade bands migration first:
```bash
bun run scripts/migrate-route-grade-bands.ts
```

### Slow performance
The script processes entities one by one to avoid memory issues. For very large databases, you may want to:
- Add batch processing
- Run during off-peak hours
- Monitor database performance

### Partial failures
If some sectors/crags fail, the script continues processing others. Check the error output for specific failures and re-run if needed - the script is idempotent (safe to run multiple times).

## Related Files

- `packages/sectors/application/mappers/sector-stats.mapper.ts` - Sector stats calculation
- `packages/crags/application/mappers/crag-stats.mapper.ts` - Crag stats calculation  
- `packages/sectors/domain/services/sector-stats-calculator.service.ts` - Core calculation logic
- `packages/the-crag/application/use-cases/scrape-crag.use-case.ts` - Runtime integration
- `packages/sectors/infrastructure/persistence/prisma/sector.repository.ts` - Sector persistence
- `packages/crags/infrastructure/persistence/prisma/crag.repository.ts` - Crag persistence

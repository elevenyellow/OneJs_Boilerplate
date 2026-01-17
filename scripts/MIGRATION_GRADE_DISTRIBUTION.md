# Grade Distribution Migration

## Overview

This migration script rebuilds the `gbRoutes` and `gbAscents` arrays for all existing crags and sectors in the database, converting them from TheCrag's Grade Band (GB) system to our universal grading index system.

## Why This Migration is Needed

Previously, the scraper stored TheCrag's `gbRoutes` directly, which uses their internal GB indexing system. Our search and scoring algorithms expect our universal grading system (indices 10-47 based on French grades).

**This mismatch caused:**
- Incorrect grade filtering in search results
- Wrong grade match scores
- User searching for "6a-7a" would get incorrect results

**After migration:**
- Grade filtering works correctly
- Grade match scoring is accurate
- All grade systems (French, YDS, Font, Hueco, etc.) are properly converted

## What This Script Does

1. **For each sector:**
   - Fetches all routes in that sector
   - Reads the `grade` and `gradeStyle` fields
   - Converts each grade to universal index using `GradeConverter`
   - Builds new `gbRoutes` array (counts per index)
   - Builds new `gbAscents` array (ascent sums per index)
   - Updates the sector in the database

2. **For each crag:**
   - Same process as sectors
   - Routes can be directly under the crag or in sectors

## How to Run

### Prerequisites

- Database must be running and accessible
- `DATABASE_URL` environment variable must be set
- All route data must already be in the database

### Run the Migration

```bash
# From the project root
bun run scripts/migrate-grade-distribution.ts
```

### Expected Output

```
🚀 Starting grade distribution migration...
This will rebuild gbRoutes and gbAscents using universal grading system

📊 Migrating 150 sectors...

✓ Migrated sector abc123: 45 routes processed
✓ Migrated sector def456: 32 routes processed
...
Progress: 10/150 sectors processed
...
✅ Migration complete: 150/150 sectors migrated

📊 Migrating 50 crags...

✓ Migrated crag xyz789: 200 routes processed
...
✅ Migration complete: 50/50 crags migrated

✅ Migration completed successfully!
```

## What Gets Changed

### Before Migration

```json
{
  "id": "crag-1",
  "name": "Example Crag",
  "gbRoutes": [5, 10, 20, 30, 15, ...], // TheCrag's GB indices
  "gbAscents": [50, 100, 200, 300, 150, ...] // TheCrag's GB indices
}
```

### After Migration

```json
{
  "id": "crag-1", 
  "name": "Example Crag",
  "gbRoutes": [0, 0, ..., 0, 5, 10, 20, 0, ...], // Universal indices
  //           [index 24] = 5 routes at 6a
  //           [index 30] = 10 routes at 7a
  "gbAscents": [0, 0, ..., 0, 50, 100, 200, 0, ...] // Universal indices
}
```

## Impact

### Immediate Effects

- ✅ Search by grade range works correctly
- ✅ Grade match scoring is accurate
- ✅ All 6 grade systems are properly supported

### No Breaking Changes

- The database schema doesn't change
- The API responses remain the same
- Frontend code doesn't need updates

## Safety

- **Read-only for route data**: Script only reads routes, doesn't modify them
- **Updates only gbRoutes/gbAscents**: Only these two fields are updated
- **Idempotent**: Can be run multiple times safely
- **Error handling**: Logs errors but continues processing other crags

## Testing the Migration

After running the migration, verify results:

### Test Grade Filtering

```bash
# Search for crags with routes between 6a and 7a
curl "http://localhost:3000/api/search/crags?lat=41.7&lng=1.8&radius=50&minGrade=6a&maxGrade=7a&system=french"
```

### Check Database Values

```sql
-- See gbRoutes for a known crag
SELECT 
  id, 
  name, 
  gb_routes,
  number_routes
FROM "Crag" 
WHERE id = 'known-crag-id';

-- Verify sum matches number of routes
SELECT 
  id,
  name,
  number_routes,
  (
    SELECT SUM(unnest) 
    FROM unnest(gb_routes)
  ) as calculated_routes
FROM "Crag"
WHERE id = 'known-crag-id';
```

## Rollback

If you need to rollback (restore TheCrag's original data):

1. **Re-scrape** affected crags using the old scraper code (before this change)
2. **Or** restore from a database backup taken before migration

**⚠️ Note**: There's no automatic rollback because we're replacing TheCrag's data with our calculated data.

## Performance

- **Estimated time**: ~0.5 seconds per crag/sector
- **For 200 crags**: ~100 seconds (~2 minutes)
- **For 1000 crags**: ~500 seconds (~8 minutes)

The script processes crags sequentially to avoid overwhelming the database.

## Troubleshooting

### Migration fails with "Grade not found"

Some routes may have invalid grades. The script skips these automatically.

### Sum of gbRoutes doesn't match numberRoutes

This is expected if:
- Some routes have grade="Project" or grade="?" (these are skipped)
- Some routes have null grades (these are skipped)
- Some routes have invalid grade formats (these are skipped)

### All gbRoutes are zero

Check that:
- Routes exist for that crag/sector
- Routes have non-null `grade` field
- Grade strings are in valid format

## Next Steps After Migration

1. **Verify search results** with known crags
2. **Test grade filtering** with various grade ranges
3. **Monitor scoring accuracy** in production
4. **Re-scrape new crags** (they will automatically use the new system)

## Future Scraping

All future scrapes will automatically use the new system via `GradeDistributionBuilder`, so this migration only needs to run once for existing data.

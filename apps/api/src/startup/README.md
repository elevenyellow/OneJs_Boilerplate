# World Scraper Bootstrap

This bootstrap automatically scrapes all climbing zones from TheCrag when the API server starts.

## Overview

The `WorldScraperBootstrap` replaces the old job queue system (Bull/Redis) with a simpler, more predictable direct scraping approach. It processes all continents and countries sequentially, saving data directly to the database.

## Configuration

Configure the scraper using environment variables in your `.env` file:

### Required Variables

```bash
# TheCrag API cookie (required for API access)
THECRAG_COOKIE='your_cookie_here'
```

### Optional Variables

```bash
# Enable/disable automatic scraping on API startup (default: false)
ENABLE_SCRAPER_BOOTSTRAP=true

# Delay between API requests in milliseconds (default: 100)
THECRAG_DELAY_MS=100

# Filter scraping to a specific continent (optional)
# Examples: 'Europe', 'Asia', 'North America', 'Antarctica'
# Leave empty to scrape all continents
SCRAPER_CONTINENT_FILTER=Europe

# Automatically resume from checkpoint if interrupted (default: false)
SCRAPER_AUTO_RESUME=true
```

## Usage

### Method 1: Automatic on API Startup (Recommended)

1. Set `ENABLE_SCRAPER_BOOTSTRAP=true` in your `.env` file
2. Start the API server:
   ```bash
   bun run start:api:dev
   ```
3. The scraper will start automatically after the server initializes

### Method 2: Manual Script (Deprecated, but still available)

You can still use the standalone script if needed:

```bash
# Scrape all continents
bun run apps/scripts/scrape-world-direct.ts

# Scrape only a specific continent
bun run apps/scripts/scrape-world-direct.ts --continent=Antarctica

# Resume from checkpoint
bun run apps/scripts/scrape-world-direct.ts --resume
```

## How It Works

### Architecture

```
World (7546063)
  └─ Continents (Europe, Asia, Africa, etc.)
      └─ Countries (Spain, France, USA, etc.)
          └─ Regions (Andalusia, Catalonia, etc.)
              └─ Crags (Siurana, El Chorro, etc.)
                  └─ Areas (optional grouping)
                      └─ Sectors
                          └─ Routes
```

### Process Flow

1. **Initialization**: Configure scraper with cookie and delay settings
2. **Continents**: Fetch all continents from World node
3. **Countries**: For each continent, fetch all countries
4. **Regions**: For each country, fetch all regions
5. **Crags**: Recursively process all climbing zones
6. **Areas/Sectors**: Process nested structure
7. **Routes**: Save all route data
8. **Checkpoint**: Save progress after each country for resume capability

### Resume Capability

The scraper automatically saves checkpoints after processing each country:

- Checkpoint file: `.scraper-checkpoint.json` (in project root)
- Contains: Last processed country, completed country IDs, timestamp
- Enable with: `SCRAPER_AUTO_RESUME=true`
- Manual resume: Use `--resume` flag with the script

On successful completion, the checkpoint file is automatically deleted.

## Statistics & Monitoring

The scraper logs detailed progress information:

```
[1/10] 🌍 Europe (ID: 11737771)
💾 Continent saved: Europe
📍 Found 47 countries in Europe

[1/47] 🏳️  Spain (ID: 11747395)
   💾 Country saved: Spain
   📍 Found 17 regions
   ✅ Spain completed in 15m 23s
   📊 Country: 17R 1234C 567A 890S 12345Rt
   📊 Total: 1Co 17R 1234C 567A 890S 12345Rt

...

🎉 WORLD SCRAPING COMPLETED
Continents: 10
Countries: 195
Regions: 2345
Crags: 23456
Areas: 12345
Sectors: 34567
Routes: 456789
Errors: 3
Total Duration: 8h 45m 32s
```

## Error Handling

- **Country-level errors**: Logged and skipped, continues to next country
- **Region-level errors**: Logged, continues with other regions
- **Fatal errors**: Stops execution, checkpoint saved for resume
- All errors are logged with full context for debugging

## Performance

- **Sequential processing**: One country at a time to avoid overwhelming TheCrag API
- **Configurable delays**: Control request rate with `THECRAG_DELAY_MS`
- **Resume support**: Can be interrupted and resumed without losing progress
- **Memory efficient**: Processes data incrementally, doesn't load everything in memory

## Comparison: Bootstrap vs Job Queue

### Old System (Job Queue)
- ❌ Complex: Required Redis, BullMQ, job workers
- ❌ Distributed: Hard to debug and monitor
- ❌ Resource heavy: Redis memory overhead
- ❌ Opaque: Jobs processed in background, hard to see progress

### New System (Bootstrap)
- ✅ Simple: Direct execution, no external dependencies
- ✅ Predictable: Clear sequential flow
- ✅ Lightweight: No Redis or job queue overhead
- ✅ Transparent: Real-time console output with progress
- ✅ Debuggable: Easy to trace and fix issues
- ✅ Resumable: Built-in checkpoint system

## Troubleshooting

### Scraper doesn't start

1. Check `ENABLE_SCRAPER_BOOTSTRAP=true` in `.env`
2. Verify `THECRAG_COOKIE` is set and valid
3. Check API logs for bootstrap messages

### Cookie expired

Error: `⚠️ No continents found. Cookie may be expired.`

Solution: Get a new cookie from TheCrag:
1. Log in to thecrag.com
2. Open browser DevTools → Network tab
3. Refresh page
4. Find any request, copy Cookie header
5. Update `THECRAG_COOKIE` in `.env`

### Scraper interrupted

The scraper saves checkpoints automatically. To resume:

1. Set `SCRAPER_AUTO_RESUME=true`
2. Restart the API

Or use the manual script:
```bash
bun run apps/scripts/scrape-world-direct.ts --resume
```

### Rate limiting

If you encounter rate limiting from TheCrag:

1. Increase delay: `THECRAG_DELAY_MS=500` (or higher)
2. Filter to fewer continents: `SCRAPER_CONTINENT_FILTER=Antarctica`

## Development

### File Structure

```
apps/api/
  src/startup/
    world-scraper.bootstrap.ts  # Main bootstrap class
  index.ts                       # Imports bootstrap for registration

apps/scripts/
  scrape-world-direct.ts        # Standalone script (legacy)
```

### Extending the Bootstrap

To customize scraping behavior, edit `world-scraper.bootstrap.ts`:

- Modify `IGNORED_CONTINENTS` to skip continents
- Adjust logging levels in helper methods
- Add custom validation or filtering logic
- Implement retry mechanisms

## Migration Notes

This system replaces:
- ❌ `ScrapeCountryJob` (deleted)
- ❌ `ScraperQueueService` (deleted)
- ❌ All enqueue scripts (deleted)
- ❌ `JobsPlugin` (removed from API)
- ❌ Bull/Redis dependencies (removed)

No migration needed - the new system works independently.

# Scraper Job Stalling - Fix Guide

## Problem
The `scrape-country` job was stalling because:
1. **Lock timeout too short**: Default 30s lock duration was too short for long-running scraping operations
2. **No progress updates**: Job wasn't updating progress frequently enough to keep the lock alive
3. **Duplicate jobs**: Multiple jobs for the same country with different IDs were being queued
4. **Stale jobs**: Old jobs with invalid country IDs were stuck in the queue

## Changes Made

### 1. Worker Configuration (`.oneJs/jobs/src/application/worker.service.ts`)
- **Lock duration**: Increased to 30 minutes (1,800,000ms)
- **Lock renew time**: Set to 5 minutes (300,000ms) - automatically renews the lock
- **Stalled interval**: Check for stalled jobs every 10 minutes (600,000ms)
- **Max stalled count**: Allow 2 stalls before failing the job

### 2. Job Progress Updates (`packages/scraper-thecrag/infrastructure/jobs/scrape-country.job.ts`)
- Added `PROGRESS_INTERVAL_MS = 30000` (30 seconds)
- Modified `logProgress()` to call `job.updateProgress()` every 30 seconds
- This keeps the job lock alive during long recursive operations
- Made `currentJob` an instance variable instead of module-level

### 3. Job Deduplication (`packages/scraper-thecrag/application/services/scraper-queue.service.ts`)
- Changed `enqueueCountries()` to use `addUniqueByData()` instead of `add()`
- This prevents duplicate jobs for the same country from being queued
- Added `clearQueue()` method to remove stale jobs

### 4. Queue Management (`.oneJs/jobs/src/application/queue.service.ts`)
- Added `drainQueue()` - removes waiting/delayed jobs
- Added `obliterateQueue()` - completely clears a queue (use with caution!)

### 5. Helper Scripts
- `scripts/clear-scrape-queue.ts` - Clear all jobs from the scrape queue
- `scripts/enqueue-countries.ts` - Enqueue country scraping jobs

## How to Fix Your Current Issue

### Step 1: Stop the worker
```bash
# Press Ctrl+C to stop your running worker
```

### Step 2: Clear stale jobs
```bash
bun run scripts/clear-scrape-queue.ts
```

### Step 3: Restart your application
The worker will automatically start with the new configuration.

### Step 4: Enqueue countries again
```bash
bun run scripts/enqueue-countries.ts
```

## Monitoring

The job now logs progress every 10 seconds:
```
⏱️ Progress [2.5min] | Current: Chulilla: 5C 12A 45S 234R 0E
```

And updates the job progress in Redis every 30 seconds to keep the lock alive.

## Configuration Summary

| Setting | Old Value | New Value | Reason |
|---------|-----------|-----------|--------|
| Lock Duration | 30s (default) | 30 min | Long-running scraping operations |
| Lock Renew Time | 15s (default) | 5 min | Automatic lock renewal |
| Stalled Interval | 30s (default) | 10 min | Less aggressive stall checking |
| Max Stalled Count | 1 (default) | 2 | Allow recovery from temporary issues |
| Progress Updates | Manual only | Every 30s | Keep lock alive |

## Troubleshooting

### Job still stalling?
1. Check if the worker restarted with new settings
2. Verify progress updates are happening (check logs for "⏱️ Progress")
3. Increase `PROGRESS_INTERVAL_MS` to 15s if scraping is very slow

### Jobs not being processed?
1. Check queue metrics: `bun run scripts/clear-scrape-queue.ts`
2. Check Redis is running: `docker-compose ps`
3. Check worker logs for errors

### Duplicate jobs?
1. Clear the queue: `bun run scripts/clear-scrape-queue.ts`
2. Re-enqueue: `bun run scripts/enqueue-countries.ts`
3. Jobs are now deduplicated by country ID

## Notes

- The scraping job is **incremental** - progress is saved to the database as it goes
- If a job fails mid-way, already scraped data is preserved
- The job processes one country at a time (concurrency: 1)
- In dev mode, only Spain is scraped

# TheCrag Scraper Methods Comparison

## Two Different Scraping Approaches

### 1. Simple Approach: `scrapeArea()` + `scrapeSectorWithRoutes()`

```typescript
const area = await apiScraper.scrapeArea(areaId)
const sector = await apiScraper.scrapeSectorWithRoutes(areaId)
```

**What it does:**
- Scrapes **ONLY** the specified area/sector
- Does NOT recurse into child areas
- Returns data for a single sector only

**Requests made:**
- 1 API request (area metadata)
- 1 HTML request (topos and routes)
- **Total: 2 requests**

**Data returned:**

**`scrapeArea()`:**
- ✅ Area metadata (name, slug, URL)
- ✅ Area beta (description, approach, access)
- ✅ Statistics, seasonality, tags
- ✅ Web cover image
- ✅ Topo images with SVG annotations
- ✅ Child IDs (but not their data)
- ❌ Routes data (needs to be parsed separately)

**`scrapeSectorWithRoutes()`:**
- ✅ All data from `scrapeArea()`
- ✅ Parsed routes from HTML
- ✅ Routes enriched with topo annotations
- ✅ Routes linked to their topo images
- ❌ Only THIS sector's routes (not children)

**Example for Cheste:**
```
Area: Cheste
Routes: 41 routes (only direct routes in Cheste)
Children: 44 child sectors (IDs only, NO DATA)
```

### 2. Complete Approach: `scrapeAreaComplete()`

```typescript
const complete = await apiScraper.scrapeAreaComplete(areaId, {
  skipEmptyAreas: false,
  maxRoutesPerSector: undefined
})
```

**What it does:**
- Scrapes the root area AND all child areas recursively
- Returns a complete hierarchy with ALL sectors and routes

**Requests made (for Cheste with 44 children):**
- 1 API + 1 HTML for root (Cheste)
- 1 API + 1 HTML for each of 44 children
- **Total: 45 API + 45 HTML = 90 requests**

**Data returned:**

**`ScrapedAreaComplete`:**
- ✅ Root area metadata
- ✅ ALL sectors (root + all children) as `ScrapedSector[]`
- ✅ ALL routes from ALL sectors
- ✅ Each sector has complete data:
  - Routes with HTML enrichment
  - Topo images
  - Route-to-topo linkage
- ✅ Root sector IDs (direct children of root)

**Example for Cheste:**
```
Area: Cheste
All Sectors: 45 sectors (Cheste + 44 children)
All Routes: ~900 routes (41 in Cheste + routes from all 44 children)
Complete hierarchy with all data
```

## Comparison Table

| Feature | Simple Approach | Complete Approach |
|---------|----------------|-------------------|
| **Methods** | `scrapeArea()` + `scrapeSectorWithRoutes()` | `scrapeAreaComplete()` |
| **Scope** | Single sector only | Root + all children recursively |
| **Requests** | 2 requests (1 API + 1 HTML) | N requests (1 API + 1 HTML per sector) |
| **Routes** | Only direct routes in specified sector | ALL routes from ALL sectors |
| **Child data** | Child IDs only (no data) | Complete data for all children |
| **Use case** | Quick sector scrape | Full crag scraping |
| **Time** | Fast (~2-3 seconds) | Slow (~90 seconds for Cheste) |
| **Completeness** | ❌ Incomplete (missing child sectors) | ✅ Complete (all sectors and routes) |

## When to Use Each Approach

### Use Simple Approach (`scrapeArea` + `scrapeSectorWithRoutes`) when:

1. **You only need ONE sector** (not the whole crag)
   ```typescript
   // Scrape only "La última" sector, not all of Cheste
   const sector = await apiScraper.scrapeSectorWithRoutes(NodeId.create(1447651746))
   ```

2. **You want to test/debug** a specific sector quickly
   ```typescript
   // Quick test of a single sector
   const area = await apiScraper.scrapeArea(testSectorId)
   console.log(area.getTopoImages().length) // Check topos
   ```

3. **You're building a UI** that loads sectors on-demand
   ```typescript
   // Load sector data when user clicks on it
   async function loadSectorDetails(sectorId: string) {
     return await apiScraper.scrapeSectorWithRoutes(NodeId.create(sectorId))
   }
   ```

### Use Complete Approach (`scrapeAreaComplete`) when:

1. **You want ALL sectors and routes** from a crag
   ```typescript
   // Get complete Cheste data (all 45 sectors, all ~900 routes)
   const complete = await apiScraper.scrapeAreaComplete(NodeId.create(1447606131))
   ```

2. **You're building a database** of all routes
   ```typescript
   // Import complete crag into database
   const complete = await apiScraper.scrapeAreaComplete(cragId)
   for (const sector of complete.getAllSectors()) {
     await database.saveSector(sector)
   }
   ```

3. **You need the complete hierarchy** for navigation
   ```typescript
   // Build navigation tree
   const complete = await apiScraper.scrapeAreaComplete(cragId)
   const rootSectors = complete.getRootSectorIds()
   // Display sectors in UI
   ```

## Current Issue in `scrape-crag.command.ts`

**Lines 73-76:**
```typescript
const area = await apiScraper.scrapeArea(areaId)
const sectors = await apiScraper.scrapeSectorWithRoutes(areaId)

console.log(area, sectors)
```

**Problem:**
- This only gets data for **ONE sector** (the root Cheste)
- It does NOT get data for the 44 child sectors
- `area.getChildIds()` returns child IDs, but NO data about them

**What you probably want:**
```typescript
// Get COMPLETE data for Cheste + all children
const complete = await apiScraper.scrapeAreaComplete(areaId, {
  skipEmptyAreas: false,
  maxRoutesPerSector: undefined
})

console.log({
  rootName: complete.getRootName(),
  totalSectors: complete.getAllSectors().length,
  totalRoutes: complete.getAllSectors().reduce((sum, s) => sum + s.getRouteCount(), 0),
  rootSectorIds: complete.getRootSectorIds(),
})
```

## Recommendations

### For Production Scraping:
Use `scrapeAreaComplete()` to get complete data:

```typescript
const complete = await apiScraper.scrapeAreaComplete(
  NodeId.create(1447606131), // Cheste
  {
    skipEmptyAreas: true,  // Skip sectors with 0 routes
    maxRoutesPerSector: undefined // No limit
  }
)
```

### For Testing/Development:
Use simple approach to quickly test a single sector:

```typescript
// Test one sector quickly
const sector = await apiScraper.scrapeSectorWithRoutes(
  NodeId.create(1447651746) // La última
)
console.log(`${sector.getName()}: ${sector.getRouteCount()} routes`)
```

### For Building a Crag Database:
```typescript
// 1. Scrape complete crag
const complete = await apiScraper.scrapeAreaComplete(cragId)

// 2. Save root area
await database.saveCrag({
  id: complete.getId(),
  name: complete.getRootName(),
  url: complete.getRootUrl(),
})

// 3. Save all sectors
for (const sector of complete.getAllSectors()) {
  await database.saveSector({
    id: sector.getId(),
    name: sector.getName(),
    routes: sector.getRoutes(),
    topos: sector.getTopos(),
  })
}
```

## Summary

**The data IS complete** if you use the right method:

- ❌ `scrapeArea()` + `scrapeSectorWithRoutes()` → Incomplete (only 1 sector)
- ✅ `scrapeAreaComplete()` → Complete (all sectors recursively)

The choice depends on your use case:
- Need quick single sector → Simple approach
- Need complete crag data → Complete approach

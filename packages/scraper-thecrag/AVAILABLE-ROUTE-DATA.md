# Available Route Data from TheCrag API

This document summarizes what route data is available **without making individual HTTP requests per route**.

## Investigation Summary

We investigated whether the `/children/route` endpoint could provide additional route data (meters, bolts, description, equipper, etc.) without requiring individual requests per route.

### Finding: API Requires Authentication

**Result**: The `/children/route` endpoint **requires authentication** (`anonweb` level minimum) and is **not accessible** without credentials.

```bash
# All these requests return authentication error:
/api/node/id/{nodeId}/children/route?expires=10
/api/node/id/{nodeId}/children/route?flatten=data&expires=10
/api/node/id/{nodeId}/children/route?flatten=data[id,name,grade]&expires=10
```

**Error message**:
```json
{
  "error": "You have insufficient access for the api endpoint '/api/(node|region|area|crag|route|climb|annotation)/id/\\d+/children/(area|route)', minimum level anonweb"
}
```

This means we **cannot** use this endpoint to get bulk route data without authentication.

---

## ✅ Available Route Data (from SVG Annotations)

The following data **IS available** from the sector's topo image SVG annotations, without individual route requests:

| Field | Type | Source | Example |
|-------|------|--------|---------|
| **ID** | `number` | SVG `id` | `787145850` |
| **Name** | `string` | SVG `name` | `"Usain Parabolt"` |
| **Grade** | `RouteGrade` | SVG `grade` + `class` | `"6c"` (French) |
| **Stars** | `string` | SVG `stars` | `"3.5"`, `"4"` |
| **Style** | `string` | SVG `style` | `"sport"`, `"trad"`, `"boulder"` |
| **URL** | `string` | SVG `url` | `"/en/climbing/spain/castellon/route/787145850"` |
| **SVG Path** | `TopoPath` | SVG `points` | `"M 393.5 248.5 L 396.9 232.2 ..."` |
| **Order** | `number` | SVG `order` | Visual ordering |
| **Z-Index** | `string` | SVG `zindex` | Layer ordering |

### Data Structure in Code

```typescript
// TopoAnnotation interface (from SVG)
interface RawTopoAnnotation {
  id: number           // ✅ Route ID
  type: 'route'        // ✅ Type
  num: string          // ✅ Route number
  name: string         // ✅ Route name
  grade: string        // ✅ Grade value
  class: string        // ✅ Grade system (e.g., 'french')
  stars: string        // ✅ Quality rating
  style: string        // ✅ Climbing style
  url: string          // ✅ Route URL
  points: string       // ✅ SVG path coordinates
  order: number        // ✅ Visual order
  zindex: string       // ✅ Layer order
}
```

---

## ❌ NOT Available (requires individual route requests)

The following data **requires making an individual API/HTML request per route**:

| Field | Why Not Available |
|-------|-------------------|
| **Meters/Height** | Not in SVG annotations |
| **Number of bolts** | Not in SVG annotations |
| **Description** | Not in SVG annotations |
| **Equipper/Setter** | Not in SVG annotations |
| **FA Date** | Not in SVG annotations |
| **Number of pitches** | Not in SVG annotations |
| **Protection details** | Not in SVG annotations |
| **Rock type** | Not in SVG annotations |
| **Ascent count** | Not in SVG annotations |
| **Comments** | Not in SVG annotations |

### Why These Require Individual Requests

1. **SVG annotations** only contain visual/display data (path, grade, name, stars)
2. **`/children/route` endpoint** requires authentication and is not accessible
3. **Individual route pages** (`/api/node/id/{routeId}` + HTML) contain full details

---

## Current Implementation: Optimized for SVG-Only

The current scraper implementation (`ScrapedRoute.fromTopoAnnotation()`) creates routes from SVG data only:

```typescript
static fromTopoAnnotation(
  annotation: TopoAnnotation,
  parentAreaId: NodeId | null,
): ScrapedRoute {
  // Available from SVG:
  const routeId = NodeId.create(annotation.getId())
  const name = annotation.getName()
  const grade = annotation.getGrade()
  const stars = annotation.getStars()
  const style = annotation.getStyle()
  const url = annotation.getUrl()
  
  // NOT available from SVG (set to null):
  // - bolts
  // - heightInMeters
  // - pitches
  // - protection
  // - history (FA, equipper, date)
  // - beta (description, approach)
  
  return new ScrapedRoute(...)
}
```

### Performance Impact

**Before optimization** (with individual route requests):
- Altura (782524281): ~188 requests, ~70 seconds

**After optimization** (SVG-only):
- Altura (782524281): 30 requests, 52 seconds
- **Reduction**: 84% fewer requests, 26% faster

---

## Recommendations

### Option 1: Keep SVG-Only (Current Implementation) ✅

**Pros:**
- Fast scraping (minimal requests)
- No authentication required
- Sufficient data for most use cases (name, grade, stars, style, visual path)

**Cons:**
- Missing detailed info (meters, bolts, description, equipper)

**Best for**: Initial data collection, route discovery, topo visualization

---

### Option 2: Hybrid Approach (Configurable)

Add an optional flag to scrape detailed route data when needed:

```typescript
async scrapeSectorWithRoutes(
  sectorId: NodeId,
  options?: {
    includeDetailedRouteInfo?: boolean  // NEW: Optional detailed scraping
    maxRoutes?: number
  }
): Promise<ScrapedSector>
```

**Pros:**
- Flexibility: fast scraping by default, detailed when needed
- User can choose based on use case

**Cons:**
- More complex implementation
- Slower when detailed info is requested

**Best for**: Applications that need both speed (discovery) and detail (route pages)

---

### Option 3: Two-Phase Scraping

1. **Phase 1**: Scrape all sectors/routes with SVG data (fast)
2. **Phase 2**: Enrich specific routes with detailed data (on-demand)

```typescript
// Phase 1: Fast discovery
const sectors = await scraper.scrapeAreaComplete(areaId)

// Phase 2: Enrich specific routes
for (const route of importantRoutes) {
  const detailedRoute = await scraper.scrapeRoute(route.getId())
  // Update with detailed info
}
```

**Pros:**
- Best of both worlds
- Efficient use of requests
- Can prioritize which routes to enrich

**Cons:**
- Requires two-step process
- More complex application logic

**Best for**: Large-scale scraping with selective detail enrichment

---

## Conclusion

**Current Status**: The scraper is optimized to use **SVG-only data**, which provides:
- ✅ Route ID, name, grade, stars, style, URL, SVG path
- ❌ No meters, bolts, description, equipper, FA date

**Reason**: The `/children/route` API endpoint requires authentication and cannot provide bulk route data.

**Next Steps**: If detailed route data is needed, implement **Option 2 (Hybrid)** or **Option 3 (Two-Phase)** based on application requirements.

---

## Related Files

- `packages/scraper-thecrag/domain/entities/scraped-route.entity.ts` - Route entity with `fromTopoAnnotation()` method
- `packages/scraper-thecrag/domain/value-objects/topo-annotation.vo.ts` - SVG annotation parsing
- `packages/scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper.ts` - Main scraper implementation
- `packages/scraper-thecrag/OPTIMIZATION-SVG-ONLY.md` - Performance optimization details

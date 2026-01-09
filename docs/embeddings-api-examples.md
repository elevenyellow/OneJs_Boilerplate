# Example API Requests for Embeddings Search

## Real-World Search Examples

### 1. Weekend Warrior - Find Zones Near Valencia

**Scenario**: User lives in Valencia and wants to find climbing zones within 100km

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.4699, "lon": -0.3763 },
    "maxDistance": 100,
    "minRoutes": 10,
    "hasTopos": true,
    "limit": 20
  }'
```

### 2. Beginner Climber - Easy Routes for Learning

**Scenario**: New climber looking for beginner-friendly zones

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "beginner friendly easy routes good for learning with lots of bolts",
    "gradeRange": { "min": "4", "max": "6a" },
    "minRoutes": 30,
    "routeTypes": ["sport"],
    "hasTopos": true,
    "minQuality": 0.7,
    "limit": 10
  }'
```

### 3. Summer Climber - Shaded North-Facing Zones

**Scenario**: Looking for shaded zones good for summer climbing

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "shaded north facing good for summer hot weather",
    "month": 7,
    "orientations": ["N", "NE", "NW"],
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "maxDistance": 150,
    "minRoutes": 20,
    "limit": 15
  }'
```

### 4. Advanced Climber - Hard Sport Routes

**Scenario**: Experienced climber looking for challenging routes

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "hard sport climbing steep overhang technical routes",
    "gradeRange": { "min": "7b", "max": "8b" },
    "routeTypes": ["sport"],
    "climbingStyles": ["overhang", "roof"],
    "minQuality": 0.8,
    "minPopularity": 0.6,
    "limit": 10
  }'
```

### 5. Multi-Pitch Enthusiast

**Scenario**: Looking for quality multi-pitch routes

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "multi-pitch climbing long routes alpine style beautiful views",
    "routeTypes": ["multipitch"],
    "gradeRange": { "min": "6a", "max": "7a" },
    "minQuality": 0.7,
    "hasTopos": true,
    "limit": 10
  }'
```

### 6. Limestone Lover

**Scenario**: Prefers climbing on limestone

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "limestone sport climbing with pockets and tufas",
    "rockTypes": ["limestone"],
    "gradeRange": { "min": "6b", "max": "7b" },
    "orientations": ["N", "NE", "E"],
    "minRoutes": 50,
    "limit": 15
  }'
```

### 7. October Trip Planning

**Scenario**: Planning a climbing trip for October

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "popular climbing destination good in autumn",
    "month": 10,
    "gradeRange": { "min": "6a", "max": "7a" },
    "minRoutes": 100,
    "minPopularity": 0.7,
    "hasPhotos": true,
    "hasTopos": true,
    "limit": 20
  }'
```

### 8. Slab Climbing Specialist

**Scenario**: Looking for vertical slab routes

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "slab climbing vertical face technical footwork balance",
    "climbingStyles": ["slab", "vertical"],
    "gradeRange": { "min": "6a", "max": "7a" },
    "routeTypes": ["sport"],
    "minRoutes": 20,
    "limit": 10
  }'
```

### 9. Quick Access Zones

**Scenario**: Looking for zones with easy/short approach

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "short approach quick access easy to reach parking nearby",
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "maxDistance": 50,
    "minRoutes": 20,
    "limit": 15
  }'
```

### 10. Multilingual Search (Spanish)

**Scenario**: Spanish-speaking user searching in their language

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "escalada deportiva en pared vertical con buenos agarres para nivel intermedio",
    "gradeRange": { "min": "6a", "max": "6c" },
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "maxDistance": 100,
    "routeTypes": ["sport"],
    "limit": 15
  }'
```

### 11. Winter Climbing

**Scenario**: Looking for sunny zones good for winter

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sunny south facing good for winter warm sheltered",
    "month": 1,
    "orientations": ["S", "SE", "SW"],
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "maxDistance": 200,
    "minRoutes": 30,
    "limit": 15
  }'
```

### 12. Free to Access (No Permit)

**Scenario**: Only wants zones that don't require permits

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sport climbing accessible no restrictions",
    "requiresPermit": false,
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "maxDistance": 100,
    "minRoutes": 20,
    "limit": 15
  }'
```

---

## GET Request Examples (URL Parameters)

### Simple Text Search

```bash
curl "http://localhost:3000/api/search/zones?q=sport+climbing&limit=10"
```

### With Location and Distance

```bash
curl "http://localhost:3000/api/search/zones?\
q=limestone+sport+climbing\
&lat=39.5\
&lon=-0.5\
&maxDistance=100\
&limit=20"
```

### With All Filters

```bash
curl "http://localhost:3000/api/search/zones?\
q=sport+climbing+good+holds\
&lat=39.5\
&lon=-0.5\
&maxDistance=100\
&minGrade=6a\
&maxGrade=7a\
&month=10\
&minRoutes=20\
&orientations=N,NE\
&rockTypes=limestone\
&hasTopos=true\
&limit=20"
```

---

## Admin/Indexing Examples

### Index Single Zone

```bash
curl -X POST http://localhost:3000/api/admin/index-zone/cm7abc123
```

### Index All Zones

```bash
curl -X POST http://localhost:3000/api/admin/index-all-zones \
  -H "Content-Type: application/json" \
  -d '{
    "batchSize": 10,
    "skipExisting": false
  }'
```

### Re-index with Skip Existing

```bash
curl -X POST http://localhost:3000/api/admin/index-all-zones \
  -H "Content-Type: application/json" \
  -d '{
    "batchSize": 5,
    "skipExisting": true
  }'
```

---

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
const searchResults = await fetch('http://localhost:3000/api/search/zones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'sport climbing on limestone',
    userLocation: { lat: 39.5, lon: -0.5 },
    maxDistance: 100,
    gradeRange: { min: '6a', max: '7a' },
    month: 10,
    limit: 20,
  }),
})

const data = await searchResults.json()
console.log(data.data.results)
```

### Using Axios

```typescript
import axios from 'axios'

const response = await axios.post('http://localhost:3000/api/search/zones', {
  query: 'beginner friendly sport climbing',
  gradeRange: { min: '4', max: '6a' },
  minRoutes: 20,
  hasTopos: true,
  limit: 10,
})

console.log(response.data.data.results)
```

---

## Response Format Examples

### Successful Search Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "zoneId": "cm7abc123",
        "zoneName": "Chulilla",
        "zoneType": "crag",
        "similarity": 0.89,
        "finalScore": 0.85,
        "distance": 45.3,
        "metadata": {
          "location": {
            "lat": 39.6667,
            "lon": -0.9000
          },
          "routeCount": 350,
          "gradeRange": "5a - 8b",
          "bestMonths": [10, 11, 3, 4],
          "orientations": ["N", "NE", "E"],
          "rockTypes": ["limestone"],
          "popularity": 0.92,
          "quality": 0.88,
          "hasTopos": true,
          "hasPhotos": true
        },
        "preview": "Climbing zone Chulilla. Description: World-class limestone sport climbing..."
      }
    ],
    "total": 15,
    "query": "sport climbing on limestone"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "OPENAI_API_KEY is required",
    "code": "MISSING_API_KEY"
  }
}
```

---

## Testing Tips

1. **Start Simple**: Begin with basic queries, then add filters
2. **Test Edge Cases**: Empty results, invalid coordinates, etc.
3. **Compare Results**: Same query with/without filters
4. **Multilingual**: Test in different languages
5. **Performance**: Measure response times
6. **Relevance**: Verify results make sense for query

---

## Rate Limiting Recommendations

For production, implement rate limiting:

```typescript
// Example with express-rate-limit
import rateLimit from 'express-rate-limit'

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many search requests, please try again later.',
})

app.post('/api/search/zones', searchLimiter, searchController.search)
```

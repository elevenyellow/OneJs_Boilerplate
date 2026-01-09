# Embeddings System Implementation

## Overview

Complete semantic search system for climbing zones using OpenAI embeddings and PostgreSQL with pgvector.

## Architecture

### Components

1. **Domain Layer**
   - `ZoneEmbeddingEntity`: Core entity representing a zone's embedding
   - `EmbeddingVector`: Value object for vector operations
   - `ZoneMetadata`: Structured data for hybrid filtering

2. **Application Layer**
   - `TextGeneratorService`: Generates rich text representations
   - `MetadataExtractorService`: Extracts structured metadata
   - `IndexZoneUseCase`: Indexes a single zone
   - `IndexAllZonesUseCase`: Batch indexing
   - `SearchZonesUseCase`: Semantic search with hybrid filtering

3. **Infrastructure Layer**
   - `OpenAIEmbeddingService`: OpenAI API integration
   - `EmbeddingPrismaRepository`: PostgreSQL + pgvector storage
   - `SearchController`: REST API endpoints

## Database Schema

```sql
CREATE TABLE zone_embeddings (
  id                   TEXT PRIMARY KEY,
  zone_id              TEXT UNIQUE NOT NULL,
  zone_type            TEXT NOT NULL,
  embedding            vector(768),  -- pgvector extension
  text_representation  TEXT NOT NULL,
  
  -- Geolocation
  latitude             FLOAT NOT NULL,
  longitude            FLOAT NOT NULL,
  locatedness          INTEGER,
  
  -- Grades
  min_grade_index      INTEGER,
  max_grade_index      INTEGER,
  avg_grade_index      FLOAT,
  grade_distribution   JSONB,
  
  -- Routes & seasonality
  route_count          INTEGER DEFAULT 0,
  seasonality_scores   JSONB,
  best_months          INTEGER[],
  
  -- Characteristics
  orientations         TEXT[],
  rock_types           TEXT[],
  climbing_styles      TEXT[],
  sun_exposure         TEXT,
  sheltered            BOOLEAN,
  
  -- Quality metrics
  popularity           FLOAT,
  quality              FLOAT,
  
  -- Facilities
  has_topos            BOOLEAN DEFAULT false,
  has_photos           BOOLEAN DEFAULT false,
  requires_permit      BOOLEAN DEFAULT false,
  
  -- Route types
  has_sport            BOOLEAN DEFAULT false,
  has_trad             BOOLEAN DEFAULT false,
  has_boulder          BOOLEAN DEFAULT false,
  has_multi_pitch      BOOLEAN DEFAULT false,
  
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

-- Vector similarity index (HNSW for speed)
CREATE INDEX zone_embedding_hnsw_idx 
ON zone_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Additional indexes for filtering
CREATE INDEX idx_zone_location ON zone_embeddings (latitude, longitude);
CREATE INDEX idx_zone_grades ON zone_embeddings (min_grade_index, max_grade_index);
CREATE INDEX idx_zone_routes ON zone_embeddings (route_count);
CREATE INDEX idx_zone_quality ON zone_embeddings (popularity, quality);
```

## Search Flow

1. **Query Enrichment**: User query + filters → enriched text query
2. **Embedding Generation**: Text → 768-dimensional vector (OpenAI)
3. **Vector Search**: Cosine similarity search with filters (pgvector)
4. **Re-ranking**: Multi-factor scoring algorithm
5. **Results**: Top N zones sorted by final score

## Scoring Algorithm

```typescript
finalScore = 
  semanticSimilarity * 0.40 +   // How well text matches
  distanceScore * 0.30 +         // Geographic proximity
  seasonalityScore * 0.15 +      // Good for target month
  qualityScore * 0.15            // Ratings + popularity
```

## Filters Supported

### Geographic
- User location (lat/lon)
- Max distance (km)
- Bounding box calculation

### Climbing Grades
- Grade range (min/max)
- Overlapping grade ranges

### Seasonality
- Best month (1-12)
- Season preference (summer/winter/spring/fall)

### Technical
- Orientations (N, NE, E, SE, S, SW, W, NW)
- Rock types (limestone, granite, sandstone, etc.)
- Climbing styles (sport, vertical, overhang, slab, etc.)

### Quality
- Min popularity (0-1)
- Min quality rating (0-1)
- Min route count

### Facilities
- Has topos
- Has photos
- Requires permit

### Route Types
- Sport climbing
- Traditional climbing
- Bouldering
- Multi-pitch

## API Endpoints

### Search Zones (POST)
```
POST /api/search/zones
Content-Type: application/json

{
  "query": "sport climbing on vertical walls",
  "userLocation": { "lat": 39.5, "lon": -0.5 },
  "maxDistance": 100,
  "gradeRange": { "min": "6a", "max": "7a" },
  "month": 10,
  "minRoutes": 20,
  "orientations": ["N", "NE"],
  "limit": 20
}
```

### Search Zones (GET)
```
GET /api/search/zones?
  q=sport+climbing
  &lat=39.5
  &lon=-0.5
  &maxDistance=100
  &minGrade=6a
  &maxGrade=7a
  &month=10
  &limit=20
```

### Index Single Zone
```
POST /api/admin/index-zone/:cragId
```

### Index All Zones
```
POST /api/admin/index-all-zones
Content-Type: application/json

{
  "batchSize": 10,
  "skipExisting": false
}
```

## CLI Commands

### Index All Zones
```bash
bun run cli index-embeddings --all
bun run cli index-embeddings --all --skipExisting
bun run cli index-embeddings --all --batchSize=20
```

### Index Single Zone
```bash
bun run cli index-embeddings --cragId=<crag-id>
```

### Search Zones
```bash
bun run cli search-zones "sport climbing on limestone" \
  --lat=39.5 \
  --lon=-0.5 \
  --maxDistance=100 \
  --minGrade=6a \
  --maxGrade=7a \
  --month=10 \
  --limit=10
```

## Multilingual Support

The system supports queries in multiple languages automatically:

- **English**: "sport climbing with vertical walls and good holds"
- **Spanish**: "escalada deportiva en pared vertical con buenos agarres"
- **French**: "escalade sportive sur mur vertical avec bonnes prises"
- **German**: "Sportklettern an senkrechter Wand mit guten Griffen"

## Performance

### Indexing
- Single zone: ~200ms (100ms API + 100ms DB)
- 1,000 zones: ~3-5 minutes (batch of 10)
- 10,000 zones: ~30-50 minutes (batch of 10)

### Searching
- Vector search: <10ms (with HNSW index)
- Full search with re-ranking: <100ms
- With geographic filter: <50ms

### Storage
- Embedding size: ~3KB per zone (768 floats)
- Total metadata: ~5KB per zone
- 10,000 zones: ~80MB

## Cost Estimation (OpenAI)

Using `text-embedding-3-small` ($0.02 / 1M tokens):

- Average text: 500 tokens/zone
- 10,000 zones indexing: $0.10
- Search queries: ~50 tokens/query = negligible
- Re-indexing: Only changed zones

## Next Steps

### Phase 1: Enhancement
- [ ] Add caching layer for common queries
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
- [ ] Create admin dashboard

### Phase 2: Advanced Features
- [ ] User preference learning
- [ ] Collaborative filtering
- [ ] Image embeddings (photos/topos)
- [ ] Weather integration

### Phase 3: Optimization
- [ ] Query result caching (Redis)
- [ ] Incremental indexing
- [ ] A/B testing for scoring weights
- [ ] Performance profiling

## Troubleshooting

### Vector Index Not Used
```sql
-- Check if index exists
SELECT * FROM pg_indexes WHERE tablename = 'zone_embeddings';

-- Recreate index
DROP INDEX IF EXISTS zone_embedding_hnsw_idx;
CREATE INDEX zone_embedding_hnsw_idx 
ON zone_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### Slow Queries
- Increase `m` parameter in HNSW index (trade-off: memory)
- Use IVFFlat index for lower memory usage
- Add more specific filters to reduce candidate set

### OpenAI Rate Limits
- Reduce batch size
- Add delays between batches
- Implement retry logic with exponential backoff

## References

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)

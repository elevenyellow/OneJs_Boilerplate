# Embeddings Package

Semantic search system for climbing zones using vector embeddings and hybrid filtering.

## Features

- 🔍 **Semantic Search**: Natural language queries in any language
- 📍 **Geographic Filtering**: Distance-based search from user location
- 🧗 **Grade Filtering**: Find zones with specific difficulty ranges
- 📅 **Seasonal Filtering**: Best times to climb
- 🏔️ **Technical Filters**: Orientation, rock type, climbing style
- ⭐ **Quality Scoring**: Multi-factor ranking algorithm
- 🚀 **Vector Database**: pgvector for fast similarity search

## Setup

### 1. Install Dependencies

```bash
bun add openai
```

### 2. Configure Environment Variables

Create or update your `.env` file:

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://admin:admin123@localhost:5432/climb_zone
```

### 3. Start Database with pgvector

```bash
bun run start:db
```

### 4. Run Migrations

```bash
bun run prisma:build
bun run prisma:migrate:dev
```

### 5. Create Vector Index

After migration, run this SQL manually:

```sql
-- For HNSW index (recommended for most cases)
CREATE INDEX zone_embedding_hnsw_idx 
ON zone_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- OR for IVFFlat index (lower memory usage)
CREATE INDEX zone_embedding_ivfflat_idx 
ON zone_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## Usage

### Indexing Zones

```typescript
import { IndexZoneUseCase, IndexAllZonesUseCase } from '@climb-zone/embeddings'

// Index a single crag
await indexZoneUseCase.execute(cragId)

// Index all crags
await indexAllZonesUseCase.execute({
  batchSize: 10,
  skipExisting: false,
  onProgress: (current, total, name) => {
    console.log(`${current}/${total}: ${name}`)
  }
})
```

### Searching Zones

```typescript
import { SearchZonesUseCase } from '@climb-zone/embeddings'

const results = await searchZonesUseCase.execute({
  // Natural language query (any language)
  query: "sport climbing on vertical walls with good holds for beginners",
  
  // Geographic filter
  userLocation: { lat: 39.5, lon: -0.5 },
  maxDistance: 100, // km
  
  // Grade filter
  gradeRange: { min: "6a", max: "7a" },
  
  // Seasonal filter
  month: 10, // October
  
  // Technical filters
  orientations: ["N", "NE"],
  rockTypes: ["limestone"],
  climbingStyles: ["sport", "vertical"],
  
  // Quality filters
  minRoutes: 20,
  minQuality: 0.7,
  hasTopos: true,
  
  // Pagination
  limit: 20,
  offset: 0
})
```

### REST API Examples

#### Search (POST)

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "escalada deportiva en placa con buenos agarres",
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "maxDistance": 100,
    "gradeRange": { "min": "6a", "max": "7a" },
    "month": 10,
    "limit": 20
  }'
```

#### Search (GET)

```bash
curl "http://localhost:3000/api/search/zones?q=sport+climbing&lat=39.5&lon=-0.5&maxDistance=100&minGrade=6a&maxGrade=7a&month=10&limit=20"
```

#### Index Single Zone

```bash
curl -X POST http://localhost:3000/api/admin/index-zone/crag123
```

#### Index All Zones

```bash
curl -X POST http://localhost:3000/api/admin/index-all-zones \
  -H "Content-Type: application/json" \
  -d '{
    "batchSize": 10,
    "skipExisting": false
  }'
```

## Scoring Algorithm

The search results are ranked using a weighted scoring system:

- **Semantic Similarity** (40%): How well the text matches the query
- **Geographic Distance** (30%): Proximity to user location
- **Seasonality** (15%): How good the month is for climbing
- **Quality** (15%): Combination of ratings, popularity, and kudos

## Architecture

```
embeddings/
├── domain/
│   ├── entities/          # Core business objects
│   ├── value-objects/     # Immutable values
│   └── interfaces/        # Contracts
├── application/
│   ├── services/          # Business logic
│   └── use-cases/         # Application operations
└── infrastructure/
    ├── providers/         # External services (OpenAI)
    ├── persistence/       # Database operations
    └── http/              # REST controllers
```

## Performance

- **Embedding Generation**: ~50-100ms per zone (OpenAI)
- **Vector Search**: <10ms for 10k zones (with proper indexes)
- **Full Search**: <100ms including re-ranking

## Cost Estimation

Using OpenAI `text-embedding-3-small` ($0.02 / 1M tokens):

- Average crag text: ~500 tokens
- 10,000 crags: ~5M tokens = $0.10
- Query embeddings: negligible cost

## Multilingual Support

The system automatically handles queries in multiple languages:

- **English**: "sport climbing with vertical walls"
- **Spanish**: "escalada deportiva en pared vertical"
- **French**: "escalade sportive sur mur vertical"
- **German**: "Sportklettern an senkrechter Wand"

## Next Steps

1. Add batch re-indexing job
2. Implement caching for common queries
3. Add user feedback for relevance tuning
4. Create recommendation engine based on user preferences
5. Add image embeddings for visual search

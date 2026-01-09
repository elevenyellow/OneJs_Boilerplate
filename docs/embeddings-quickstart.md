# Embeddings System - Quick Start Guide

## 🚀 Setup (5 minutes)

### 1. Prerequisites

Make sure you have:
- PostgreSQL with pgvector running (Docker recommended)
- OpenAI API key
- Node.js/Bun installed

### 2. Environment Variables

Add to your `.env` file:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=sk-proj-your-key-here

# Database (should already exist)
DATABASE_URL=postgresql://admin:admin123@localhost:5432/climb_zone
```

### 3. Start Database with pgvector

```bash
# This will use the updated docker-compose.yml with pgvector
bun run start:db
```

### 4. Run Migrations

```bash
# Merge schemas and generate Prisma client
bun run prisma:build

# Run migrations to create zone_embeddings table
bun run prisma:migrate:dev
```

### 5. Create Vector Index

Connect to your database and run:

```sql
-- Option 1: HNSW (recommended - faster, more memory)
CREATE INDEX zone_embedding_hnsw_idx 
ON zone_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Option 2: IVFFlat (alternative - slower, less memory)
-- CREATE INDEX zone_embedding_ivfflat_idx 
-- ON zone_embeddings 
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);
```

Or use the CLI:

```bash
psql postgresql://admin:admin123@localhost:5432/climb_zone \
  -c "CREATE INDEX zone_embedding_hnsw_idx ON zone_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);"
```

---

## 📊 Index Your Data

### Option 1: Index All Zones

```bash
# Index all crags in your database
bun run cli index-embeddings --all

# Or with options
bun run cli index-embeddings --all --skipExisting --batchSize=10
```

This will:
1. Fetch all crags from database
2. Generate text representations
3. Create embeddings via OpenAI API
4. Extract metadata
5. Store in zone_embeddings table

**Time estimate**: ~3-5 minutes per 1,000 zones

### Option 2: Index Single Zone

```bash
# Index a specific crag (useful for testing)
bun run cli index-embeddings --cragId=<your-crag-id>
```

---

## 🔍 Test Search

### Simple Text Search

```bash
bun run cli search-zones "sport climbing with good holds"
```

### Search with Location

```bash
bun run cli search-zones "limestone sport climbing" \
  --lat=39.5 \
  --lon=-0.5 \
  --maxDistance=100
```

### Search with All Filters

```bash
bun run cli search-zones "beginner friendly sport routes" \
  --lat=39.5 \
  --lon=-0.5 \
  --maxDistance=100 \
  --minGrade=5a \
  --maxGrade=6b \
  --month=10 \
  --limit=10
```

### Search in Spanish

```bash
bun run cli search-zones "escalada deportiva en placa vertical con buenos agarres" \
  --lat=39.5 \
  --lon=-0.5 \
  --maxDistance=50
```

---

## 🌐 REST API Usage

### Start API Server

```bash
bun run start:api:dev
```

### Search Zones (POST)

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "sport climbing on vertical walls",
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "maxDistance": 100,
    "gradeRange": { "min": "6a", "max": "7a" },
    "month": 10,
    "limit": 20
  }'
```

### Search Zones (GET)

```bash
curl "http://localhost:3000/api/search/zones?\
q=sport+climbing\
&lat=39.5\
&lon=-0.5\
&maxDistance=100\
&minGrade=6a\
&maxGrade=7a\
&month=10"
```

### Response Format

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
          "location": { "lat": 39.6667, "lon": -0.9000 },
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
        "preview": "Climbing zone Chulilla. Description: World-class sport climbing on..."
      }
    ],
    "total": 15
  }
}
```

---

## 💡 Common Use Cases

### 1. Find Zones Near Me

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.4699, "lon": -0.3763 },
    "maxDistance": 50,
    "minRoutes": 10,
    "limit": 10
  }'
```

### 2. Find Beginner-Friendly Zones

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "beginner friendly easy routes good for learning",
    "gradeRange": { "min": "4", "max": "6a" },
    "minRoutes": 20,
    "hasTopos": true,
    "limit": 10
  }'
```

### 3. Find Shaded Summer Zones

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "shaded north facing good for summer",
    "month": 7,
    "orientations": ["N", "NE", "NW"],
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "maxDistance": 100,
    "limit": 10
  }'
```

### 4. Find Quality Multi-Pitch Routes

```bash
curl -X POST http://localhost:3000/api/search/zones \
  -H "Content-Type: application/json" \
  -d '{
    "query": "multi-pitch climbing long routes alpine",
    "routeTypes": ["multipitch"],
    "minQuality": 0.7,
    "gradeRange": { "min": "6a", "max": "7b" },
    "limit": 10
  }'
```

---

## 🐛 Troubleshooting

### Error: OPENAI_API_KEY not found

```bash
# Add to .env file
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
```

### Error: pgvector extension not found

```bash
# Restart database with pgvector image
bun run start:db

# Or manually install pgvector
psql -d climb_zone -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Error: No results found

1. Make sure zones are indexed:
   ```bash
   bun run cli index-embeddings --all
   ```

2. Check if embeddings exist:
   ```sql
   SELECT COUNT(*) FROM zone_embeddings;
   ```

3. Verify vector index:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'zone_embeddings';
   ```

### Slow Search Performance

1. Create HNSW index (if not created):
   ```sql
   CREATE INDEX zone_embedding_hnsw_idx 
   ON zone_embeddings 
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);
   ```

2. Analyze table:
   ```sql
   ANALYZE zone_embeddings;
   ```

---

## 📈 Next Steps

1. **Monitor Usage**: Check OpenAI API usage at https://platform.openai.com/usage
2. **Test Queries**: Try different search queries and filters
3. **Integrate Frontend**: Connect your web/mobile app to the API
4. **Add Caching**: Implement Redis cache for common queries
5. **User Feedback**: Collect relevance feedback to improve scoring

---

## 💰 Cost Information

**OpenAI text-embedding-3-small Pricing**: $0.02 per 1M tokens

**Estimates**:
- Index 1,000 zones (~500 tokens each): $0.01
- Index 10,000 zones: $0.10
- Search queries (~50 tokens each): Negligible (10,000 queries = $0.001)

**Monthly estimate for 10,000 zones + 100,000 queries**: ~$0.11

---

## 🆘 Need Help?

- Check the full documentation: `/docs/embeddings-implementation.md`
- Review package README: `/packages/embeddings/README.md`
- Check example commands: `/apps/scripts/commands/`

Happy climbing! 🧗‍♂️

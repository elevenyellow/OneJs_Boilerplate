#!/bin/bash

# Test script for embeddings system
# Run: bash test-embeddings.sh

echo "================================================"
echo "🧪 EMBEDDINGS SYSTEM - TEST SCRIPT"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check database
echo "📊 Step 1: Checking database..."
DB_CHECK=$(psql postgresql://admin:admin123@localhost:5432/climb_zone -t -c "SELECT COUNT(*) FROM crags;" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connected${NC}"
    echo "   Found $DB_CHECK crags"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "   Run: bun run start:db"
    exit 1
fi

# Step 2: Check pgvector extension
echo ""
echo "🔌 Step 2: Checking pgvector extension..."
PGVECTOR=$(psql postgresql://admin:admin123@localhost:5432/climb_zone -t -c "SELECT 1 FROM pg_extension WHERE extname='vector';" 2>/dev/null)
if [ -n "$PGVECTOR" ]; then
    echo -e "${GREEN}✅ pgvector extension installed${NC}"
else
    echo -e "${YELLOW}⚠️  pgvector extension not found${NC}"
    echo "   Installing..."
    psql postgresql://admin:admin123@localhost:5432/climb_zone -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ pgvector installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install pgvector${NC}"
        exit 1
    fi
fi

# Step 3: Check if migrations are applied
echo ""
echo "🗄️  Step 3: Checking zone_embeddings table..."
TABLE_CHECK=$(psql postgresql://admin:admin123@localhost:5432/climb_zone -t -c "SELECT 1 FROM information_schema.tables WHERE table_name='zone_embeddings';" 2>/dev/null)
if [ -n "$TABLE_CHECK" ]; then
    echo -e "${GREEN}✅ zone_embeddings table exists${NC}"
    
    # Check if there are any embeddings
    EMBEDDING_COUNT=$(psql postgresql://admin:admin123@localhost:5432/climb_zone -t -c "SELECT COUNT(*) FROM zone_embeddings;" 2>/dev/null)
    echo "   Found $EMBEDDING_COUNT embeddings indexed"
else
    echo -e "${YELLOW}⚠️  zone_embeddings table not found${NC}"
    echo "   Run migrations: bun run prisma:build && bun run prisma:migrate:dev"
    exit 1
fi

# Step 4: Check vector index
echo ""
echo "📇 Step 4: Checking vector index..."
INDEX_CHECK=$(psql postgresql://admin:admin123@localhost:5432/climb_zone -t -c "SELECT 1 FROM pg_indexes WHERE tablename='zone_embeddings' AND indexname LIKE '%vector%' OR indexname LIKE '%hnsw%' OR indexname LIKE '%ivfflat%';" 2>/dev/null)
if [ -n "$INDEX_CHECK" ]; then
    echo -e "${GREEN}✅ Vector index exists${NC}"
    psql postgresql://admin:admin123@localhost:5432/climb_zone -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename='zone_embeddings';" 2>/dev/null | grep -E "hnsw|ivfflat" || echo "   (No specialized vector index)"
else
    echo -e "${YELLOW}⚠️  No vector index found${NC}"
    echo "   Creating HNSW index..."
    psql postgresql://admin:admin123@localhost:5432/climb_zone -c "CREATE INDEX IF NOT EXISTS zone_embedding_hnsw_idx ON zone_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ HNSW index created${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not create HNSW index (this is OK for testing)${NC}"
    fi
fi

# Step 5: Check OpenAI API key
echo ""
echo "🔑 Step 5: Checking OpenAI API key..."
if [ -f .env ]; then
    if grep -q "OPENAI_API_KEY" .env 2>/dev/null; then
        KEY_VALUE=$(grep "OPENAI_API_KEY" .env | cut -d '=' -f 2)
        if [ -n "$KEY_VALUE" ] && [ "$KEY_VALUE" != "your-api-key-here" ]; then
            echo -e "${GREEN}✅ OpenAI API key configured${NC}"
        else
            echo -e "${YELLOW}⚠️  OpenAI API key not set${NC}"
            echo "   Add your key to .env: OPENAI_API_KEY=sk-..."
        fi
    else
        echo -e "${YELLOW}⚠️  OPENAI_API_KEY not found in .env${NC}"
        echo "   Add: echo 'OPENAI_API_KEY=sk-your-key' >> .env"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "   Create: echo 'OPENAI_API_KEY=sk-your-key' > .env"
fi

# Step 6: Test commands exist
echo ""
echo "🛠️  Step 6: Checking CLI commands..."
if [ -f "apps/scripts/commands/index-embeddings.command.ts" ]; then
    echo -e "${GREEN}✅ index-embeddings command exists${NC}"
else
    echo -e "${RED}❌ index-embeddings command not found${NC}"
fi

if [ -f "apps/scripts/commands/search-zones.command.ts" ]; then
    echo -e "${GREEN}✅ search-zones command exists${NC}"
else
    echo -e "${RED}❌ search-zones command not found${NC}"
fi

# Summary
echo ""
echo "================================================"
echo "📋 SUMMARY"
echo "================================================"
echo ""

# Count checks
PASSED=0
TOTAL=6

[ $? -eq 0 ] && PASSED=$((PASSED + 1))

echo "System Status:"
echo "  • Database: $([ -n "$DB_CHECK" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  • pgvector: $([ -n "$PGVECTOR" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  • Table: $([ -n "$TABLE_CHECK" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  • Index: $([ -n "$INDEX_CHECK" ] && echo -e "${GREEN}OK${NC}" || echo -e "${YELLOW}WARNING${NC}")"
echo "  • Embeddings: $EMBEDDING_COUNT indexed"
echo ""

echo "Next Steps:"
echo ""
echo "1️⃣  Set OpenAI API Key:"
echo "   echo 'OPENAI_API_KEY=sk-your-key' >> .env"
echo ""
echo "2️⃣  Index a single crag (test):"
echo "   Get a crag ID: psql postgresql://admin:admin123@localhost:5432/climb_zone -c \"SELECT id, name FROM crags LIMIT 1;\""
echo "   bun run apps/scripts/cli.ts index-embeddings --cragId=<CRAG_ID>"
echo ""
echo "3️⃣  Index all crags:"
echo "   bun run apps/scripts/cli.ts index-embeddings --all"
echo ""
echo "4️⃣  Test search:"
echo "   bun run apps/scripts/cli.ts search-zones \"sport climbing\""
echo ""
echo "================================================"

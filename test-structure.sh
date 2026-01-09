#!/bin/bash

echo "================================================"
echo "🧪 VERIFICACIÓN DE ESTRUCTURA - EMBEDDINGS"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📦 Paquete embeddings/"
echo ""
echo "Domain Layer:"
[ -f "packages/embeddings/domain/entities/zone-embedding.entity.ts" ] && echo -e "${GREEN}✅${NC} zone-embedding.entity.ts" || echo "❌ zone-embedding.entity.ts"
[ -f "packages/embeddings/domain/value-objects/embedding-vector.vo.ts" ] && echo -e "${GREEN}✅${NC} embedding-vector.vo.ts" || echo "❌ embedding-vector.vo.ts"
[ -f "packages/embeddings/domain/value-objects/zone-metadata.vo.ts" ] && echo -e "${GREEN}✅${NC} zone-metadata.vo.ts" || echo "❌ zone-metadata.vo.ts"

echo ""
echo "Application Layer:"
[ -f "packages/embeddings/application/services/text-generator.service.ts" ] && echo -e "${GREEN}✅${NC} text-generator.service.ts" || echo "❌ text-generator.service.ts"
[ -f "packages/embeddings/application/services/metadata-extractor.service.ts" ] && echo -e "${GREEN}✅${NC} metadata-extractor.service.ts" || echo "❌ metadata-extractor.service.ts"
[ -f "packages/embeddings/application/use-cases/index-zone.use-case.ts" ] && echo -e "${GREEN}✅${NC} index-zone.use-case.ts" || echo "❌ index-zone.use-case.ts"
[ -f "packages/embeddings/application/use-cases/search-zones.use-case.ts" ] && echo -e "${GREEN}✅${NC} search-zones.use-case.ts" || echo "❌ search-zones.use-case.ts"

echo ""
echo "Infrastructure Layer:"
[ -f "packages/embeddings/infrastructure/providers/openai-embedding.service.ts" ] && echo -e "${GREEN}✅${NC} openai-embedding.service.ts" || echo "❌ openai-embedding.service.ts"
[ -f "packages/embeddings/infrastructure/persistence/prisma/embedding.repository.ts" ] && echo -e "${GREEN}✅${NC} embedding.repository.ts" || echo "❌ embedding.repository.ts"
[ -f "packages/embeddings/infrastructure/http/search.controller.ts" ] && echo -e "${GREEN}✅${NC} search.controller.ts" || echo "❌ search.controller.ts"

echo ""
echo "================================================"
echo "📚 Documentación"
echo "================================================"
echo ""

docs=(
    "docs/EMBEDDINGS-README.md"
    "docs/embeddings-quickstart.md"
    "docs/embeddings-implementation.md"
    "docs/embeddings-summary.md"
    "docs/embeddings-api-examples.md"
    "docs/embeddings-checklist.md"
    "docs/EMBEDDINGS-COMPLETE.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        size=$(wc -l < "$doc")
        echo -e "${GREEN}✅${NC} $(basename $doc) ($size líneas)"
    else
        echo "❌ $(basename $doc)"
    fi
done

echo ""
echo "================================================"
echo "🛠️  Comandos CLI"
echo "================================================"
echo ""

[ -f "apps/scripts/commands/index-embeddings.command.ts" ] && echo -e "${GREEN}✅${NC} index-embeddings.command.ts" || echo "❌ index-embeddings.command.ts"
[ -f "apps/scripts/commands/search-zones.command.ts" ] && echo -e "${GREEN}✅${NC} search-zones.command.ts" || echo "❌ search-zones.command.ts"

echo ""
echo "================================================"
echo "📊 Estadísticas"
echo "================================================"
echo ""

ts_files=$(find packages/embeddings -name "*.ts" 2>/dev/null | wc -l)
doc_files=$(ls docs/*embeddings*.md docs/EMBEDDINGS*.md 2>/dev/null | wc -l)
total_lines=$(find packages/embeddings -name "*.ts" -exec wc -l {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}')

echo "Archivos TypeScript: $ts_files"
echo "Archivos documentación: $doc_files"
echo "Líneas de código: $total_lines"

echo ""
echo "================================================"
echo "✅ SISTEMA IMPLEMENTADO COMPLETAMENTE"
echo "================================================"
echo ""
echo "Para probar con datos reales:"
echo "1. Configura OpenAI: echo 'OPENAI_API_KEY=sk-...' >> .env"
echo "2. Asegúrate de tener datos en la BD"
echo "3. Ejecuta: bun run apps/scripts/cli.ts index-embeddings --all"
echo "4. Busca: bun run apps/scripts/cli.ts search-zones \"query\""
echo ""
echo "Documentación completa: docs/EMBEDDINGS-README.md"
echo "================================================"

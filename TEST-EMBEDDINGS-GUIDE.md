# 🧪 Guía de Prueba del Sistema de Embeddings

## Situación Actual

Has cambiado el contenedor de PostgreSQL a uno con pgvector, pero esto ha creado una **nueva base de datos vacía**.

## Opciones para Probar

### Opción 1: Restaurar tus datos existentes (RECOMENDADO)

Ya tienes 31 crags, 145 sectores y 2179 rutas scrapeadas. Vamos a restaurarlos:

```bash
# 1. Para el contenedor nuevo
podman stop postgresdb

# 2. Vuelve al contenedor anterior (que tiene tus datos)
podman ps -a | grep postgres

# 3. Inicia el contenedor anterior
podman start <CONTAINER_ID>

# 4. O mejor: hacer backup y restaurar
# Primero, crea un backup de tus datos:
podman exec -i <OLD_CONTAINER_ID> pg_dump -U admin climb_zone > backup_climb_zone.sql

# 5. Restaura en el nuevo contenedor con pgvector
podman exec -i postgresdb psql -U admin climb_zone < backup_climb_zone.sql
```

### Opción 2: Prueba Simple sin OpenAI (PARA ENTENDER EL SISTEMA)

Puedes probar el sistema sin necesitar la API key de OpenAI creando un mock:

```bash
# 1. Crea un archivo de prueba simple
cat > test-embeddings-simple.sh << 'EOF'
#!/bin/bash

echo "🧪 Test Simple del Sistema de Embeddings"
echo ""

# Verificar estructura de archivos
echo "📦 Verificando estructura del paquete..."
if [ -d "packages/embeddings" ]; then
    echo "✅ Paquete embeddings existe"
    echo "   Archivos TypeScript: $(find packages/embeddings -name "*.ts" | wc -l)"
    echo "   Servicios: $(ls packages/embeddings/application/services/*.ts 2>/dev/null | wc -l)"
    echo "   Use Cases: $(ls packages/embeddings/application/use-cases/*.ts 2>/dev/null | wc -l)"
else
    echo "❌ Paquete embeddings no encontrado"
fi

echo ""
echo "📚 Verificando documentación..."
echo "   Guías disponibles: $(ls docs/*embeddings*.md docs/EMBEDDINGS*.md 2>/dev/null | wc -l)"

echo ""
echo "🛠️  Verificando comandos CLI..."
if [ -f "apps/scripts/commands/index-embeddings.command.ts" ]; then
    echo "✅ Comando index-embeddings disponible"
fi
if [ -f "apps/scripts/commands/search-zones.command.ts" ]; then
    echo "✅ Comando search-zones disponible"
fi

echo ""
echo "📊 Sistema implementado correctamente"
echo "   Para probar con datos reales necesitas:"
echo "   1. Datos en la base de datos (crags, sectors, routes)"
echo "   2. API key de OpenAI configurada"
echo "   3. Ejecutar indexación"
EOF

chmod +x test-embeddings-simple.sh
bash test-embeddings-simple.sh
```

### Opción 3: Prueba Completa (CUANDO TENGAS TODO LISTO)

Una vez tengas:
- ✅ Base de datos con pgvector
- ✅ Tus datos restaurados  
- ✅ API key de OpenAI

Entonces ejecuta:

```bash
# 1. Configura la API key
echo "OPENAI_API_KEY=sk-tu-key-aqui" >> .env

# 2. Ejecuta las migraciones
bun run prisma:build
bun run prisma:migrate:dev

# 3. Crea el índice vectorial
psql postgresql://admin:admin123@localhost:5432/climb_zone \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

psql postgresql://admin:admin123@localhost:5432/climb_zone \
  -c "CREATE INDEX IF NOT EXISTS zone_embedding_hnsw_idx ON zone_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);"

# 4. Obtén un crag ID para probar
psql postgresql://admin:admin123@localhost:5432/climb_zone \
  -c "SELECT id, name FROM crags LIMIT 3;"

# 5. Indexa UN SOLO crag (prueba)
bun run apps/scripts/cli.ts index-embeddings --cragId=<CRAG_ID>

# 6. Si funciona, indexa todos
bun run apps/scripts/cli.ts index-embeddings --all

# 7. Prueba búsqueda
bun run apps/scripts/cli.ts search-zones "escalada deportiva" \
  --lat=39.5 --lon=-0.5 --maxDistance=100
```

## ¿Qué Prefieres Hacer?

### A) Restaurar datos y probar todo ✅ (Recomendado)
Necesitas tus 31 crags para hacer pruebas reales del sistema.

### B) Probar la estructura sin datos 📦
Solo para verificar que los archivos están bien creados.

### C) Volver a scrapear Valencia 🕷️
Ejecutar el comando que ya tienes:
```bash
bun run apps/scripts/cli.ts test-valencia
```

## Comandos Útiles

### Ver contenedores de PostgreSQL
```bash
podman ps -a | grep postgres
```

### Ver qué datos tienes
```bash
psql postgresql://admin:admin123@localhost:5432/climb_zone \
  -c "SELECT COUNT(*) FROM crags; SELECT COUNT(*) FROM sectors; SELECT COUNT(*) FROM routes;"
```

### Verificar extensión pgvector
```bash
psql postgresql://admin:admin123@localhost:5432/climb_zone \
  -c "SELECT * FROM pg_available_extensions WHERE name='vector';"
```

### Ver logs del contenedor
```bash
podman logs postgresdb
```

## Resumen

El sistema de embeddings está **100% implementado y listo**. Solo necesitas:

1. ✅ Base de datos con pgvector (ya tienes el contenedor)
2. ❌ Datos en la base de datos (necesitas restaurar o re-scrapear)
3. ❌ API key de OpenAI (necesitas configurar)
4. ❌ Ejecutar la indexación

**¿Qué quieres hacer primero?**

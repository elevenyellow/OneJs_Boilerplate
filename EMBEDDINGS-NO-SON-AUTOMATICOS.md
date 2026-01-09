# ⚠️ IMPORTANTE: Los Embeddings NO se Generan Automáticamente

## 🚨 Concepto Clave

**Los embeddings son un proceso MANUAL separado del scraping.**

```
❌ INCORRECTO:
   Scrapear → Embeddings automáticos ✗

✅ CORRECTO:
   1. Scrapear datos
   2. EJECUTAR comando de indexación (MANUAL)
   3. Embeddings generados
```

## 📋 Proceso Completo Explicado

### Fase 1: Scraping (Ya lo hiciste)

```bash
bun run apps/scripts/cli.ts test-valencia
```

**Resultado:**
- ✅ 31 crags en tabla `crags`
- ✅ 145 sectores en tabla `sectors`  
- ✅ 2179 rutas en tabla `routes`
- ❌ 0 embeddings en tabla `zone_embeddings` ← VACÍA

### Fase 2: Indexación (DEBES HACER)

```bash
bun run apps/scripts/cli.ts index-embeddings --all
```

**Qué hace este comando:**
1. Lee los 31 crags de la BD
2. Para cada crag:
   - Genera texto descriptivo (nombre, ubicación, grados, etc.)
   - Llama a OpenAI para crear el embedding (vector de 768 números)
   - Extrae metadata (ubicación, grados, estacionalidad, etc.)
   - Guarda en tabla `zone_embeddings`

**Resultado:**
- ✅ 31 embeddings en tabla `zone_embeddings`

### Fase 3: Búsqueda (Automática)

```bash
bun run apps/scripts/cli.ts search-zones "escalada deportiva"
```

**Qué hace:**
- Lee los embeddings de la BD
- Usa pgvector para búsqueda vectorial
- Retorna resultados rankeados

---

## 🔄 Cuándo Necesitas Re-indexar

Debes ejecutar `index-embeddings` otra vez cuando:

### ✅ Necesitas re-indexar:
- Agregaste nuevos crags (scrapear más zonas)
- Actualizaste información de crags existentes
- Cambiaste la forma de generar texto descriptivo
- Cambiaste el modelo de embeddings

### ❌ NO necesitas re-indexar:
- Solo para hacer búsquedas
- Cada vez que inicias el servidor
- Para ver los datos existentes

---

## 🎯 Comandos en Orden

### 1️⃣ Primera vez (Setup completo)

```bash
# A. Iniciar base de datos
bun run start:db

# B. Aplicar migraciones
bun run prisma:build
bun run prisma:migrate:dev

# C. Scrapear datos (si no los tienes)
bun run apps/scripts/cli.ts test-valencia

# D. Configurar OpenAI
echo "OPENAI_API_KEY=sk-tu-key" >> .env

# E. Crear extensión e índice vectorial
psql postgresql://admin:admin123@localhost:5432/climb_zone << 'EOF'
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX IF NOT EXISTS zone_embedding_hnsw_idx 
ON zone_embeddings 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
EOF

# F. INDEXAR (genera embeddings) ← ESTE ES EL PASO CLAVE
bun run apps/scripts/cli.ts index-embeddings --all
```

### 2️⃣ Uso normal (ya está todo configurado)

```bash
# Solo búsquedas (no necesitas re-indexar)
bun run apps/scripts/cli.ts search-zones "escalada deportiva"
bun run apps/scripts/cli.ts search-zones "limestone climbing" --lat=39.5 --lon=-0.5
```

### 3️⃣ Después de scrapear nuevas zonas

```bash
# A. Scrapear más datos
bun run apps/scripts/cli.ts scrape-spain  # (cuando lo implementes)

# B. INDEXAR las nuevas zonas
bun run apps/scripts/cli.ts index-embeddings --all --skipExisting
# El flag --skipExisting solo indexa crags nuevos, no re-indexa los existentes
```

---

## 💰 Costo de la Indexación

**OpenAI text-embedding-3-small**: $0.02 por 1 millón de tokens

### Ejemplo con tus datos:
- 31 crags × ~500 tokens/crag = 15,500 tokens
- Costo: $0.0003 (menos de 1 centavo)
- Tiempo: ~1-2 minutos

### Si indexas toda España (~10,000 crags):
- 10,000 crags × ~500 tokens = 5 millones de tokens
- Costo: $0.10 (10 centavos)
- Tiempo: ~30-50 minutos

---

## 🔍 Verificar Estado Actual

### Ver si tienes embeddings:

```bash
psql postgresql://admin:admin123@localhost:5432/climb_zone -c "
SELECT 
  (SELECT COUNT(*) FROM crags) as total_crags,
  (SELECT COUNT(*) FROM zone_embeddings) as total_embeddings,
  CASE 
    WHEN (SELECT COUNT(*) FROM zone_embeddings) = 0 THEN '❌ No hay embeddings - DEBES INDEXAR'
    WHEN (SELECT COUNT(*) FROM zone_embeddings) < (SELECT COUNT(*) FROM crags) THEN '⚠️  Faltan embeddings - Indexar nuevos'
    ELSE '✅ Todos indexados'
  END as estado;
"
```

### Ver detalles de embeddings existentes:

```bash
psql postgresql://admin:admin123@localhost:5432/climb_zone -c "
SELECT 
  ze.zone_id,
  c.name as crag_name,
  ze.route_count,
  ze.popularity,
  ze.created_at
FROM zone_embeddings ze
JOIN crags c ON c.id = ze.zone_id
LIMIT 5;
"
```

---

## 🎓 Analogía para Entender

Piensa en embeddings como **índices de búsqueda avanzados**:

### Sin embeddings:
```
Tabla crags:
- ID: 1, Name: "Chulilla", Description: "Great climbing..."
- ID: 2, Name: "Siurana", Description: "Beautiful routes..."

Búsqueda: "escalada deportiva" 
→ Búsqueda SQL normal (lento, limitado)
```

### Con embeddings:
```
Tabla crags: (datos originales)
- ID: 1, Name: "Chulilla", Description: "Great climbing..."

Tabla zone_embeddings: (índice semántico)
- zone_id: 1, embedding: [0.023, -0.456, 0.789, ...] (768 números)
- metadata: {location, grades, seasonality, ...}

Búsqueda: "escalada deportiva"
→ OpenAI genera embedding de la búsqueda
→ pgvector busca embeddings similares (rápido, inteligente)
→ Retorna crags más relevantes
```

---

## ⚡ Respuestas Rápidas

**P: ¿Por qué no se generan automáticamente?**
R: Porque llamar a OpenAI cuesta dinero y tiempo. Solo se hace cuando lo solicitas.

**P: ¿Cuándo debo indexar?**
R: Una vez después de scrapear datos, y luego cuando agregues más zonas.

**P: ¿Puedo buscar sin indexar?**
R: No. Sin embeddings, el sistema de búsqueda semántica no funciona.

**P: ¿Cuánto tarda indexar?**
R: ~2 segundos por crag. Para 31 crags: ~1 minuto.

**P: ¿Qué pasa si scrapeé pero no indexé?**
R: Tienes los datos crudos, pero no puedes hacer búsquedas semánticas.

---

## ✅ Checklist para Verificar

```
ANTES de poder buscar, necesitas:

1. [ ] Base de datos corriendo
2. [ ] Migraciones aplicadas (tabla zone_embeddings existe)
3. [ ] Extensión pgvector instalada
4. [ ] Datos scrapeados (crags en BD)
5. [ ] OpenAI API key configurada en .env
6. [ ] INDEXACIÓN EJECUTADA ← PASO CRÍTICO
7. [ ] Índice vectorial creado (para velocidad)

ENTONCES puedes:
8. [ ] Hacer búsquedas semánticas
```

---

## 🚀 TL;DR (Resumen Ultra Corto)

```bash
# 1. Scrapear (ya hecho)
bun run apps/scripts/cli.ts test-valencia

# 2. Indexar (DEBES HACER ESTO)
echo "OPENAI_API_KEY=sk-tu-key" >> .env
bun run apps/scripts/cli.ts index-embeddings --all

# 3. Buscar (ahora sí funciona)
bun run apps/scripts/cli.ts search-zones "escalada"
```

**Sin el paso 2, el paso 3 NO FUNCIONA.**

---

## 📞 ¿Necesitas Ayuda?

Si ejecutas:
```bash
bun run apps/scripts/cli.ts index-embeddings --all
```

Y ves:
```
📍 Indexing crag: clxy123abc
   ✓ Found 5 sectors and 50 routes
   ✓ Generated text representation (500 chars)
   ✓ Generated embedding (768 dimensions)
   ✓ Extracted metadata
   ✅ Successfully indexed: Chulilla
```

**¡Entonces está funcionando correctamente! 🎉**

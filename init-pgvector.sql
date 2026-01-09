-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Note: Vector index will be created after migration with:
-- CREATE INDEX zone_embedding_hnsw_idx ON zone_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
-- or
-- CREATE INDEX zone_embedding_ivfflat_idx ON zone_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

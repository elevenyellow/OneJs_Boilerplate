/**
 * Embeddings Package
 * Semantic search system for climbing zones using vector embeddings
 */

// Domain
export * from './domain/entities/zone-embedding.entity'
export * from './domain/value-objects/embedding-vector.vo'
export * from './domain/value-objects/zone-metadata.vo'
export * from './domain/interfaces/embedding-service.interface'
export * from './domain/interfaces/embedding-repository.interface'

// Application
export * from './application/services/text-generator.service'
export * from './application/services/metadata-extractor.service'
export * from './application/use-cases/index-zone.use-case'
export * from './application/use-cases/index-all-zones.use-case'
export * from './application/use-cases/search-zones.use-case'

// Infrastructure
export * from './infrastructure/providers/openai-embedding.service'
export * from './infrastructure/persistence/prisma/embedding.repository'
export * from './infrastructure/http/search.controller'

/**
 * Embedding Service Interface
 * Abstracts the embedding generation logic
 */
export interface IEmbeddingService {
  /**
   * Generate embedding vector for a single text
   */
  generateEmbedding(text: string): Promise<number[]>

  /**
   * Generate embeddings for multiple texts in batch
   */
  generateBatch(texts: string[]): Promise<number[][]>

  /**
   * Get the dimension of the embeddings produced by this service
   */
  getDimensions(): number
}

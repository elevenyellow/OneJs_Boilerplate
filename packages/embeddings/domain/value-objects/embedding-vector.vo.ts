/**
 * Embedding Vector Value Object
 * Represents a high-dimensional vector for semantic search
 */
export class EmbeddingVector {
  private constructor(private readonly values: number[]) {
    if (values.length === 0) {
      throw new Error('Embedding vector cannot be empty')
    }
  }

  static create(values: number[]): EmbeddingVector {
    return new EmbeddingVector(values)
  }

  static createEmpty(dimensions: number): EmbeddingVector {
    return new EmbeddingVector(new Array(dimensions).fill(0))
  }

  getDimensions(): number {
    return this.values.length
  }

  toArray(): number[] {
    return [...this.values]
  }

  /**
   * Calculate cosine similarity with another vector
   * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   */
  cosineSimilarity(other: EmbeddingVector): number {
    if (this.values.length !== other.values.length) {
      throw new Error('Vectors must have the same dimensions')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < this.values.length; i++) {
      dotProduct += this.values[i] * other.values[i]
      normA += this.values[i] * this.values[i]
      normB += other.values[i] * other.values[i]
    }

    if (normA === 0 || normB === 0) return 0

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Calculate Euclidean distance to another vector
   */
  euclideanDistance(other: EmbeddingVector): number {
    if (this.values.length !== other.values.length) {
      throw new Error('Vectors must have the same dimensions')
    }

    let sum = 0
    for (let i = 0; i < this.values.length; i++) {
      const diff = this.values[i] - other.values[i]
      sum += diff * diff
    }

    return Math.sqrt(sum)
  }

  toString(): string {
    return `[${this.values.slice(0, 3).join(', ')}...] (${this.values.length}d)`
  }
}

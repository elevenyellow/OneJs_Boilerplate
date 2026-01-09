import { IEmbeddingService } from '../../domain/interfaces/embedding-service.interface'

/**
 * OpenAI Embedding Service
 * Generates embeddings using OpenAI's text-embedding models
 */
export class OpenAIEmbeddingService implements IEmbeddingService {
  private readonly model = 'text-embedding-3-small' // 768 dims, $0.02 / 1M tokens
  // Alternative: 'text-embedding-3-large' // 3072 dims, $0.13 / 1M tokens
  private readonly apiKey: string
  private readonly apiUrl = 'https://api.openai.com/v1/embeddings'

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Generate embedding vector for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          encoding_format: 'float',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          `OpenAI API error: ${error.error?.message || response.statusText}`,
        )
      }

      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * OpenAI supports up to 2048 texts per request
   */
  async generateBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return []
    }

    const BATCH_SIZE = 100 // Conservative batch size
    const results: number[][] = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)

      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: batch,
            encoding_format: 'float',
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(
            `OpenAI API error: ${error.error?.message || response.statusText}`,
          )
        }

        const data = await response.json()
        results.push(...data.data.map((d: any) => d.embedding))

        // Rate limiting: wait between batches
        if (i + BATCH_SIZE < texts.length) {
          await this.delay(100)
        }
      } catch (error) {
        console.error(`Error in batch ${i / BATCH_SIZE}:`, error)
        throw error
      }
    }

    return results
  }

  /**
   * Get the dimension of the embeddings produced by this service
   */
  getDimensions(): number {
    return this.model === 'text-embedding-3-small' ? 768 : 3072
  }

  /**
   * Get the model name
   */
  getModel(): string {
    return this.model
  }

  /**
   * Simple delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

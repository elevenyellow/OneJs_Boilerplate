import { Inject, Injectable, logger } from '@OneJs/core'
import { OpenAIClient } from '../../infrastructure/openai.client'
import { CleanTextPreserveCoordsPrompt } from '../prompts/clean-text-preserve-coords.prompt'

export interface BetaItem {
  name: string
  markdown: string
  inheritedFrom?: { id: string; urlStub: string }
}

@Injectable()
export class TextCleanerService {
  constructor(
    @Inject(CleanTextPreserveCoordsPrompt)
    private readonly prompt: CleanTextPreserveCoordsPrompt,
    @Inject(OpenAIClient)
    private readonly openai: OpenAIClient,
  ) {}

  /**
   * Limpia un texto individual: elimina links, reformula, preserva coordenadas y tags
   */
  async cleanText(text: string): Promise<string> {
    if (!text || text.trim().length === 0) return text

    try {
      const messages = this.prompt.build(text)
      const response = await this.openai.chat(messages, { jsonResponse: true })
      const parsed = this.prompt.parseResponse(response)
      return parsed.result || text
    } catch (error) {
      logger.warn(
        'ai:text-cleaner',
        'Error cleaning text, returning original',
        error,
      )
      return text
    }
  }

  /**
   * Limpia multiples textos en paralelo
   */
  async cleanTexts(texts: string[]): Promise<string[]> {
    return Promise.all(texts.map((t) => this.cleanText(t)))
  }

  /**
   * Limpia items de beta (description, approach, etc.)
   */
  async cleanBetaItems(items: BetaItem[]): Promise<BetaItem[]> {
    if (!items || items.length === 0) return items

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        markdown: await this.cleanText(item.markdown),
      })),
    )
  }
}

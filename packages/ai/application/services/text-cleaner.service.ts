import { Inject, Injectable, logger } from '@OneJs/core'
import { OpenAIClient } from '../../infrastructure/openai.client'
import { CleanTextPreserveCoordsPrompt } from '../prompts/clean-text-preserve-coords.prompt'

export interface BetaItem {
  name: string
  markdown: string
  inheritedFrom?: { id: string; urlStub: string }
}

// Regex to extract language markers like :es:, :gb:, :fr:, etc.
const LANGUAGE_MARKER_REGEX = /:([a-z]{2}):/gi

/**
 * Extract all language markers from text
 */
function extractLanguageMarkers(text: string): string[] {
  const matches = [...text.matchAll(LANGUAGE_MARKER_REGEX)]
  return matches.map((m) => m[1].toLowerCase())
}

/**
 * Validate that all language markers from original text are preserved in cleaned text
 */
function validateLanguagesPreserved(
  original: string,
  cleaned: string,
): boolean {
  const originalLangs = extractLanguageMarkers(original)
  const cleanedLangs = extractLanguageMarkers(cleaned)

  // If original has no language markers, no validation needed
  if (originalLangs.length === 0) return true

  // Check that all original languages are present in cleaned text
  return originalLangs.every((lang) => cleanedLangs.includes(lang))
}

@Injectable()
export class TextCleanerService {
  // Use lower temperature for more consistent multilingual output
  private static readonly TEMPERATURE = 0.3

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

    const messages = this.prompt.build(text)
    const response = await this.openai.chat(messages, {
      jsonResponse: true,
      temperature: TextCleanerService.TEMPERATURE,
    })
    const parsed = this.prompt.parseResponse(response)
    const result = parsed.result || text

    // Validate that all languages were preserved
    if (!validateLanguagesPreserved(text, result)) {
      logger.warn(
        'ai:text-cleaner',
        'Language markers not preserved in AI response, returning original text',
        {
          originalLangs: extractLanguageMarkers(text),
          resultLangs: extractLanguageMarkers(result),
        },
      )
      return text
    }

    return result
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

import { ConfigService, Inject, Injectable, logger } from '@OneJs/core'
import OpenAI from 'openai'
import type { ChatMessage } from '../domain/types/chat.types'

export interface ChatOptions {
  model?: string
  jsonResponse?: boolean
  temperature?: number
  maxTokens?: number
}

@Injectable()
export class OpenAIClient {
  private readonly client: OpenAI

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const apiKey = this.config.get('OPENAI_API_KEY')
    if (!apiKey) {
      logger.warn('ai:openai', 'OPENAI_API_KEY not configured')
    }
    this.client = new OpenAI({ apiKey })
  }

  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<string> {
    const {
      model = 'gpt-4o-mini',
      jsonResponse = false,
      temperature = 0.7,
      maxTokens,
    } = options

    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(jsonResponse && { response_format: { type: 'json_object' } }),
    })

    return response.choices[0]?.message?.content ?? ''
  }
}

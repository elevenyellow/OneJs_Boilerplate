import { Injectable } from '@OneJs/core'
import type {
  ChatMessage,
  CleanTextResult,
  PromptBuilder,
} from '../../domain/types/chat.types'

@Injectable()
export class CleanTextPreserveCoordsPrompt
  implements PromptBuilder<string, CleanTextResult>
{
  build(inputText: string): ChatMessage[] {
    return [
      {
        role: 'system',
        content: `You are an expert content cleaner and rewriter.

Your task:
1. REMOVE all links and references:
   - HTML links (<a href="...">text</a>)
   - Markdown links ([text](url))
   - Raw URLs (https://example.com)
   - Internal refs (#section, [[Note]], @username)

2. PRESERVE ALL COORDINATES exactly as they appear:
   - Decimal: 40.7128, -74.0060
   - DMS: 40°42'46"N 74°0'22"W
   - UTM: 18T 583960 4507523
   - Any GPS pattern

3. PRESERVE ALL TAGS in :tag: format exactly as they appear:
   - Location tags: :parking:, :approach:, :base:, :summit:
   - Language tags: :es:, :en:, :fr:, :de:, :it:, :ca:, :pt:, :gb:
   - Info tags: :warning:, :info:, :note:, :tip:
   - Any other :tag: pattern

4. REPHRASE the content to be unique while keeping meaning and tone.
   The text between language tags should also be rephrased but in the corresponding language.

CRITICAL OUTPUT FORMAT RULES:
- Return JSON: { "result": "cleaned text" }
- The "result" value MUST ALWAYS be a single plain string
- NEVER return an object or nested structure as the result
- Keep all language markers (:es:, :gb:, etc.) INLINE within the string
- Multilingual content stays as one string with markers, like: ":es:\\nTexto en español\\n\\n:gb:\\nEnglish text"`,
      },
      {
        role: 'user',
        content: inputText,
      },
    ]
  }

  parseResponse(response: string): CleanTextResult {
    try {
      return JSON.parse(response) as CleanTextResult
    } catch {
      return { result: response }
    }
  }
}

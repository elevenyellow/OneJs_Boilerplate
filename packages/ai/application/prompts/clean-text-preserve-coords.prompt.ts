import { Injectable } from '@OneJs/core'
import type {
  ChatMessage,
  CleanTextResult,
  PromptBuilder,
} from '../../domain/types/chat.types'

@Injectable()
export class CleanTextPreserveCoordsPrompt
  implements PromptBuilder<string, CleanTextResult> {
  build(inputText: string): ChatMessage[] {
    return [
      {
        role: 'system',
        content: `You are an expert content cleaner and rewriter for multilingual climbing content.

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
   The text between language tags should be rephrased IN THE CORRESPONDING LANGUAGE.

CRITICAL MULTILINGUAL RULES:
- If input has language markers (:es:, :gb:, :fr:, etc.), output MUST have THE EXACT SAME markers
- Count language sections in input and ensure output has the SAME NUMBER of language sections
- Each language section MUST be rephrased in its own language (Spanish for :es:, English for :gb:, etc.)
- NEVER remove, merge, or skip any language section
- NEVER translate content between languages - each section stays in its original language

CRITICAL OUTPUT FORMAT RULES:
- Return JSON: { "result": "cleaned text" }
- The "result" value MUST ALWAYS be a single plain string
- NEVER return an object or nested structure as the result
- Keep all language markers (:es:, :gb:, etc.) INLINE within the string
- Multilingual content stays as one string with markers

EXAMPLE:
Input:
:es:
El parking está a 200m. Ver más info en https://example.com
:gb:
The parking is 200m away. More info at https://example.com

Output:
{ "result": ":es:\\nEl aparcamiento se encuentra a 200 metros.\\n:gb:\\nThe car park is located 200 meters away." }`,
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

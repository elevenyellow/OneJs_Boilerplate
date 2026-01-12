export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PromptBuilder<TInput, TOutput = string> {
  build(input: TInput): ChatMessage[]
  parseResponse?(response: string): TOutput
}

export interface CleanTextResult {
  result: string
}

import type { BetaItem } from './beta-item.interface'

export interface BetaKeyInfo {
  walkTime: string | null
  distance: string | null
  difficulty: string | null
}

export interface BetaSection {
  type: 'text' | 'list' | 'time' | 'distance' | 'difficulty' | 'warning' | 'tip'
  icon: string
  content: string
  color: string
}

export interface ParsedBetaItem {
  name: string
  originalMarkdown: string
  keyInfo: BetaKeyInfo
  warnings: string[]
  tips: string[]
  sections: BetaSection[]
}

// Emoji mapping from text codes to Unicode emojis
const EMOJI_MAP: Record<string, string> = {
  // Flags
  ':es:': '🇪🇸',
  ':gb:': '🇬🇧',
  ':us:': '🇺🇸',
  ':fr:': '🇫🇷',
  ':de:': '🇩🇪',
  ':it:': '🇮🇹',
  ':pt:': '🇵🇹',
  ':cn:': '🇨🇳',
  ':jp:': '🇯🇵',
  ':kr:': '🇰🇷',

  // Common emojis
  ':warning:': '⚠️',
  ':bulb:': '💡',
  ':check:': '✅',
  ':x:': '❌',
  ':star:': '⭐',
  ':fire:': '🔥',
  ':water:': '💧',
  ':sun:': '☀️',
  ':cloud:': '☁️',
  ':rain:': '🌧️',
  ':snow:': '❄️',
  ':wind:': '💨',
  ':mountain:': '⛰️',
  ':climbing:': '🧗',
  ':rope:': '🪢',
  ':carabiner:': '🔗',
  ':helmet:': '⛑️',
  ':backpack:': '🎒',
  ':compass:': '🧭',
  ':map:': '🗺️',
  ':pin:': '📍',
  ':car:': '🚗',
  ':bus:': '🚌',
  ':walk:': '🚶',
  ':time:': '⏰',
  ':calendar:': '📅',
  ':phone:': '📱',
  ':camera:': '📷',
  ':book:': '📖',
  ':pencil:': '✏️',
  ':heart:': '❤️',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':point_right:': '👉',
  ':point_left:': '👈',
  ':point_up:': '☝️',
  ':point_down:': '👇',
  ':ok_hand:': '👌',
  ':raised_hand:': '✋',
  ':muscle:': '💪',
  ':pray:': '🙏',
  ':clap:': '👏',
  ':wave:': '👋',

  // Climbing specific
  ':rock:': '🪨',
  ':stone:': '🪨',
  ':tree:': '🌲',
  ':forest:': '🌲',
  ':river:': '🏞️',
  ':waterfall:': '💦',
  ':trail:': '🥾',
  ':parking:': '🅿️',
  ':toilet:': '🚻',
  ':restaurant:': '🍽️',
  ':hotel:': '🏨',
  ':camping:': '🏕️',
  ':tent:': '⛺',
  ':shower:': '🚿',
  ':wifi:': '📶',
  ':signal:': '📶',
  ':battery:': '🔋',
  ':flashlight:': '🔦',
  ':first_aid:': '🩹',
  ':medicine:': '💊',
  ':bandage:': '🩹',

  // Directions
  ':left:': '⬅️',
  ':right:': '➡️',
  ':up:': '⬆️',
  ':down:': '⬇️',
  ':arrow_left:': '⬅️',
  ':arrow_right:': '➡️',
  ':arrow_up:': '⬆️',
  ':arrow_down:': '⬇️',

  // Weather
  ':sunny:': '☀️',
  ':cloudy:': '☁️',
  ':rainy:': '🌧️',
  ':snowy:': '❄️',
  ':windy:': '💨',
  ':foggy:': '🌫️',
  ':lightning:': '⚡',
  ':thunder:': '⚡',
  ':hot:': '🔥',
  ':cold:': '🥶',

  // Difficulty
  ':easy:': '🟢',
  ':medium:': '🟡',
  ':hard:': '🔴',
  ':expert:': '⚫',
  ':beginner:': '🟢',
  ':intermediate:': '🟡',
  ':advanced:': '🔴',

  // Other
  ':info:': 'ℹ️',
  ':question:': '❓',
  ':exclamation:': '❗',
  ':no_entry:': '⛔',
  ':prohibited:': '🚫',
  ':stop:': '🛑',
  ':caution:': '⚠️',
  ':attention:': '⚠️',
  ':danger:': '☠️',
  ':skull:': '☠️',
}

/**
 * Interface for Beta value objects from different packages
 * Used to create ParsedBeta instances
 */
interface BetaLike {
  getItems(): BetaItem[]
}

export class ParsedBeta {
  private readonly items: ParsedBetaItem[]

  private constructor(items: ParsedBetaItem[]) {
    this.items = items
  }

  static createFromBeta(beta: BetaLike): ParsedBeta {
    const items = beta.getItems().map((item) => this.parseItem(item))
    return new ParsedBeta(items)
  }

  private static parseItem(item: BetaItem): ParsedBetaItem {
    const markdown = item.markdown
    // Convert text emojis to Unicode emojis
    const processedMarkdown = this.replaceTextEmojis(markdown)

    return {
      name: item.name,
      originalMarkdown: markdown,
      keyInfo: this.extractKeyInfo(processedMarkdown),
      warnings: this.extractWarnings(processedMarkdown),
      tips: this.extractTips(processedMarkdown),
      sections: this.parseSections(processedMarkdown),
    }
  }

  private static replaceTextEmojis(text: string): string {
    let result = text
    // Replace all text emojis with Unicode emojis
    for (const [textEmoji, unicodeEmoji] of Object.entries(EMOJI_MAP)) {
      result = result.replaceAll(textEmoji, unicodeEmoji)
    }
    return result
  }

  private static extractKeyInfo(markdown: string): BetaKeyInfo {
    return {
      walkTime: this.extractWalkTime(markdown),
      distance: this.extractDistance(markdown),
      difficulty: this.extractDifficulty(markdown),
    }
  }

  private static extractWalkTime(markdown: string): string | null {
    const timeMatch = markdown.match(
      /(\d+\.?\d*)\s*(min|minutos|minutes|hora|horas|hour|hours)/i,
    )
    return timeMatch ? timeMatch[0] : null
  }

  private static extractDistance(markdown: string): string | null {
    const distanceMatch = markdown.match(
      /(\d+\.?\d*)\s*(m|km|metros|kilometers|metres)/i,
    )
    return distanceMatch ? distanceMatch[0] : null
  }

  private static extractDifficulty(markdown: string): string | null {
    const difficultyMatch = markdown.match(
      /\b(fácil|difícil|técnico|expuesto|easy|difficult|technical|exposed|steep|vertical)\b/i,
    )
    return difficultyMatch ? difficultyMatch[0] : null
  }

  private static extractWarnings(markdown: string): string[] {
    const warnings: string[] = []
    const lines = markdown.split('\n')

    for (const line of lines) {
      if (
        /\b(cuidado|peligro|atención|warning|danger|caution|importante|important)\b/i.test(
          line,
        )
      ) {
        warnings.push(line.trim().replace(/^[*\-•]\s*/, ''))
      }
    }

    return warnings
  }

  private static extractTips(markdown: string): string[] {
    const tips: string[] = []
    const lines = markdown.split('\n')

    for (const line of lines) {
      if (
        /\b(consejo|tip|recomendación|recommendation|nota|note)\b/i.test(line)
      ) {
        tips.push(line.trim().replace(/^[*\-•]\s*/, ''))
      }
    }

    return tips
  }

  private static parseSections(markdown: string): BetaSection[] {
    const sections: BetaSection[] = []
    const lines = markdown.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      const trimmed = line.trim()

      // Detectar tiempo
      if (/\d+\s*(min|minutos|minutes|hora|horas|hour|hours)/i.test(trimmed)) {
        sections.push({
          type: 'time',
          icon: 'time-outline',
          content: trimmed,
          color: '#14b8a6',
        })
        continue
      }

      // Detectar distancia
      if (/\d+\.?\d*\s*(m|km|metros|kilometers|metres)/i.test(trimmed)) {
        sections.push({
          type: 'distance',
          icon: 'navigate-outline',
          content: trimmed,
          color: '#14b8a6',
        })
        continue
      }

      // Detectar advertencias
      if (
        /\b(cuidado|peligro|atención|warning|danger|caution|importante|important)\b/i.test(
          trimmed,
        )
      ) {
        sections.push({
          type: 'warning',
          icon: 'warning-outline',
          content: trimmed.replace(/^[*\-•]\s*/, ''),
          color: '#f59e0b',
        })
        continue
      }

      // Detectar consejos
      if (
        /\b(consejo|tip|recomendación|recommendation|nota|note)\b/i.test(
          trimmed,
        )
      ) {
        sections.push({
          type: 'tip',
          icon: 'bulb-outline',
          content: trimmed.replace(/^[*\-•]\s*/, ''),
          color: '#3b82f6',
        })
        continue
      }

      // Detectar dificultad
      if (
        /\b(fácil|difícil|técnico|expuesto|easy|difficult|technical|exposed|steep|vertical)\b/i.test(
          trimmed,
        )
      ) {
        sections.push({
          type: 'difficulty',
          icon: 'trending-up-outline',
          content: trimmed.replace(/^[*\-•]\s*/, ''),
          color: '#ef4444',
        })
        continue
      }

      // Detectar listas
      if (/^[*\-•]\s/.test(trimmed)) {
        sections.push({
          type: 'list',
          icon: 'chevron-forward-outline',
          content: trimmed.replace(/^[*\-•]\s*/, ''),
          color: '#9ca3af',
        })
        continue
      }

      // Texto normal
      if (trimmed.length > 0) {
        sections.push({
          type: 'text',
          icon: 'document-text-outline',
          content: trimmed,
          color: '#d1d5db',
        })
      }
    }

    return sections
  }

  getItems(): ParsedBetaItem[] {
    return [...this.items]
  }

  getByName(name: string): ParsedBetaItem | null {
    return (
      this.items.find(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      ) || null
    )
  }

  hasData(): boolean {
    return this.items.length > 0
  }

  toJSON(): ParsedBetaItem[] {
    return this.getItems()
  }
}

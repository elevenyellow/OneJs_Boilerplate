import {
  ASCENT_STYLE,
  ASCENT_STYLE_LABELS,
  isValidAscentStyle,
  type AscentStyleValue,
} from '../mappings'

export class AscentStyle {
  private constructor(private readonly value: AscentStyleValue) {}

  static createFrom(value: number): AscentStyle {
    if (!isValidAscentStyle(value)) {
      throw new Error(`Invalid ascent style: ${value}. Must be 0-4.`)
    }
    return new AscentStyle(value)
  }

  static onsight(): AscentStyle {
    return new AscentStyle(ASCENT_STYLE.ONSIGHT)
  }

  static flash(): AscentStyle {
    return new AscentStyle(ASCENT_STYLE.FLASH)
  }

  static redpoint(): AscentStyle {
    return new AscentStyle(ASCENT_STYLE.REDPOINT)
  }

  static go(): AscentStyle {
    return new AscentStyle(ASCENT_STYLE.GO)
  }

  static toprope(): AscentStyle {
    return new AscentStyle(ASCENT_STYLE.TOPROPE)
  }

  getValue(): AscentStyleValue {
    return this.value
  }

  getLabel(): string {
    return ASCENT_STYLE_LABELS[this.value]
  }

  isOnsight(): boolean {
    return this.value === ASCENT_STYLE.ONSIGHT
  }

  isFlash(): boolean {
    return this.value === ASCENT_STYLE.FLASH
  }

  isRedpoint(): boolean {
    return this.value === ASCENT_STYLE.REDPOINT
  }

  isGo(): boolean {
    return this.value === ASCENT_STYLE.GO
  }

  isToprope(): boolean {
    return this.value === ASCENT_STYLE.TOPROPE
  }

  equals(other: AscentStyle): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.getLabel()
  }
}

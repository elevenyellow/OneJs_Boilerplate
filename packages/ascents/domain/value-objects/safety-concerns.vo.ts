import { SAFETY_CONCERN, SAFETY_CONCERN_LABELS } from '../mappings'

/**
 * Safety concerns as a bitmask value object.
 * Each concern is a power of 2 flag that can be combined.
 */
export class SafetyConcerns {
  private constructor(private readonly value: number) {}

  static createFrom(bitmask: number): SafetyConcerns {
    if (bitmask < 0) {
      throw new Error('SafetyConcerns bitmask cannot be negative')
    }
    return new SafetyConcerns(bitmask)
  }

  static none(): SafetyConcerns {
    return new SafetyConcerns(0)
  }

  static fromFlags(flags: number[]): SafetyConcerns {
    const bitmask = flags.reduce((acc, flag) => acc | flag, 0)
    return new SafetyConcerns(bitmask)
  }

  getValue(): number {
    return this.value
  }

  hasFlag(flag: number): boolean {
    return (this.value & flag) !== 0
  }

  hasLooseRock(): boolean {
    return this.hasFlag(SAFETY_CONCERN.LOOSE_ROCK)
  }

  hasHighFirstBolt(): boolean {
    return this.hasFlag(SAFETY_CONCERN.HIGH_FIRST_BOLT)
  }

  hasBadBolts(): boolean {
    return this.hasFlag(SAFETY_CONCERN.BAD_BOLTS)
  }

  hasBadAnchor(): boolean {
    return this.hasFlag(SAFETY_CONCERN.BAD_ANCHOR)
  }

  getActiveFlags(): number[] {
    const flags: number[] = []
    for (const flag of Object.values(SAFETY_CONCERN)) {
      if (this.hasFlag(flag)) {
        flags.push(flag)
      }
    }
    return flags
  }

  getLabels(): string[] {
    return this.getActiveFlags().map(
      (flag) =>
        SAFETY_CONCERN_LABELS[flag as keyof typeof SAFETY_CONCERN_LABELS],
    )
  }

  isEmpty(): boolean {
    return this.value === 0
  }

  hasConcerns(): boolean {
    return this.value > 0
  }

  equals(other: SafetyConcerns): boolean {
    return this.value === other.value
  }

  toString(): string {
    const labels = this.getLabels()
    return labels.length > 0 ? labels.join(', ') : 'none'
  }
}

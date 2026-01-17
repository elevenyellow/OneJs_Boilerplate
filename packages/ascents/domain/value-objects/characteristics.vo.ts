import { CHARACTERISTIC, CHARACTERISTIC_LABELS } from '../mappings'

/**
 * Route characteristics as a bitmask value object.
 * Each characteristic is a power of 2 flag that can be combined.
 */
export class Characteristics {
  private constructor(private readonly value: number) {}

  static createFrom(bitmask: number): Characteristics {
    if (bitmask < 0) {
      throw new Error('Characteristics bitmask cannot be negative')
    }
    return new Characteristics(bitmask)
  }

  static none(): Characteristics {
    return new Characteristics(0)
  }

  static fromFlags(flags: number[]): Characteristics {
    const bitmask = flags.reduce((acc, flag) => acc | flag, 0)
    return new Characteristics(bitmask)
  }

  getValue(): number {
    return this.value
  }

  hasFlag(flag: number): boolean {
    return (this.value & flag) !== 0
  }

  isCruxy(): boolean {
    return this.hasFlag(CHARACTERISTIC.CRUXY)
  }

  isAthletic(): boolean {
    return this.hasFlag(CHARACTERISTIC.ATHLETIC)
  }

  hasSlopers(): boolean {
    return this.hasFlag(CHARACTERISTIC.SLOPERS)
  }

  isEndurance(): boolean {
    return this.hasFlag(CHARACTERISTIC.ENDURANCE)
  }

  isTechnical(): boolean {
    return this.hasFlag(CHARACTERISTIC.TECHNICAL)
  }

  isCrimpy(): boolean {
    return this.hasFlag(CHARACTERISTIC.CRIMPY)
  }

  getActiveFlags(): number[] {
    const flags: number[] = []
    for (const flag of Object.values(CHARACTERISTIC)) {
      if (this.hasFlag(flag)) {
        flags.push(flag)
      }
    }
    return flags
  }

  getLabels(): string[] {
    return this.getActiveFlags().map(
      (flag) =>
        CHARACTERISTIC_LABELS[flag as keyof typeof CHARACTERISTIC_LABELS],
    )
  }

  isEmpty(): boolean {
    return this.value === 0
  }

  equals(other: Characteristics): boolean {
    return this.value === other.value
  }

  toString(): string {
    const labels = this.getLabels()
    return labels.length > 0 ? labels.join(', ') : 'none'
  }
}

export class GradeBand {
  private readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static createFrom(band: number | null | undefined): GradeBand {
    return new GradeBand(band ?? 0)
  }

  getValue(): number {
    return this.value
  }

  // Grade bands: 1=beginner, 2=intermediate, 3=advanced, 4=expert, 5=elite
  isBeginner(): boolean {
    return this.value === 1
  }

  isIntermediate(): boolean {
    return this.value === 2
  }

  isAdvanced(): boolean {
    return this.value === 3
  }

  isExpert(): boolean {
    return this.value === 4
  }

  isElite(): boolean {
    return this.value === 5
  }

  getLabel(): string {
    switch (this.value) {
      case 1: return 'Beginner'
      case 2: return 'Intermediate'
      case 3: return 'Advanced'
      case 4: return 'Expert'
      case 5: return 'Elite'
      default: return 'Unknown'
    }
  }

  getColorClass(): string {
    switch (this.value) {
      case 1: return 'gb1'
      case 2: return 'gb2'
      case 3: return 'gb3'
      case 4: return 'gb4'
      case 5: return 'gb5'
      default: return 'gb0'
    }
  }

  equals(other: GradeBand): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.getLabel()
  }
}

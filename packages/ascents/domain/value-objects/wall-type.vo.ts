import {
  WALL_TYPE,
  WALL_TYPE_LABELS,
  isValidWallType,
  type WallTypeValue,
} from '../mappings'

export class WallType {
  private constructor(private readonly value: WallTypeValue | null) {}

  static createFrom(value: number | null | undefined): WallType {
    if (value === null || value === undefined) {
      return new WallType(null)
    }
    if (!isValidWallType(value)) {
      throw new Error(`Invalid wall type: ${value}. Must be 0-3 or null.`)
    }
    return new WallType(value)
  }

  static none(): WallType {
    return new WallType(null)
  }

  static slab(): WallType {
    return new WallType(WALL_TYPE.SLAB)
  }

  static vertical(): WallType {
    return new WallType(WALL_TYPE.VERTICAL)
  }

  static overhang(): WallType {
    return new WallType(WALL_TYPE.OVERHANG)
  }

  static roof(): WallType {
    return new WallType(WALL_TYPE.ROOF)
  }

  getValue(): WallTypeValue | null {
    return this.value
  }

  getLabel(): string | null {
    if (this.value === null) return null
    return WALL_TYPE_LABELS[this.value]
  }

  isNone(): boolean {
    return this.value === null
  }

  isSlab(): boolean {
    return this.value === WALL_TYPE.SLAB
  }

  isVertical(): boolean {
    return this.value === WALL_TYPE.VERTICAL
  }

  isOverhang(): boolean {
    return this.value === WALL_TYPE.OVERHANG
  }

  isRoof(): boolean {
    return this.value === WALL_TYPE.ROOF
  }

  equals(other: WallType): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.getLabel() ?? 'none'
  }
}

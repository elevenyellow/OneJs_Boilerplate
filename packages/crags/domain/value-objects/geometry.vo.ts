export interface GeometryData {
  areasize?: number
  bbox?: string[]
  boundary?: number[][][]
  center?: number[]
  lat?: number
  long?: number
  point?: string[]
}

export class Geometry {
  private readonly data: GeometryData | null

  private constructor(data: GeometryData | null) {
    this.data = data
  }

  static createFrom(data: GeometryData | null | undefined): Geometry {
    return new Geometry(data || null)
  }

  static createEmpty(): Geometry {
    return new Geometry(null)
  }

  hasData(): boolean {
    return this.data !== null
  }

  getAreaSize(): number | null {
    return this.data?.areasize ?? null
  }

  getBbox(): string[] | null {
    return this.data?.bbox ?? null
  }

  getBoundary(): number[][][] | null {
    return this.data?.boundary ?? null
  }

  getCenter(): number[] | null {
    return this.data?.center ?? null
  }

  getLatitude(): number | null {
    return this.data?.lat ?? null
  }

  getLongitude(): number | null {
    return this.data?.long ?? null
  }

  getPoint(): string[] | null {
    return this.data?.point ?? null
  }

  toJSON(): GeometryData | null {
    return this.data
  }

  equals(other: Geometry): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data)
  }

  toString(): string {
    return JSON.stringify(this.data)
  }
}

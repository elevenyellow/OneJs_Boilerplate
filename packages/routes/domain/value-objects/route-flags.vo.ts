export interface RouteFlagsData {
  IsFree?: number
  IsSport?: number
  IsTrad?: number
  IsBoulder?: number
  IsAid?: number
  IsAlpine?: number
  IsMixed?: number
  IsIce?: number
  IsTopRope?: number
  [key: string]: number | undefined
}

export class RouteFlags {
  private readonly isFree: boolean
  private readonly isSport: boolean
  private readonly isTrad: boolean
  private readonly isBoulder: boolean
  private readonly isAid: boolean
  private readonly isAlpine: boolean
  private readonly isMixed: boolean
  private readonly isIce: boolean
  private readonly isTopRope: boolean

  private constructor(
    isFree: boolean,
    isSport: boolean,
    isTrad: boolean,
    isBoulder: boolean,
    isAid: boolean,
    isAlpine: boolean,
    isMixed: boolean,
    isIce: boolean,
    isTopRope: boolean,
  ) {
    this.isFree = isFree
    this.isSport = isSport
    this.isTrad = isTrad
    this.isBoulder = isBoulder
    this.isAid = isAid
    this.isAlpine = isAlpine
    this.isMixed = isMixed
    this.isIce = isIce
    this.isTopRope = isTopRope
  }

  static createFrom(flags: RouteFlagsData | null | undefined): RouteFlags {
    if (!flags) return RouteFlags.createEmpty()
    return new RouteFlags(
      !!flags.IsFree,
      !!flags.IsSport,
      !!flags.IsTrad,
      !!flags.IsBoulder,
      !!flags.IsAid,
      !!flags.IsAlpine,
      !!flags.IsMixed,
      !!flags.IsIce,
      !!flags.IsTopRope,
    )
  }

  static createFromBooleans(
    isFree: boolean,
    isSport: boolean,
    isTrad: boolean,
    isBoulder: boolean,
    isAid: boolean,
    isAlpine: boolean,
    isMixed: boolean,
    isIce: boolean,
    isTopRope: boolean,
  ): RouteFlags {
    return new RouteFlags(
      isFree,
      isSport,
      isTrad,
      isBoulder,
      isAid,
      isAlpine,
      isMixed,
      isIce,
      isTopRope,
    )
  }

  static createEmpty(): RouteFlags {
    return new RouteFlags(false, false, false, false, false, false, false, false, false)
  }

  getIsFree(): boolean { return this.isFree }
  getIsSport(): boolean { return this.isSport }
  getIsTrad(): boolean { return this.isTrad }
  getIsBoulder(): boolean { return this.isBoulder }
  getIsAid(): boolean { return this.isAid }
  getIsAlpine(): boolean { return this.isAlpine }
  getIsMixed(): boolean { return this.isMixed }
  getIsIce(): boolean { return this.isIce }
  getIsTopRope(): boolean { return this.isTopRope }

  getPrimaryStyle(): string {
    if (this.isSport) return 'Sport'
    if (this.isTrad) return 'Trad'
    if (this.isBoulder) return 'Boulder'
    if (this.isAid) return 'Aid'
    if (this.isAlpine) return 'Alpine'
    if (this.isMixed) return 'Mixed'
    if (this.isIce) return 'Ice'
    if (this.isTopRope) return 'Top Rope'
    return 'Unknown'
  }

  getActiveFlags(): string[] {
    const flags: string[] = []
    if (this.isFree) flags.push('Free')
    if (this.isSport) flags.push('Sport')
    if (this.isTrad) flags.push('Trad')
    if (this.isBoulder) flags.push('Boulder')
    if (this.isAid) flags.push('Aid')
    if (this.isAlpine) flags.push('Alpine')
    if (this.isMixed) flags.push('Mixed')
    if (this.isIce) flags.push('Ice')
    if (this.isTopRope) flags.push('Top Rope')
    return flags
  }

  equals(other: RouteFlags): boolean {
    return (
      this.isFree === other.isFree &&
      this.isSport === other.isSport &&
      this.isTrad === other.isTrad &&
      this.isBoulder === other.isBoulder &&
      this.isAid === other.isAid &&
      this.isAlpine === other.isAlpine &&
      this.isMixed === other.isMixed &&
      this.isIce === other.isIce &&
      this.isTopRope === other.isTopRope
    )
  }

  toString(): string {
    return this.getActiveFlags().join(', ')
  }
}

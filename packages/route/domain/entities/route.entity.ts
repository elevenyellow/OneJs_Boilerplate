import { ExternalId, Grade, Name } from '@climb-zone/shared'
import { RouteId } from '../value-objects/route-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { Height } from '../value-objects/height.vo'
import { Rating } from '../value-objects/rating.vo'
import { Pitches } from '../value-objects/pitches.vo'
import { Bolts } from '../value-objects/bolts.vo'
import { Quality } from '../value-objects/quality.vo'
import { Ascents } from '../value-objects/ascents.vo'
import { FirstAscent } from '../value-objects/first-ascent.vo'
import { RouteType } from '../value-objects/route-type.vo'
import { Tags } from '../value-objects/tags.vo'
import { Warnings } from '../value-objects/warnings.vo'
import { TopoNumber } from '../value-objects/topo-number.vo'

/**
 * Route Entity - Represents an individual climbing route
 * Contains all details about a single route within a sector
 */
export class RouteEntity {
  constructor(
    public readonly id: RouteId,
    public readonly externalId: ExternalId,
    public readonly sectorId: SectorId,
    public readonly name: Name,
    public readonly grade: Grade | null,
    public readonly height: Height | null,
    public readonly pitches: Pitches | null,
    public readonly bolts: Bolts | null,
    public readonly rating: Rating | null,
    public readonly quality: Quality | null,
    public readonly ascents: Ascents | null,
    public readonly routeType: RouteType | null,
    public readonly firstAscent: FirstAscent | null,
    public readonly tags: Tags,
    public readonly warnings: Warnings,
    public readonly topoNumber: TopoNumber | null = null,
    public readonly createdAt: Date = new Date(),
  ) {}

  get gradeIndex(): number | null {
    return this.grade?.index ?? null
  }

  get gradeString(): string | null {
    return this.grade?.value ?? null
  }

  isInGradeRange(minGrade: string, maxGrade: string): boolean {
    if (!this.grade) return false

    const minIndex = Grade.calculateIndexFromString(minGrade)
    const maxIndex = Grade.calculateIndexFromString(maxGrade)

    if (minIndex === null || maxIndex === null) return true

    return this.grade.index >= minIndex && this.grade.index <= maxIndex
  }

  isClassic(): boolean {
    return this.rating?.isClassic() ?? false
  }

  isSport(): boolean {
    return (
      this.routeType?.isSport() ?? (this.bolts !== null && this.bolts.toNumber() > 0)
    )
  }

  isMultiPitch(): boolean {
    return this.pitches?.isMultiPitch() ?? this.height?.isMultiPitch() ?? false
  }

  hasWarnings(): boolean {
    return this.warnings.hasWarnings()
  }

  getDisplayHeight(): string | null {
    return this.height?.toString() ?? null
  }

  /**
   * Check if this route has a topo number assigned
   */
  hasTopoNumber(): boolean {
    return this.topoNumber !== null
  }

  /**
   * Get the topo number for display
   */
  getTopoNumberDisplay(): string | null {
    return this.topoNumber?.toString() ?? null
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toNumber(),
      sectorId: this.sectorId.toString(),
      name: this.name.toString(),
      grade: this.gradeString,
      gradeIndex: this.gradeIndex,
      height: this.height?.toNumber() ?? null,
      pitches: this.pitches?.toNumber() ?? null,
      bolts: this.bolts?.toNumber() ?? null,
      rating: this.rating?.toNumber() ?? null,
      quality: this.quality?.toNumber() ?? null,
      ascents: this.ascents?.toNumber() ?? null,
      routeType: this.routeType?.toString() ?? null,
      firstAscent: this.firstAscent?.toString() ?? null,
      tags: this.tags.toJSON(),
      warnings: this.warnings.toJSON(),
      topoNumber: this.topoNumber?.toString() ?? null,
      createdAt: this.createdAt,
    }
  }
}

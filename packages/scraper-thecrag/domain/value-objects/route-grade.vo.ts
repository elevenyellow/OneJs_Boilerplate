/**
 * Value Object representing a climbing route grade.
 * Contains the grade string (e.g., "6b+", "7a") and the grade class (e.g., "gb3", "gb4")
 * which is used for color coding in topo visualizations.
 *
 * Grade bands:
 * - gb1: Easy (grades 1-4)
 * - gb2: Moderate (grades 5a-5c)
 * - gb3: Intermediate (grades 6a-6b)
 * - gb4: Difficult (grades 6c-7a)
 * - gb5: Hard (grades 7b-7c)
 * - gb6: Very Hard (grades 8a-8b)
 * - gb7: Elite (grades 8c-9a)
 * - gb8: Super Elite (grades 9a+)
 */
export class RouteGrade {
  private static readonly GRADE_COLORS: Record<string, string> = {
    gb1: '#4CAF50', // Easy - Green
    gb2: '#8BC34A', // Moderate - Light Green
    gb3: '#FFC107', // Intermediate - Yellow/Amber
    gb4: '#FF9800', // Difficult - Orange
    gb5: '#FF5722', // Hard - Deep Orange
    gb6: '#F44336', // Very Hard - Red
    gb7: '#9C27B0', // Elite - Purple
    gb8: '#673AB7', // Super Elite - Deep Purple
  }

  private static readonly DEFAULT_COLOR = '#808080' // Gray for unknown

  private constructor(
    private readonly grade: string,
    private readonly gradeClass: string,
  ) {}

  /**
   * Creates a RouteGrade from user input.
   */
  static create(grade: string, gradeClass: string): RouteGrade {
    return new RouteGrade(grade, gradeClass)
  }

  /**
   * Creates a RouteGrade from trusted source (e.g., database).
   */
  static createFrom(grade: string, gradeClass: string): RouteGrade {
    return new RouteGrade(grade, gradeClass)
  }

  getGrade(): string {
    return this.grade
  }

  getGradeClass(): string {
    return this.gradeClass
  }

  /**
   * Returns the color associated with this grade band.
   */
  getColor(): string {
    return RouteGrade.GRADE_COLORS[this.gradeClass] ?? RouteGrade.DEFAULT_COLOR
  }

  /**
   * Returns the grade band number (1-8) from the grade class.
   * Returns 0 if the grade class is unknown.
   */
  getBand(): number {
    const match = this.gradeClass.match(/^gb(\d+)$/)
    return match ? Number.parseInt(match[1], 10) : 0
  }

  /**
   * Returns true if the grade is easy (bands 1-2).
   */
  isEasy(): boolean {
    const band = this.getBand()
    return band >= 1 && band <= 2
  }

  /**
   * Returns true if the grade is intermediate (bands 3-4).
   */
  isIntermediate(): boolean {
    const band = this.getBand()
    return band >= 3 && band <= 4
  }

  /**
   * Returns true if the grade is hard (bands 5-6).
   */
  isHard(): boolean {
    const band = this.getBand()
    return band >= 5 && band <= 6
  }

  /**
   * Returns true if the grade is elite (bands 7-8).
   */
  isElite(): boolean {
    const band = this.getBand()
    return band >= 7 && band <= 8
  }

  /**
   * Returns true if the grade is in the specified band.
   */
  isInBand(band: number): boolean {
    return this.getBand() === band
  }

  equals(other: RouteGrade): boolean {
    return this.grade === other.grade && this.gradeClass === other.gradeClass
  }

  toString(): string {
    return this.grade
  }
}

/**
 * Represents a single user comment on a route.
 */
export interface RouteComment {
  /** Author of the comment */
  author: string
  /** Comment text content */
  text: string
  /** Date of the comment (ISO string or formatted date) */
  date: string | null
  /** Rating given with the comment (e.g., stars) */
  rating: number | null
  /** Type of comment (e.g., "beta", "condition", "general") */
  type: string | null
}

/**
 * Value Object representing user comments and feedback on a route.
 * Contains all comments, beta tips, and condition reports from users.
 */
export class RouteComments {
  private constructor(private readonly comments: RouteComment[]) {}

  /**
   * Creates RouteComments from an array of comment data.
   */
  static fromCommentsArray(
    comments: Array<{
      author?: string
      text?: string
      date?: string
      rating?: number
      type?: string
    }>,
  ): RouteComments {
    if (!comments || !Array.isArray(comments)) {
      return RouteComments.empty()
    }

    const parsedComments: RouteComment[] = comments
      .filter((c) => c.text && c.text.trim().length > 0)
      .map((c) => ({
        author: c.author ?? 'Anonymous',
        text: c.text?.trim() ?? '',
        date: c.date ?? null,
        rating: c.rating ?? null,
        type: c.type ?? null,
      }))

    return new RouteComments(parsedComments)
  }

  /**
   * Creates an empty RouteComments.
   */
  static empty(): RouteComments {
    return new RouteComments([])
  }

  /**
   * Returns all comments.
   */
  getComments(): RouteComment[] {
    return [...this.comments]
  }

  /**
   * Returns the number of comments.
   */
  getCount(): number {
    return this.comments.length
  }

  /**
   * Returns true if there are any comments.
   */
  hasComments(): boolean {
    return this.comments.length > 0
  }

  /**
   * Returns comments filtered by type.
   */
  getCommentsByType(type: string): RouteComment[] {
    return this.comments.filter(
      (c) => c.type?.toLowerCase() === type.toLowerCase(),
    )
  }

  /**
   * Returns beta tips (comments about how to climb the route).
   */
  getBetaTips(): RouteComment[] {
    return this.comments.filter(
      (c) =>
        c.type?.toLowerCase() === 'beta' ||
        c.text.toLowerCase().includes('beta') ||
        c.text.toLowerCase().includes('crux') ||
        c.text.toLowerCase().includes('hold'),
    )
  }

  /**
   * Returns condition reports (comments about route conditions).
   */
  getConditionReports(): RouteComment[] {
    return this.comments.filter(
      (c) =>
        c.type?.toLowerCase() === 'condition' ||
        c.text.toLowerCase().includes('condition') ||
        c.text.toLowerCase().includes('wet') ||
        c.text.toLowerCase().includes('dry') ||
        c.text.toLowerCase().includes('dirty'),
    )
  }

  /**
   * Returns the most recent comments.
   */
  getRecentComments(limit = 5): RouteComment[] {
    return this.comments
      .filter((c) => c.date !== null)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      })
      .slice(0, limit)
  }

  /**
   * Returns the average rating from comments that have ratings.
   */
  getAverageRating(): number | null {
    const ratingsWithValues = this.comments.filter((c) => c.rating !== null)
    if (ratingsWithValues.length === 0) return null

    const sum = ratingsWithValues.reduce((acc, c) => acc + (c.rating ?? 0), 0)
    return sum / ratingsWithValues.length
  }

  /**
   * Returns all unique authors.
   */
  getAuthors(): string[] {
    return [...new Set(this.comments.map((c) => c.author))]
  }

  equals(other: RouteComments): boolean {
    if (this.comments.length !== other.comments.length) return false

    return this.comments.every((c, i) => {
      const o = other.comments[i]
      return c.author === o.author && c.text === o.text && c.date === o.date
    })
  }

  toString(): string {
    return `RouteComments(${this.comments.length} comments)`
  }

  toDto(): RouteComment[] {
    return [...this.comments]
  }
}

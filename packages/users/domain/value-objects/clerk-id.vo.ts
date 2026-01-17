/**
 * Clerk ID value object.
 * Clerk IDs are strings that start with "user_" followed by alphanumeric characters.
 * Example: "user_2abc123xyz"
 */
export class ClerkId {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static createFrom(clerkId: string): ClerkId {
    if (!clerkId || clerkId.trim().length === 0) {
      throw new Error('ClerkId cannot be empty')
    }

    // Clerk IDs typically start with "user_" followed by alphanumeric characters
    // This is a basic validation - adjust if Clerk's format is different
    if (!clerkId.startsWith('user_')) {
      throw new Error(`Invalid ClerkId format: ${clerkId}. Clerk IDs should start with "user_"`)
    }

    if (clerkId.length < 6) {
      throw new Error(`Invalid ClerkId format: ${clerkId}. Clerk IDs must be at least 6 characters`)
    }

    return new ClerkId(clerkId)
  }

  getValue(): string {
    return this.value
  }

  equals(other: ClerkId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

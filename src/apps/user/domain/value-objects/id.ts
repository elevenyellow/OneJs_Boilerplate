import { v4 as uuidv4 } from 'uuid'

export class Id {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static generateUniqueId(): Id {
    return new Id(uuidv4())
  }

  static createFrom(id: string): Id {
    if (!this.isValidIdentifier(id)) {
      throw new Error('Invalid Id format')
    }
    return new Id(id)
  }

  private static isValidIdentifier(id: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    return uuidRegex.test(id)
  }

  equals(other: Id): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

export abstract class DomainEntityBase {
  id?: string
  createdAt?: Date
  updatedAt?: Date

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  touch() {
    this.updatedAt = new Date()
  }
}

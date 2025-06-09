export abstract class DomainEvent {
  occurredOn: Date

  constructor(occurredOn: Date = new Date()) {
    this.occurredOn = occurredOn
  }

  getOccurredOn() {
    return this.occurredOn
  }
}

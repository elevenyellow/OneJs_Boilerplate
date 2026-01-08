import { DomainEvent } from '@OneJs/event-bus'
import type { ScrapeResult } from '@scraper-thecrag/infrastructure/scrapers/thecrag.scraper'

export class ZonesScrapedEvent extends DomainEvent {
  constructor(
    public readonly result: ScrapeResult,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }

  get zonesCount(): number {
    return this.result.stats.zonesFound
  }

  get hasErrors(): boolean {
    return this.result.errors.length > 0
  }

  get errorCount(): number {
    return this.result.errors.length
  }
}



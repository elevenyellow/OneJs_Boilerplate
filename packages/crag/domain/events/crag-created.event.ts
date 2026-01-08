export class CragCreatedEvent {
  public readonly name = 'crag.created'

  constructor(
    public readonly cragId: string,
    public readonly externalId: number,
    public readonly cragName: string,
    public readonly country: string,
  ) {}
}

export class CragUpdatedEvent {
  public readonly name = 'crag.updated'

  constructor(
    public readonly cragId: string,
    public readonly externalId: number,
    public readonly cragName: string,
  ) {}
}

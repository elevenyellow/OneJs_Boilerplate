export interface CragAreaData {
  id: string
  name: string
  urlStub: string
  urlAncestorStub: string
  subAreaCount?: number
  subType?: string
  asciiName?: string
  routesCount?: number
}

export class CragAreaDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly url: string,
    public readonly type: string,
    public readonly routesCount: number,
  ) {}

  static fromApiData(data: CragAreaData): CragAreaDto {
    const url = `https://www.thecrag.com${data.urlAncestorStub}${data.urlStub}`
    return new CragAreaDto(
      data.id,
      data.name,
      url,
      data.subType || 'Area',
      data.subAreaCount || data.routesCount || 0
    )
  }
}


export interface ZoneDto {
  id: string
  externalId: string
  name: string
  asciiName: string | null
  type: string
  urlStub: string | null
  urlAncestorStub: string | null
  parentId: string | null
  depth: number
  createdAt: Date
  updatedAt: Date
  href: string | null
  position: number
}

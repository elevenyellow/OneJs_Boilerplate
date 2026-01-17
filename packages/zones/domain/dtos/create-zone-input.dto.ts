export interface CreateZoneInput {
  externalId: string | number
  name: string
  asciiName?: string | null
  type?: string
  urlStub?: string | null
  urlAncestorStub?: string | null
  parentId?: string | null
  depth?: number
  href?: string | null
  position?: number
}

/**
 * Beta item data interface
 * Shared between sectors and crags packages for parsed beta information
 */
export interface BetaItem {
  markdown: string
  name: string
  inheritedFrom?: {
    id: string
    urlAncestorStub: string
  }
}

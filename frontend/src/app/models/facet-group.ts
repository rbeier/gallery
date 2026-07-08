import type { FacetKind } from './facet-kind'

export interface FacetGroup {
  kind: FacetKind
  label: string
  options: string[]
}
